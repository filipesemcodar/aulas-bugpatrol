-- CRM do curso "Como resolver bugs automaticamente": estrutura do banco (sem dados).
-- Como usar: no Supabase, abra SQL Editor, cole este arquivo inteiro e clique em Run.
-- Cria tabelas, regras de acesso (RLS), funcoes e gatilhos. Rode uma vez, num projeto novo.

-- schemas

create schema if not exists private;

-- tipos

create type public.user_role as enum ('owner', 'admin', 'member');
create type public.lead_source as enum ('whatsapp', 'manual');
create type public.message_direction as enum ('inbound', 'outbound');
create type public.message_status as enum ('sent', 'delivered', 'read', 'scheduled');
create type public.scheduled_message_status as enum ('pending', 'processing', 'sent', 'failed', 'canceled');

-- tabelas

create table public.kanban_columns (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  color text not null,
  "position" integer not null default 0,
  is_default boolean not null default false,
  is_protected boolean not null default false,
  automation jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.leads (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  column_id uuid not null,
  name text not null,
  phone text not null,
  avatar_url text,
  source lead_source not null default 'manual'::lead_source,
  column_entered_at timestamp with time zone not null default now(),
  last_message_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.messages (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  lead_id uuid not null,
  direction message_direction not null,
  status message_status not null default 'sent'::message_status,
  content text not null,
  is_automated boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table public.organizations (
  id uuid not null default gen_random_uuid(),
  name text not null,
  whatsapp_connected boolean not null default false,
  whatsapp_phone_number text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  plan text not null default 'free'::text,
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamp with time zone
);

create table public.profiles (
  id uuid not null,
  organization_id uuid not null,
  name text not null,
  email text not null,
  avatar_url text,
  role user_role not null default 'member'::user_role,
  created_at timestamp with time zone not null default now()
);

create table public.scheduled_messages (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  lead_id uuid not null,
  column_id uuid not null,
  message_content text not null,
  send_at timestamp with time zone not null,
  status scheduled_message_status not null default 'pending'::scheduled_message_status,
  attempts integer not null default 0,
  last_error text,
  ibeiazap_message_id text,
  sent_message_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.whatsapp_instances (
  organization_id uuid not null,
  instance_id text not null,
  connected boolean not null default false,
  logged_in boolean not null default false,
  jid text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  webhook_secret text
);

-- restricoes

alter table public.kanban_columns add constraint kanban_columns_pkey PRIMARY KEY (id);
alter table public.leads add constraint leads_pkey PRIMARY KEY (id);
alter table public.messages add constraint messages_pkey PRIMARY KEY (id);
alter table public.organizations add constraint organizations_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.scheduled_messages add constraint scheduled_messages_pkey PRIMARY KEY (id);
alter table public.whatsapp_instances add constraint whatsapp_instances_pkey PRIMARY KEY (organization_id);
alter table public.whatsapp_instances add constraint whatsapp_instances_instance_id_key UNIQUE (instance_id);
alter table public.organizations add constraint organizations_plan_check CHECK ((plan = ANY (ARRAY['free'::text, 'paid'::text])));
alter table public.kanban_columns add constraint kanban_columns_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.leads add constraint leads_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE RESTRICT;
alter table public.leads add constraint leads_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.scheduled_messages add constraint scheduled_messages_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE;
alter table public.scheduled_messages add constraint scheduled_messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table public.scheduled_messages add constraint scheduled_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.scheduled_messages add constraint scheduled_messages_sent_message_id_fkey FOREIGN KEY (sent_message_id) REFERENCES messages(id);
alter table public.whatsapp_instances add constraint whatsapp_instances_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- indices

CREATE INDEX scheduled_messages_lead_idx ON public.scheduled_messages USING btree (lead_id);
CREATE INDEX messages_lead_id_idx ON public.messages USING btree (lead_id);
CREATE INDEX profiles_organization_id_idx ON public.profiles USING btree (organization_id);
CREATE INDEX scheduled_messages_organization_id_idx ON public.scheduled_messages USING btree (organization_id);
CREATE INDEX leads_column_id_idx ON public.leads USING btree (column_id);
CREATE INDEX scheduled_messages_due_idx ON public.scheduled_messages USING btree (send_at) WHERE (status = 'pending'::scheduled_message_status);
CREATE INDEX leads_organization_id_idx ON public.leads USING btree (organization_id);
CREATE INDEX scheduled_messages_column_id_idx ON public.scheduled_messages USING btree (column_id);
CREATE INDEX scheduled_messages_sent_message_id_idx ON public.scheduled_messages USING btree (sent_message_id);
CREATE INDEX kanban_columns_organization_id_idx ON public.kanban_columns USING btree (organization_id);
CREATE INDEX messages_organization_id_idx ON public.messages USING btree (organization_id);

-- funcoes

CREATE OR REPLACE FUNCTION private.get_my_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select organization_id from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION private.get_my_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.claim_due_scheduled_messages(batch_size integer DEFAULT 25)
 RETURNS SETOF scheduled_messages
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  update public.scheduled_messages
  set status = 'processing', updated_at = now()
  where id in (
    select id from public.scheduled_messages
    where status = 'pending' and send_at <= now()
    order by send_at
    limit batch_size
    for update skip locked
  )
  returning *;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_column_plan_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  org_plan text;
  non_protected_count integer;
begin
  if new.is_protected then
    return new;
  end if;

  select plan into org_plan
  from public.organizations
  where id = new.organization_id;

  if org_plan = 'free' then
    select count(*) into non_protected_count
    from public.kanban_columns
    where organization_id = new.organization_id
      and is_protected = false;

    if non_protected_count >= 1 then
      raise exception 'Limite de colunas do plano gratuito atingido. Faça upgrade para o plano pago para criar mais colunas.';
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_org_id uuid;
begin
  if new.raw_user_meta_data ? 'company_name' then
    insert into organizations (name)
    values (coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'Minha Empresa'))
    returning id into new_org_id;

    insert into profiles (id, organization_id, name, email, role)
    values (
      new.id,
      new_org_id,
      coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
      new.email,
      'owner'
    );
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.mover_lead(p_lead_id uuid, p_column_id uuid, p_preview boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_lead record;
  v_column record;
  v_current_column public.leads.column_id%type;
  v_automation jsonb;
  v_unit interval;
  v_company text;
  v_message text;
  v_send_at timestamptz;
  v_canceled integer;
begin
  select id, organization_id, name, phone
    into v_lead
    from public.leads
   where id = p_lead_id;
  if not found then
    return jsonb_build_object('status', 'lead_not_found');
  end if;

  select id, organization_id, name, automation
    into v_column
    from public.kanban_columns
   where id = p_column_id;
  if not found or v_column.organization_id is distinct from v_lead.organization_id then
    return jsonb_build_object('status', 'stage_not_found');
  end if;

  -- Lock the lead so concurrent moves of the same lead run one after the
  -- other. Under RLS, FOR UPDATE only returns rows the caller may update, so
  -- a preview also tells a caller who may not move the lead.
  select column_id
    into v_current_column
    from public.leads
   where id = p_lead_id
     for update;
  if not found then
    raise exception 'Sem permissão para mover este lead.'
      using errcode = 'insufficient_privilege';
  end if;

  -- As on the CRM screen, moving a lead to its own stage does nothing.
  if v_current_column is not distinct from p_column_id then
    return jsonb_build_object('status', 'unchanged', 'stage', v_column.name);
  end if;

  if p_preview then
    select count(*)
      into v_canceled
      from public.scheduled_messages
     where lead_id = p_lead_id
       and status = 'pending';
  else
    update public.leads
       set column_id = p_column_id,
           column_entered_at = now()
     where id = p_lead_id;
    -- An UPDATE that RLS rejects changes no row instead of failing.
    if not found then
      raise exception 'Sem permissão para mover este lead.'
        using errcode = 'insufficient_privilege';
    end if;

    update public.scheduled_messages
       set status = 'canceled'
     where lead_id = p_lead_id
       and status = 'pending';
    get diagnostics v_canceled = row_count;
  end if;

  v_automation := v_column.automation;
  if coalesce((v_automation ->> 'enabled')::boolean, false) then
    -- The screen counts a day as 24 hours (computeSendAt).
    v_unit := case v_automation ->> 'delay_unit'
      when 'minutes' then interval '1 minute'
      when 'hours' then interval '1 hour'
      when 'days' then interval '24 hours'
    end;
    if v_unit is null then
      raise exception 'Unidade de atraso inválida na automação da etapa %.', v_column.name
        using errcode = 'invalid_parameter_value';
    end if;
    v_send_at := now()
      + coalesce((v_automation ->> 'delay_value')::double precision, 0) * v_unit;

    select name
      into v_company
      from public.organizations
     where id = v_lead.organization_id;

    -- Same variables and order as renderTemplate in the CRM screen.
    v_message := replace(
      replace(
        replace(
          coalesce(v_automation ->> 'message_template', ''),
          '{{nome}}', coalesce(v_lead.name, '')
        ),
        '{{telefone}}', coalesce(v_lead.phone, '')
      ),
      '{{empresa}}', coalesce(v_company, '')
    );

    if not p_preview then
      insert into public.scheduled_messages
        (organization_id, lead_id, column_id, message_content, send_at)
      values
        (v_lead.organization_id, p_lead_id, p_column_id, v_message, v_send_at);
    end if;
  end if;

  return jsonb_build_object(
    'status', case when p_preview then 'preview' else 'moved' end,
    'stage', v_column.name,
    case when p_preview then 'to_cancel' else 'canceled' end, v_canceled,
    'scheduled', case
      when v_message is null then null
      else jsonb_build_object('message', v_message, 'send_at', v_send_at)
    end
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_column_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if TG_OP = 'DELETE' then
    if old.is_protected then
      raise exception 'Não é possível excluir uma coluna protegida';
    end if;
    return old;
  end if;

  if old.is_protected and new.name <> old.name then
    raise exception 'Não é possível renomear uma coluna protegida';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_owner_removal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  owner_count integer;
begin
  if old.id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  if old.role = 'owner' then
    select count(*) into owner_count
    from profiles
    where organization_id = old.organization_id and role = 'owner';

    if owner_count <= 1 then
      raise exception 'Não é possível remover o único owner da organização';
    end if;
  end if;

  return old;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.seed_default_kanban_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.kanban_columns (
    organization_id, name, color, position, is_default, is_protected, automation
  )
  values (
    new.id, 'Novo Lead', '#64748b', 0, true, true, null
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

-- permissoes do schema private (as policies chamam funcoes dele)

grant usage on schema private to authenticated;
grant EXECUTE on function private.get_my_organization_id() to authenticated;
grant EXECUTE on function private.get_my_role() to authenticated;

-- RLS

alter table public.kanban_columns enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.whatsapp_instances enable row level security;

-- policies

create policy "columns: delete own org" on public.kanban_columns as PERMISSIVE for DELETE to public using ((organization_id = private.get_my_organization_id()));
create policy "columns: insert own org" on public.kanban_columns as PERMISSIVE for INSERT to public with check ((organization_id = private.get_my_organization_id()));
create policy "columns: select own org" on public.kanban_columns as PERMISSIVE for SELECT to public using ((organization_id = private.get_my_organization_id()));
create policy "columns: update own org" on public.kanban_columns as PERMISSIVE for UPDATE to public using ((organization_id = private.get_my_organization_id())) with check ((organization_id = private.get_my_organization_id()));
create policy "leads: delete own org" on public.leads as PERMISSIVE for DELETE to public using ((organization_id = private.get_my_organization_id()));
create policy "leads: insert own org" on public.leads as PERMISSIVE for INSERT to public with check ((organization_id = private.get_my_organization_id()));
create policy "leads: select own org" on public.leads as PERMISSIVE for SELECT to public using ((organization_id = private.get_my_organization_id()));
create policy "leads: update own org" on public.leads as PERMISSIVE for UPDATE to public using ((organization_id = private.get_my_organization_id())) with check ((organization_id = private.get_my_organization_id()));
create policy "messages: delete own org" on public.messages as PERMISSIVE for DELETE to public using ((organization_id = private.get_my_organization_id()));
create policy "messages: insert own org" on public.messages as PERMISSIVE for INSERT to public with check ((organization_id = private.get_my_organization_id()));
create policy "messages: select own org" on public.messages as PERMISSIVE for SELECT to public using ((organization_id = private.get_my_organization_id()));
create policy "messages: update own org" on public.messages as PERMISSIVE for UPDATE to public using ((organization_id = private.get_my_organization_id())) with check ((organization_id = private.get_my_organization_id()));
create policy "org: select own" on public.organizations as PERMISSIVE for SELECT to public using ((id = private.get_my_organization_id()));
create policy "org: update own" on public.organizations as PERMISSIVE for UPDATE to public using ((id = private.get_my_organization_id())) with check ((id = private.get_my_organization_id()));
create policy "profiles: owners and admins delete" on public.profiles as PERMISSIVE for DELETE to public using (((organization_id = private.get_my_organization_id()) AND (private.get_my_role() = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))));
create policy "profiles: owners and admins update" on public.profiles as PERMISSIVE for UPDATE to public using (((organization_id = private.get_my_organization_id()) AND (private.get_my_role() = ANY (ARRAY['owner'::user_role, 'admin'::user_role])))) with check (((organization_id = private.get_my_organization_id()) AND ((role <> 'owner'::user_role) OR (private.get_my_role() = 'owner'::user_role))));
create policy "profiles: select same org" on public.profiles as PERMISSIVE for SELECT to public using ((organization_id = private.get_my_organization_id()));
create policy "scheduled_messages: cancel own org" on public.scheduled_messages as PERMISSIVE for UPDATE to public using (((organization_id = private.get_my_organization_id()) AND (status = 'pending'::scheduled_message_status))) with check (((organization_id = private.get_my_organization_id()) AND (status = 'canceled'::scheduled_message_status)));
create policy "scheduled_messages: insert own org" on public.scheduled_messages as PERMISSIVE for INSERT to public with check ((organization_id = private.get_my_organization_id()));
create policy "scheduled_messages: select own org" on public.scheduled_messages as PERMISSIVE for SELECT to public using ((organization_id = private.get_my_organization_id()));

-- triggers

CREATE TRIGGER enforce_column_plan_limit BEFORE INSERT ON public.kanban_columns FOR EACH ROW EXECUTE FUNCTION enforce_column_plan_limit();
CREATE TRIGGER protect_column_mutation BEFORE DELETE OR UPDATE ON public.kanban_columns FOR EACH ROW EXECUTE FUNCTION protect_column_mutation();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.kanban_columns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER seed_default_kanban_column AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION seed_default_kanban_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER protect_owner_removal BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_owner_removal();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scheduled_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
