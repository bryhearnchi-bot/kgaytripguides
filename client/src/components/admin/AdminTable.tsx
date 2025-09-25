import { ReactNode } from "react";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AdminTableProps {
  title: string;
  description?: string;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  empty?: boolean;
  emptyState?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminTable({
  title,
  description,
  count,
  actions,
  children,
  footer,
  empty = false,
  emptyState,
  className,
  contentClassName,
}: AdminTableProps) {
  const displayTitle = typeof count === "number" ? `${title} (${count})` : title;

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur",
        className
      )}
    >
      <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{displayTitle}</h2>
          {description && <p className="text-xs uppercase tracking-[0.3em] text-white/40">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      <div className={cn("px-4 py-4 sm:px-6", contentClassName)}>
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center text-white/70">
            {emptyState ?? <p className="text-sm">No records available.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-white/80">{children}</Table>
          </div>
        )}
      </div>

      {footer && <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">{footer}</footer>}
    </section>
  );
}
