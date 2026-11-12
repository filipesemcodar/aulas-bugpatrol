import { describe, expect, it } from "vitest";
import { describeDelay, renderTemplate } from "@/features/kanban/utils/automation";
import { umLead, umaOrganizacao } from "@/test/fabricas";

describe("renderTemplate", () => {
  it("troca as variáveis pelos dados do lead e da empresa", () => {
    const texto = renderTemplate("Oi {{nome}}, aqui é da {{empresa}}. Seu número: {{telefone}}", {
      lead: umLead({ name: "Maria", phone: "5511988887777" }),
      organization: umaOrganizacao({ name: "IBEIA" }),
    });
    expect(texto).toBe("Oi Maria, aqui é da IBEIA. Seu número: 5511988887777");
  });

  it("troca todas as ocorrências da mesma variável", () => {
    const texto = renderTemplate("{{nome}} {{nome}}", { lead: umLead({ name: "Ana" }), organization: umaOrganizacao() });
    expect(texto).toBe("Ana Ana");
  });
});

describe("describeDelay", () => {
  it("usa singular para 1", () => {
    expect(describeDelay(1, "hours")).toBe("1 hora");
  });

  it("usa plural para mais de 1", () => {
    expect(describeDelay(3, "days")).toBe("3 dias");
  });
});
