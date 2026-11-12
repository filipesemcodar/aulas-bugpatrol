# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

CRM do curso "Como resolver bugs automaticamente": uma cópia do IBEIA CRM (CRM de leads com funil Kanban e automações de mensagem por coluna) usada como projeto de exemplo. O backend é **Supabase** (o projeto de cada aluno): Postgres com RLS multi-tenant e Supabase Auth para login/cadastro. O schema está em `supabase/migrations/`. Envio de mensagem pelo WhatsApp, convite de membros e cobrança (Stripe) dependem de Edge Functions que **não** fazem parte do curso: nesses pontos a tela mostra um aviso de erro, e o resto do CRM funciona.

## Comandos

```bash
npm run dev           # servidor de desenvolvimento (Vite)
npm run build         # type-check (tsc -b) + build de produção (vite build) + dist/version.json
npm run lint          # oxlint
npm test              # testes (Vitest), arquivos *.test.ts ao lado do código
npm run check         # lint + tipos + testes: o que precisa passar antes de entregar
npm run publicar      # publica a main em produção (dispara o workflow "Publicar produção")
npm run desfazer -- <commit>   # volta produção para uma versão anterior (workflow "Desfazer publicação")
npm run versao:no-ar  # qual commit está no ar (lê /version.json do endereço de produção)
```

## Testes

Vitest, ambiente Node, configurado no `vite.config.ts` (bloco `test`). Os testes ficam ao lado do arquivo testado (`src/lib/formatters.ts` → `src/lib/formatters.test.ts`). Dados de exemplo em `src/test/fabricas.ts` (`umLead`, `umaOrganizacao`, `umaColuna`).

## Publicação

