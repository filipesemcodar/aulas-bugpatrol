import type { Lead, Organization } from "@/types";

export interface TemplateVariable {
  key: string;
  label: string;
  resolve: (context: { lead: Lead; organization: Organization }) => string;
}

export const LEAD_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: "nome", label: "Nome", resolve: ({ lead }) => lead.name },
  { key: "telefone", label: "Telefone", resolve: ({ lead }) => lead.phone },
  { key: "empresa", label: "Empresa", resolve: ({ organization }) => organization.name },
];

export const COLUMN_COLOR_PALETTE = [
  { label: "Cinza", value: "#64748b" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Verde", value: "#22c55e" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Laranja", value: "#f97316" },
  { label: "Roxo", value: "#a855f7" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Vermelho", value: "#ef4444" },
];

export const DEFAULT_COLUMN_NAME = "Novo Lead";
