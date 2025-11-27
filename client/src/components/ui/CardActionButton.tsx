import React from 'react';
import { cn } from '@/lib/utils';

interface CardActionButtonProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  /**
   * Visual variant of the button
   * - default: bg-white/5 hover:bg-white/10 (used in most cards)
   * - elevated: bg-white/10 hover:bg-white/20 (used in party themes)
   */
  variant?: 'default' | 'elevated';
}

const variantStyles = {
  default: 'bg-white/5 hover:bg-white/10',
  elevated: 'bg-white/10 hover:bg-white/20',
};

/**
 * A reusable action button used in card footers (EventCard, TalentCard, PartyCard, etc.)
 * Provides consistent styling and behavior for card action bars.
 */
export function CardActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  className,
  variant = 'default',
}: CardActionButtonProps) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        // Blur button to prevent focus-related scroll
        (e.target as HTMLButtonElement).blur();
        onClick(e);
      }}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-1.5 py-1 rounded-full',
        'text-xs font-semibold',
        variantStyles[variant],
        'text-white border border-white/20 transition-all',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
