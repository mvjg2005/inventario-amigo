import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ title, value, delta, trend = "neutral", icon: Icon, accent = "bg-primary/10 text-primary" }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl" title={value}>
              {value}
            </p>
            {delta && (
              <p
                className={cn(
                  "text-xs font-medium leading-snug",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-destructive",
                  trend === "neutral" && "text-muted-foreground",
                )}
              >
                {delta}
              </p>
            )}
          </div>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10", accent)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
