import { ReactNode } from 'react';
import {
  Activity,
  Archive,
  Clock,
  CheckCircle,
  Wrench,
  AlertCircle,
  FileEdit,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium';

const STATUS_MAP: Record<string, { className: string; label: string; icon: ReactNode }> = {
  // Trip statuses
  draft: {
    className: 'border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#f59e0b]',
    label: 'Draft',
    icon: <FileEdit className="h-3.5 w-3.5" />,
  },
  upcoming: {
    className: 'border-[#22d3ee]/40 bg-[#22d3ee]/15 text-[#22d3ee]',
    label: 'Upcoming',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  ongoing: {
    className: 'border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]',
    label: 'In Progress',
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  current: {
    className: 'border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]',
    label: 'In Progress',
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  past: {
    className: 'border-red-400/40 bg-red-400/15 text-red-300',
    label: 'Past',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  preview: {
    className: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
    label: 'Preview',
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  archived: {
    className: 'border-white/15 bg-white/5 text-white/60',
    label: 'Archived',
    icon: <Archive className="h-3.5 w-3.5" />,
  },
  // Ship statuses
  active: {
    className: 'border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]',
    label: 'Active',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  maintenance: {
    className: 'border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#f59e0b]',
    label: 'Maintenance',
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  retired: {
    className: 'border-[#6b7280]/40 bg-[#6b7280]/15 text-[#6b7280]',
    label: 'Retired',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

interface StatusBadgeProps {
  status?: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  children?: ReactNode;
}

export function StatusBadge({
  status,
  label,
  icon,
  className,
  variant,
  children,
}: StatusBadgeProps) {
  // Handle variant-based styling (for compatibility with existing code)
  if (variant && !status) {
    const variantStyles = {
      default: 'border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]',
      secondary: 'border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#f59e0b]',
      outline: 'border-[#6b7280]/40 bg-[#6b7280]/15 text-[#6b7280]',
    };

    return (
      <span className={cn(DEFAULT_CLASS, variantStyles[variant], className)}>
        {icon}
        <span>{children || label}</span>
      </span>
    );
  }

  // Handle status-based styling
  if (!status) {
    return (
      <span className={cn(DEFAULT_CLASS, 'border-white/15 bg-white/5 text-white/70', className)}>
        {icon}
        <span>{children || label || 'Unknown'}</span>
      </span>
    );
  }

  const key = status.toLowerCase();
  const config = STATUS_MAP[key] ?? {
    className: 'border-white/15 bg-white/5 text-white/70',
    label: status,
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };

  return (
    <span className={cn(DEFAULT_CLASS, config.className, className)}>
      {icon ?? config.icon}
      <span>{children || (label ?? config.label)}</span>
    </span>
  );
}
