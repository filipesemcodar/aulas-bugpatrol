import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { renderTemplate, describeDelay, computeSendAt } from "@/features/kanban/utils/automation";
import { canCreateColumn, canDeleteColumn, canRenameColumn } from "@/features/kanban/utils/columnGuards";
import { extractFunctionErrorMessage } from "@/lib/functionsError";
import type { KanbanColumn, Lead, Message, NewColumnInput, NewLeadInput, Organization } from "@/types";

interface CrmState {
  organization: Organization | null;
  columns: KanbanColumn[];
  leads: Lead[];
  messages: Message[];
  isLoading: boolean;

  loadOrganizationData: (options?: { silent?: boolean }) => Promise<void>;
  reset: () => void;
  moveLead: (leadId: string, toColumnId: string) => Promise<void>;
  reorderColumns: (orderedIds: string[]) => Promise<void>;
  createColumn: (input: NewColumnInput) => Promise<void>;
  updateColumn: (id: string, patch: NewColumnInput) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  createLead: (input: NewLeadInput) => Promise<void>;
  updateLead: (id: string, patch: NewLeadInput) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addMessage: (leadId: string, content: string) => Promise<void>;
}

export const useCrmStore = create<CrmState>()((set, get) => ({
  organization: null,
  columns: [],
  leads: [],
  messages: [],
  isLoading: false,

  loadOrganizationData: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) set({ isLoading: true });
    const [orgRes, columnsRes, leadsRes, messagesRes] = await Promise.all([
      supabase.from("organizations").select("*").single(),
      supabase.from("kanban_columns").select("*").order("position"),
      supabase.from("leads").select("*"),
      supabase.from("messages").select("*").order("created_at"),
    ]);

    set({
      organization: (orgRes.data as Organization) ?? null,
      columns: (columnsRes.data as KanbanColumn[]) ?? [],
      leads: (leadsRes.data as Lead[]) ?? [],
      messages: (messagesRes.data as Message[]) ?? [],
      isLoading: false,
    });
  },

  reset: () => set({ organization: null, columns: [], leads: [], messages: [], isLoading: false }),

  moveLead: async (leadId, toColumnId) => {
    const { columns, leads, organization } = get();
    const lead = leads.find((l) => l.id === leadId);
    const targetColumn = columns.find((c) => c.id === toColumnId);
    if (!lead || !targetColumn || !organization || lead.column_id === toColumnId) return;

    const { data, error } = await supabase
      .from("leads")
      .update({ column_id: toColumnId, column_entered_at: new Date().toISOString() })
      .eq("id", leadId)
      .select()
      .single();

    if (error || !data) {
      toast.error("Não foi possível mover o lead");
      return;
    }

    const updatedLead = data as Lead;
    set({ leads: get().leads.map((l) => (l.id === leadId ? updatedLead : l)) });

    // Cancel any not-yet-sent automation from a previous column before scheduling a new one.
    await supabase
      .from("scheduled_messages")
      .update({ status: "canceled" })
      .eq("lead_id", leadId)
      .eq("status", "pending");

    if (targetColumn.automation?.enabled) {
      const message = renderTemplate(targetColumn.automation.message_template, {
        lead: updatedLead,
        organization,
      });
      const sendAt = computeSendAt(
        targetColumn.automation.delay_value,
        targetColumn.automation.delay_unit
      );

      const { error: scheduleError } = await supabase.from("scheduled_messages").insert({
        organization_id: organization.id,
        lead_id: leadId,
        column_id: toColumnId,
        message_content: message,
        send_at: sendAt.toISOString(),
      });

      if (scheduleError) {
        toast.error("Não foi possível agendar a mensagem automática");
      } else {
        const delay = describeDelay(
          targetColumn.automation.delay_value,
          targetColumn.automation.delay_unit
        );
        toast(`Mensagem agendada para daqui a ${delay}`, { description: message });
      }
    }
  },

  reorderColumns: async (orderedIds) => {
    const { columns } = get();
    const positionById = new Map(orderedIds.map((id, index) => [id, index]));

    set({
      columns: columns
        .map((c) => (positionById.has(c.id) ? { ...c, position: positionById.get(c.id)! } : c))
        .sort((a, b) => a.position - b.position),
    });

    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("kanban_columns").update({ position: index }).eq("id", id)
      )
    );
  },

  createColumn: async (input) => {
    const { columns, organization } = get();
    if (!organization) return;
    if (!canCreateColumn(columns, organization)) {
      toast.error("Limite de colunas do plano gratuito atingido. Faça upgrade para criar mais colunas.");
      return;
    }
    const { data, error } = await supabase
      .from("kanban_columns")
      .insert({
        organization_id: organization.id,
        name: input.name,
        color: input.color,
        position: columns.length,
        automation: input.automation,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Não foi possível criar a coluna");
      return;
    }
    set({ columns: [...get().columns, data as KanbanColumn] });
  },

  updateColumn: async (id, patch) => {
    const { columns } = get();
    const column = columns.find((c) => c.id === id);
    if (!column) return;

    const payload: { color: string; automation: NewColumnInput["automation"]; name?: string } = {
      color: patch.color,
      automation: patch.automation,
    };
    if (canRenameColumn(column)) payload.name = patch.name;

    const { data, error } = await supabase
      .from("kanban_columns")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      toast.error("Não foi possível atualizar a coluna");
      return;
    }
    set({ columns: get().columns.map((c) => (c.id === id ? (data as KanbanColumn) : c)) });
  },

  deleteColumn: async (id) => {
    const { columns } = get();
    const column = columns.find((c) => c.id === id);
    if (!column || !canDeleteColumn(column)) return;

    const { error } = await supabase.from("kanban_columns").delete().eq("id", id);
    if (error) {
      toast.error("Não é possível excluir: existem leads nessa coluna.");
      return;
    }
    set({ columns: get().columns.filter((c) => c.id !== id) });
  },

  createLead: async (input) => {
    const { organization } = get();
    if (!organization) return;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        organization_id: organization.id,
        name: input.name,
        phone: input.phone,
        column_id: input.column_id,
        source: "manual",
        column_entered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Não foi possível criar o lead");
      return;
    }
    set({ leads: [...get().leads, data as Lead] });
  },

  updateLead: async (id, patch) => {
    const { leads } = get();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    const { data, error } = await supabase
      .from("leads")
      .update({ name: patch.name, phone: patch.phone })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      toast.error("Não foi possível atualizar o lead");
      return;
    }
    set({ leads: get().leads.map((l) => (l.id === id ? (data as Lead) : l)) });
  },

  deleteLead: async (id) => {
    const { leads } = get();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir o lead");
      return;
    }
    set({
      leads: get().leads.filter((l) => l.id !== id),
      messages: get().messages.filter((m) => m.lead_id !== id),
    });
    toast.success("Lead excluído com sucesso");
  },

  addMessage: async (leadId, content) => {
    const { organization } = get();
    if (!organization) return;

    const { error: sendError } = await supabase.functions.invoke("whatsapp", {
      body: { action: "send_text", leadId, text: content },
    });

    if (sendError) {
      toast.error(await extractFunctionErrorMessage(sendError, "Não foi possível enviar a mensagem"));
      return;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        organization_id: organization.id,
        lead_id: leadId,
        direction: "outbound",
        status: "sent",
        content,
        is_automated: false,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Mensagem enviada, mas não foi possível salvar no histórico");
      return;
    }

    set({
      messages: [...get().messages, data as Message],
      leads: get().leads.map((l) => (l.id === leadId ? { ...l, last_message_at: now } : l)),
    });
    await supabase.from("leads").update({ last_message_at: now }).eq("id", leadId);
  },
}));