Produção é um Worker no Cloudflare (assets estáticos, `wrangler.jsonc`, nome `crm-do-curso`), no endereço que você puser em `homepage` no `package.json` (ou na variable `PRODUCAO_URL` do GitHub).
- **Só se publica pelo GitHub Actions**: `npm run publicar` dispara `.github/workflows/publicar-producao.yml` com o commit exato da `main`; o workflow roda `npm run check`, faz o build com `version.json` e publica com `wrangler deploy --tag <commit>`; depois confere o `version.json` servido. Nunca rode `wrangler deploy` à mão.
- **Desfazer**: `npm run desfazer -- <commit>` dispara `desfazer-publicacao.yml`, que acha a versão do Cloudflare com essa tag e faz `wrangler rollback`. Não desfaz mudança no banco.
- Segredos do workflow ficam no GitHub (Settings → Secrets and variables → Actions): secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variables `PRODUCAO_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Arquitetura

### Stack
React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (estilo "base-nova", ícones lucide) + Zustand + React Router v7 + React Hook Form + Zod + dnd-kit (drag-and-drop do Kanban) + recharts (gráficos do dashboard).

### Alias de import
`@/*` aponta para `src/*` (configurado em `vite.config.ts` e `tsconfig.json`). Sempre importe com `@/...` em vez de caminhos relativos longos.

### Camadas de rota e guards de autenticação
`src/routes/router.tsx` define três grupos de rotas, cada um com seu próprio layout:
- `AuthLayout` → `/login`, `/cadastro`
- `OnboardingLayout` → `/onboarding/conectar-whatsapp`, `/onboarding/sucesso`
- `AppLayout` → rotas do CRM (`/crm/dashboard`, `/crm/kanban`, `/crm/leads`, `/crm/leads/:leadId`, `/configuracoes`)

O controle de acesso é feito dentro do próprio layout, não por um wrapper de rota genérico: `AppLayout` (`src/routes/AppLayout.tsx`) lê `useAuthStore().isAuthenticated` e `useCrmStore().organization.whatsapp_connected` e redireciona para `/login` ou `/onboarding/conectar-whatsapp` conforme o caso. Ao adicionar novas rotas autenticadas, coloque-as como filhas de `AppLayout` para herdar esse guard.

### Stores Zustand (`src/stores/`)
Cada store representa um domínio e mistura estado + as próprias actions, chamando o `supabase` client diretamente (sem camada de serviço/API separada). Nenhum store usa mais `zustand/middleware.persist` — a única persistência client-side é a sessão de auth, gerenciada pelo próprio SDK do Supabase (`localStorage`, chave gerenciada internamente, não `ibeia-crm-*`).

- `useAuthStore` — não guarda estado de negócio, só a sessão do Supabase Auth. Registra um único listener `supabase.auth.onAuthStateChange` **na criação do store** (fora de qualquer componente React) que dispara `useCrmStore.loadOrganizationData()` / `useTeamStore.loadTeam()` em `INITIAL_SESSION`/`SIGNED_IN`, e `.reset()` nos dois em `SIGNED_OUT`. Isso é proposital: colocar essa orquestração num `useEffect` reintroduz uma race condition em que o guard de rota do `AppLayout` avalia `organization === null` antes do listener montar. `login`/`signup`/`logout` chamam a API real do Supabase Auth. `signup` retorna `{ error, needsEmailConfirmation }` — o projeto tem "Confirm email" ativo, então cadastros novos não recebem sessão imediata (`SignupForm` mostra uma tela "Confirme seu e-mail" nesse caso, não redireciona silenciosamente).
- `useCrmStore` — organização, colunas do Kanban, leads e mensagens; é o store central do produto. `loadOrganizationData()` busca as 4 tabelas em paralelo. Contém a lógica de mover lead entre colunas, reordenar colunas, CRUD de colunas e disparo da automação de mensagem ao mover um lead. Não existe mais `resetToMockData`.
- `useTeamStore` — perfis (`profiles`) da organização atual. `inviteUser` chama a Edge Function `invite-user` (cria usuário real no Supabase Auth) e retorna a senha temporária para exibição. `updateUserRole`/`removeUser` fazem `update`/`delete` reais e **sempre encadeiam `.select().maybeSingle()`**: um `UPDATE`/`DELETE` bloqueado por RLS não retorna `error`, só 0 linhas — sem o `.select()`, o client mostraria sucesso falso para uma mutação que a RLS silenciosamente rejeitou. Trate esse padrão como obrigatório em qualquer nova mutação de `profiles`.
- `useOnboardingStore` — estado efêmero do fluxo de conexão do WhatsApp (client-only, não toca o Supabase). Ao concluir, chama `useCrmStore.connectWhatsapp()`, que grava `whatsapp_connected = true` na organização.

### Automação de colunas do Kanban
`src/features/kanban/utils/automation.ts` faz a interpolação de variáveis (`{{nome}}`, `{{telefone}}`, `{{empresa}}`, definidas em `src/lib/constants.ts` como `LEAD_TEMPLATE_VARIABLES`) e formata o delay de envio. `columnGuards.ts` centraliza as regras de coluna protegida (`is_protected`): colunas protegidas não podem ser renomeadas nem excluídas. Essas regras são aplicadas no client (`useCrmStore`) só para feedback de UI — quem garante de fato é o trigger `protect_column_mutation` no Postgres, então um bypass client-side não teria efeito real.

### Backend Supabase (schema, RLS, Edge Function)

O schema, as policies de RLS, as funções e os triggers estão em `supabase/migrations/`. Para criar o banco de um projeto novo, rode as migrations no SQL Editor do Supabase (ou `supabase db push`). Ao mudar o banco, crie uma migration nova nessa pasta.

- **Tabelas**: `organizations`, `profiles` (ponte 1:1 com `auth.users`, carrega `role` e `organization_id`), `kanban_columns`, `leads`, `messages`. Todas (exceto `profiles`, que referencia `auth.users`) têm `organization_id` para isolamento multi-tenant.
- **RLS**: habilitada em todas as tabelas, com policies restritas a `organization_id = private.get_my_organization_id()` (função `SECURITY DEFINER` no schema `private`, não exposta via PostgREST). `profiles` só permite `UPDATE`/`DELETE` por `owner`/`admin` da mesma organização — **nunca** relaxe essa policy para permitir que um usuário edite a própria linha livremente; uma versão anterior permitia isso e criava um buraco de escalonamento de privilégio (um `member` conseguia setar `role = 'owner'` em si mesmo).
- **Triggers**: `handle_new_user` (cria organização + perfil `owner` no cadastro, a partir de `raw_user_meta_data`), `protect_column_mutation` (bloqueia rename/delete de coluna `is_protected`), `protect_owner_removal` (bloqueia auto-remoção e remoção do último `owner`), `set_updated_at`.
- **Edge Functions** (`invite-user`, `whatsapp`, cobrança): não fazem parte do curso. As telas que as chamam mostram um aviso de erro.
- Ao adicionar uma tabela/coluna nova, sempre crie a policy de RLS correspondente na mesma migration — não existe fallback "aberto por padrão": tabela sem policy fica inacessível via `anon`/`authenticated`.

### Organização de código: `features/` vs `pages/` vs `components/`
- `src/pages/` — componentes de rota (ligados ao router), organizados pelos mesmos grupos de layout (`auth/`, `onboarding/`, `crm/`, `settings/`).
- `src/features/<domínio>/components/` e `.../utils/` — lógica e UI específicas de domínio (kanban, leads, dashboard, auth, onboarding, settings), reutilizadas pelas páginas.
- `src/components/ui/` — primitivos shadcn/ui gerados (não editar a lógica interna livremente; preferir compor por cima).
- `src/components/layout/` e `src/components/common/` — layout do app (Sidebar/Topbar) e utilitários de UI compartilhados entre features.

### Tipos
Os tipos de domínio ficam em `src/types/*.ts` e são todos re-exportados por `src/types/index.ts` — importe sempre de `@/types`, não do arquivo individual. Não há mais `src/mocks/`; ao adicionar um campo novo a uma entidade, atualize o tipo em `src/types/` **e** o schema no Supabase (migration) juntos — os dois precisam ficar em sincronia manualmente, não há geração automática de tipos a partir do schema neste fluxo.

### Cliente Supabase e variáveis de ambiente
`src/lib/supabaseClient.ts` exporta o client único (`createClient` com `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, lidas de `.env`; lança erro se estiverem ausentes). `.env` é gitignored — use `.env.example` como referência para as chaves esperadas. Todo acesso a dado (leads, colunas, mensagens, perfis) deve passar por esse client dentro de uma store; não instancie outro client nem faça fetch direto em componentes.

### Idioma da UI
Toda a interface, mensagens de toast (`sonner`) e rotas usam português (ex.: `/cadastro`, `/configuracoes`, "Dados de exemplo restaurados"). Mantenha texto voltado ao usuário em português; nomes de variáveis, tipos e chaves de dados permanecem em inglês.
