import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Trend } from "@/features/dashboard/utils/metrics";

const TONE_CLASSES = {
  violet: "bg-accent text-primary",
  cyan: "bg-accent-cyan-tint text-accent-cyan",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
} as const;

const TREND_CLASSES = {
  up: "bg-success-tint text-success",
  down: "bg-destructive-tint text-destructive",
  flat: "bg-muted text-muted-foreground",
} as const;

const TREND_ICONS = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
} as const;

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  trend?: Trend;
}

export function StatCard({ label, value, icon: Icon, tone = "violet", trend }: StatCardProps) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("flex size-9 items-center justify-center rounded-full", TONE_CLASSES[tone])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {trend && TrendIcon && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium",
              TREND_CLASSES[trend.direction]
            )}
          >
            <TrendIcon className="size-3" />
            {trend.label}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
