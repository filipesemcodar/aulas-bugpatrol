import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { LeadsOverTimeDatum } from "@/features/dashboard/utils/metrics";

const chartConfig: ChartConfig = {
  count: { label: "Novos leads", color: "var(--chart-1)" },
};

function formatTick(value: string) {
  return format(new Date(`${value}T00:00:00`), "dd/MM");
}

function formatTooltipLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "d 'de' MMMM", { locale: ptBR });
}

export function LeadsOverTimeChart({ data }: { data: LeadsOverTimeDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novos leads</CardTitle>
        <CardDescription>Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
            <defs>
              <linearGradient id="leadsOverTimeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              tickFormatter={formatTick}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={28} allowDecimals={false} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(value) => formatTooltipLabel(String(value))} />}
            />
            <Area
              dataKey="count"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#leadsOverTimeFill)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
