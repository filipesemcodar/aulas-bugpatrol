import { Users, UserPlus, TrendingUp, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { LeadsByColumnChart } from "@/features/dashboard/components/LeadsByColumnChart";
import { LeadsOverTimeChart } from "@/features/dashboard/components/LeadsOverTimeChart";
import { RecentActivityList } from "@/features/dashboard/components/RecentActivityList";
import {
  computeDashboardMetrics,
  computeLeadsByColumn,
  computeLeadsOverTime,
} from "@/features/dashboard/utils/metrics";
import { useCrmStore } from "@/stores/useCrmStore";

export function DashboardPage() {
  const leads = useCrmStore((s) => s.leads);
  const columns = useCrmStore((s) => s.columns);
  const messages = useCrmStore((s) => s.messages);

  const metrics = computeDashboardMetrics(leads, columns, messages);
  const leadsByColumn = computeLeadsByColumn(leads, columns);
  const leadsOverTime = computeLeadsOverTime(leads);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Dashboard" description="Visão geral do seu funil de leads" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de leads"
            value={String(metrics.totalLeads)}
            icon={Users}
            tone="violet"
            trend={metrics.totalLeadsTrend}
          />
          <StatCard
            label="Novos leads hoje"
            value={String(metrics.newLeadsToday)}
            icon={UserPlus}
            tone="cyan"
            trend={metrics.newLeadsTodayTrend}
          />
          <StatCard
            label="Taxa de conversão"
            value={`${metrics.conversionRate.toFixed(0)}%`}
            icon={TrendingUp}
            tone="success"
            trend={metrics.conversionRateTrend}
          />
          <StatCard
            label="Mensagens automáticas enviadas"
            value={String(metrics.automatedMessagesSent)}
            icon={MessageSquareText}
            tone="warning"
            trend={metrics.automatedMessagesTrend}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <LeadsOverTimeChart data={leadsOverTime} />
          <RecentActivityList messages={messages} leads={leads} />
        </div>

        <LeadsByColumnChart data={leadsByColumn} />
      </div>
    </div>
  );
}
