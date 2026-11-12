import { describe, expect, it } from "vitest";
import { canCreateColumn, canDeleteColumn, canRenameColumn } from "@/features/kanban/utils/columnGuards";
import { umaColuna, umaOrganizacao } from "@/test/fabricas";

describe("colunas protegidas", () => {
  it("não podem ser apagadas nem renomeadas", () => {
    const protegida = umaColuna({ is_protected: true });
    expect(canDeleteColumn(protegida)).toBe(false);
    expect(canRenameColumn(protegida)).toBe(false);
  });
});

describe("canCreateColumn", () => {
  it("plano gratuito: só 1 coluna não protegida", () => {
    const gratis = umaOrganizacao({ plan: "free" });
    expect(canCreateColumn([umaColuna({ is_protected: true })], gratis)).toBe(true);
    expect(canCreateColumn([umaColuna({ is_protected: true }), umaColuna({ id: "c2" })], gratis)).toBe(false);
  });

  it("plano pago: sem limite", () => {
    const pago = umaOrganizacao({ plan: "paid" });
    expect(canCreateColumn([umaColuna(), umaColuna({ id: "c2" }), umaColuna({ id: "c3" })], pago)).toBe(true);
  });
});
