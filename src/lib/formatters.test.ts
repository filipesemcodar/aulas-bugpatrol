import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/formatters";

describe("getInitials", () => {
  it("usa a primeira letra do primeiro e do último nome", () => {
    expect(getInitials("Maria da Silva")).toBe("MS");
  });

  it("usa as duas primeiras letras quando há um nome só", () => {
    expect(getInitials("maria")).toBe("MA");
  });

  it("ignora espaços sobrando", () => {
    expect(getInitials("  Ana   Souza  ")).toBe("AS");
  });
});
