import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CategoryChipVariant = "default" | "brand" | "success" | "danger" | "neutral";

const VARIANT_STYLES: Record<CategoryChipVariant, string> = {
  default: "border-white/15 bg-white/5 text-white/70",
  brand: "border-[#22d3ee]/40 bg-[#22d3ee]/15 text-[#22d3ee]",
  success: "border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]",
  danger: "border-[#fb7185]/40 bg-[#fb7185]/15 text-[#fb7185]",
  neutral: "border-white/10 bg-white/8 text-white/60",
};

interface CategoryChipProps {
  label: string;
  icon?: ReactNode;
  variant?: CategoryChipVariant;
  className?: string;
}

export function CategoryChip({ label, icon, variant = "default", className }: CategoryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {icon && <span className="text-white/70">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
