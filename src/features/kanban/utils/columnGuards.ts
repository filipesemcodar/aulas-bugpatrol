import type { KanbanColumn, Organization } from "@/types";

/** Plano gratuito só pode ter 1 coluna não protegida (ex.: "Novo Lead" fica de fora da conta). */
const FREE_PLAN_UNPROTECTED_COLUMN_LIMIT = 1;

export function canDeleteColumn(column: KanbanColumn): boolean {
  return !column.is_protected;
}

export function canRenameColumn(column: KanbanColumn): boolean {
  return !column.is_protected;
}

/**
 * Regra de UX espelhando o trigger `enforce_column_plan_limit` do Postgres (fonte de verdade):
 * no plano gratuito, no máximo 1 coluna não protegida por organização. No plano pago, sem limite.
 * Isso é só feedback de UI — o trigger no banco é quem garante de fato.
 */
export function canCreateColumn(columns: KanbanColumn[], organization: Organization): boolean {
  if (organization.plan === "paid") return true;
  return columns.filter((c) => !c.is_protected).length < FREE_PLAN_UNPROTECTED_COLUMN_LIMIT;
}
