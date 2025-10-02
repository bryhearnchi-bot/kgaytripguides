import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OceanInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Ocean-themed input component matching Trip Wizard style guide
 *
 * Features:
 * - Ocean blue color scheme with cyan accents
 * - Consistent h-10, rounded-[10px] styling
 * - Subtle white/[0.04] background
 * - Cyan focus states with glow effect
 *
 * Use this component for all single-line text inputs in admin forms and wizards
 */
const OceanInput = React.forwardRef<HTMLInputElement, OceanInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'h-10 px-3 w-full',
          'bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]',
          'text-white text-sm placeholder:text-white/50',
          'transition-all',
          'focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-cyan-400/60 focus:bg-cyan-400/[0.03]',
          'focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

OceanInput.displayName = 'OceanInput';

export { OceanInput };
