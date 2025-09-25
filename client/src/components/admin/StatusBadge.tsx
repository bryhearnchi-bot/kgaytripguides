import { ReactNode } from "react";
import { Activity, Archive, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CLASS = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium";

const STATUS_MAP: Record<string, { className: string; label: string; icon: ReactNode }> = {
  upcoming: {
    className: "border-[#22d3ee]/40 bg-[#22d3ee]/15 text-[#22d3ee]",
    label: "Upcoming",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  ongoing: {
    className: "border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]",
    label: "In Progress",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  current: {
    className: "border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]",
    label: "In Progress",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  past: {
    className: "border-white/20 bg-white/10 text-white/70",
    label: "Completed",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  archived: {
    className: "border-white/15 bg-white/5 text-white/60",
    label: "Archived",
    icon: <Archive className="h-3.5 w-3.5" />,
  },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({ status, label, icon, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const config = STATUS_MAP[key] ?? {
    className: "border-white/15 bg-white/5 text-white/70",
    label: status,
    icon: null,
  };

  return (
    <span className={cn(DEFAULT_CLASS, config.className, className)}>
      {icon ?? config.icon}
      <span>{label ?? config.label}</span>
    </span>
  );
}
