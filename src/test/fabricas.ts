import type { KanbanColumn, Lead, Organization } from "@/types";

// Dados de exemplo para os testes. Cada teste sobrescreve só o que importa para ele.

export function umLead(dados: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    organization_id: "org-1",
    column_id: "col-1",
    name: "Maria Silva",
    phone: "5511999990000",
    source: "manual",
    column_entered_at: "2026-11-01T10:00:00.000Z",
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
    ...dados,
  };
}

export function umaOrganizacao(dados: Partial<Organization> = {}): Organization {
  return {
    id: "org-1",
    name: "Empresa Exemplo",
    whatsapp_connected: true,
    plan: "free",
    subscription_status: null,
    current_period_end: null,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
    ...dados,
  };
}

export function umaColuna(dados: Partial<KanbanColumn> = {}): KanbanColumn {
  return {
    id: "col-1",
    organization_id: "org-1",
    name: "Novo Lead",
    color: "#64748b",
    position: 0,
    is_default: true,
    is_protected: false,
    automation: null,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
    ...dados,
  };
}
