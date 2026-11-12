import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { LeadsByColumnDatum } from "@/features/dashboard/utils/metrics";

const chartConfig: ChartConfig = {
  count: { label: "Leads" },
};

export function LeadsByColumnChart({ data }: { data: LeadsByColumnDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leads por coluna</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={4}>
              {data.map((entry) => (
                <Cell key={entry.columnId} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
