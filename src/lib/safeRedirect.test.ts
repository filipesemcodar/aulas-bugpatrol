import { describe, expect, it } from "vitest";
import { getSafeRedirect, loginUrlFor } from "@/lib/safeRedirect";

describe("getSafeRedirect", () => {
  it("aceita caminho do próprio app", () => {
    expect(getSafeRedirect("/crm/kanban")).toBe("/crm/kanban");
  });

  it("volta para o padrão quando não há destino", () => {
    expect(getSafeRedirect(null, "/crm/dashboard")).toBe("/crm/dashboard");
  });

  it.each(["https://site-estranho.com", "//site-estranho.com", "/\\site-estranho.com"])(
    "recusa redirecionar para fora do app (%s)",
    (destino) => {
      expect(getSafeRedirect(destino, "/")).toBe("/");
    },
  );
});

describe("loginUrlFor", () => {
  it("leva o caminho de volta no parâmetro next", () => {
    expect(loginUrlFor("/crm/leads/1")).toBe("/login?next=%2Fcrm%2Fleads%2F1");
  });
});
