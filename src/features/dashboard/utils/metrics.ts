import type { KanbanColumn, Lead, Message } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface Trend {
  direction: "up" | "down" | "flat";
  label: string;
}

/** Compara duas contagens (ex.: leads desta semana vs semana anterior). */
export function computeTrend(current: number, previous: number): Trend | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return { direction: "up", label: "Novo" };
  const pct = ((current - previous) / previous) * 100;
  const direction = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { direction, label: `${Math.abs(Math.round(pct))}%` };
}

/** Compara duas taxas em pontos percentuais (ex.: taxa de conversão). */
export function computePointTrend(
  current: number,
  previous: number,
  hasData: boolean
): Trend | undefined {
  if (!hasData) return undefined;
  const diff = current - previous;
  const direction = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat";
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  return { direction, label: `${sign}${Math.abs(Math.round(diff))}pp` };
}

function conversionRateFor(leadsInWindow: Lead[], lastColumnId: string | undefined): number {
  if (leadsInWindow.length === 0) return 0;
  const converted = leadsInWindow.filter((lead) => lead.column_id === lastColumnId).length;
  return (converted / leadsInWindow.length) * 100;
}

export interface DashboardMetrics {
  totalLeads: number;
  totalLeadsTrend?: Trend;
  newLeadsToday: number;
  newLeadsTodayTrend?: Trend;
  conversionRate: number;
  conversionRateTrend?: Trend;
  automatedMessagesSent: number;
  automatedMessagesTrend?: Trend;
}

export function computeDashboardMetrics(
  leads: Lead[],
  columns: KanbanColumn[],
  messages: Message[]
): DashboardMetrics {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - DAY_MS);
  const weekStart = new Date(today.getTime() - 7 * DAY_MS);
  const previousWeekStart = new Date(today.getTime() - 14 * DAY_MS);

  const newLeadsToday = leads.filter((lead) => isSameDay(new Date(lead.created_at), today)).length;
  const newLeadsYesterday = leads.filter((lead) =>
    isSameDay(new Date(lead.created_at), yesterday)
  ).length;

  const leadsThisWeek = leads.filter((lead) => new Date(lead.created_at).getTime() >= weekStart.getTime());
  const leadsPreviousWeek = leads.filter((lead) => {
    const t = new Date(lead.created_at).getTime();
    return t >= previousWeekStart.getTime() && t < weekStart.getTime();
  });

  const lastColumn = [...columns].sort((a, b) => b.position - a.position)[0];
  const convertedLeads = lastColumn
    ? leads.filter((lead) => lead.column_id === lastColumn.id).length
    : 0;
  const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;
  const conversionRateThisWeek = conversionRateFor(leadsThisWeek, lastColumn?.id);
  const conversionRatePreviousWeek = conversionRateFor(leadsPreviousWeek, lastColumn?.id);

  const automatedMessagesSent = messages.filter((m) => m.is_automated).length;
  const automatedThisWeek = messages.filter(
    (m) => m.is_automated && new Date(m.created_at).getTime() >= weekStart.getTime()
  ).length;
  const automatedPreviousWeek = messages.filter((m) => {
    if (!m.is_automated) return false;
    const t = new Date(m.created_at).getTime();
    return t >= previousWeekStart.getTime() && t < weekStart.getTime();
  }).length;

  return {
    totalLeads: leads.length,
    totalLeadsTrend: computeTrend(leadsThisWeek.length, leadsPreviousWeek.length),
    newLeadsToday,
    newLeadsTodayTrend: computeTrend(newLeadsToday, newLeadsYesterday),
    conversionRate,
    conversionRateTrend: computePointTrend(
      conversionRateThisWeek,
      conversionRatePreviousWeek,
      leadsThisWeek.length > 0 || leadsPreviousWeek.length > 0
    ),
    automatedMessagesSent,
    automatedMessagesTrend: computeTrend(automatedThisWeek, automatedPreviousWeek),
  };
}

export interface LeadsByColumnDatum {
  columnId: string;
  name: string;
  color: string;
  count: number;
}

export function computeLeadsByColumn(leads: Lead[], columns: KanbanColumn[]): LeadsByColumnDatum[] {
  return [...columns]
    .sort((a, b) => a.position - b.position)
    .map((column) => ({
      columnId: column.id,
      name: column.name,
      color: column.color,
      count: leads.filter((lead) => lead.column_id === column.id).length,
    }));
}

export interface LeadsOverTimeDatum {
  date: string;
  count: number;
}

/** Novos leads por dia nos últimos `days` dias, preenchendo dias sem lead com 0. */
export function computeLeadsOverTime(leads: Lead[], days = 30): LeadsOverTimeDatum[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, number>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * DAY_MS);
    buckets.set(date.toISOString().slice(0, 10), 0);
  }

  for (const lead of leads) {
    const key = startOfDay(new Date(lead.created_at)).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
