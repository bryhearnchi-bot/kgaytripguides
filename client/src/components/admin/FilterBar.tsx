import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  trailingContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  filters,
  activeFilter,
  onFilterChange,
  trailingContent,
  children,
  className,
}: FilterBarProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg shadow-blue-900/20 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70 focus:ring-0"
          />
        </div>
        {trailingContent && <div className="flex items-center gap-3">{trailingContent}</div>}
      </div>

      {(filters?.length || children) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filters?.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => onFilterChange?.(filter.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition",
                  isActive
                    ? "border-white/20 bg-gradient-to-r from-[#22d3ee]/90 to-[#2563eb]/80 text-white shadow-lg shadow-blue-900/30"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
                  !onFilterChange && "cursor-default"
                )}
                type="button"
                disabled={!onFilterChange}
              >
                <span>{filter.label}</span>
                {typeof filter.count === "number" && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] leading-none text-white/70">
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
          {children}
        </div>
      )}
    </section>
  );
}
