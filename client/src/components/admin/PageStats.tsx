import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageStatTrend {
  direction: "up" | "down" | "flat";
  label: string;
}

export interface PageStatConfig {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helpText?: string;
  trend?: PageStatTrend;
}

interface PageStatsProps {
  stats: PageStatConfig[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const TREND_COLORS: Record<PageStatTrend["direction"], string> = {
  up: "text-[#34d399]",
  down: "text-[#fb7185]",
  flat: "text-white/60",
};

export function PageStats({ stats, columns = 3, className }: PageStatsProps) {
  if (!stats.length) return null;

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridCols, className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-white shadow-lg shadow-blue-900/20 backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
            {stat.icon && <span className="text-white/60">{stat.icon}</span>}
          </div>
          <div className="text-2xl font-semibold text-white">{stat.value}</div>
          <div className="flex items-center justify-between text-xs text-white/60">
            {stat.helpText && <span>{stat.helpText}</span>}
            {stat.trend && (
              <span className={TREND_COLORS[stat.trend.direction]}>{stat.trend.label}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
