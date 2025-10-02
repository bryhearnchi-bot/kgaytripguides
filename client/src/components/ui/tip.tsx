import * as React from 'react';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

export interface TipProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}

/**
 * Tip component for displaying helpful hints and suggestions
 *
 * Features:
 * - Cyan accent color with subtle background
 * - Optional custom icon (defaults to Lightbulb)
 * - Customizable label text (defaults to "Tip")
 * - Consistent styling across admin forms and wizards
 *
 * Example:
 * ```tsx
 * <Tip label="AI Tip">
 *   If you imported data from a URL or PDF, the AI Assistant can help identify venues.
 * </Tip>
 *
 * <Tip label="Pro Tip" icon={<Star />}>
 *   Use keyboard shortcuts to navigate faster.
 * </Tip>
 * ```
 */
export function Tip({ children, className, icon, label = 'Tip' }: TipProps) {
  return (
    <div className={cn('mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20', className)}>
      <p className="text-[11px] text-white/70 leading-relaxed">
        {icon || <Lightbulb className="inline w-3 h-3 mr-1 text-cyan-400" />}
        <span className="font-semibold text-cyan-400">{label}:</span> {children}
      </p>
    </div>
  );
}
