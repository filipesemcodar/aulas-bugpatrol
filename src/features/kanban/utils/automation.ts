import { LEAD_TEMPLATE_VARIABLES } from "@/lib/constants";
import type { DelayUnit, Lead, Organization } from "@/types";

export function renderTemplate(
  template: string,
  context: { lead: Lead; organization: Organization }
): string {
  return LEAD_TEMPLATE_VARIABLES.reduce(
    (text, variable) =>
      text.replaceAll(`{{${variable.key}}}`, variable.resolve(context)),
    template
  );
}

const DELAY_UNIT_LABEL: Record<DelayUnit, { one: string; many: string }> = {
  minutes: { one: "minuto", many: "minutos" },
  hours: { one: "hora", many: "horas" },
  days: { one: "dia", many: "dias" },
};

export function describeDelay(value: number, unit: DelayUnit): string {
  const label = DELAY_UNIT_LABEL[unit];
  return `${value} ${value === 1 ? label.one : label.many}`;
}

const DELAY_UNIT_MS: Record<DelayUnit, number> = {
  minutes: 60_000,
  hours: 60 * 60_000,
  days: 24 * 60 * 60_000,
};

export function computeSendAt(value: number, unit: DelayUnit): Date {
  return new Date(Date.now() + value * DELAY_UNIT_MS[unit]);
}
