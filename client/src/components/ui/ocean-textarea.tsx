import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OceanTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Ocean-themed textarea component matching Trip Wizard style guide
 *
 * Features:
 * - Ocean blue color scheme with cyan accents
 * - Consistent rounded-[10px] styling
 * - Subtle white/[0.04] background
 * - Cyan focus states with glow effect
 * - Vertical resize only
 *
 * Use this component for all multi-line text inputs in admin forms and wizards
 */
const OceanTextarea = React.forwardRef<HTMLTextAreaElement, OceanTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'px-3 py-2 w-full',
          'bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]',
          'text-white text-sm leading-snug placeholder:text-white/50',
          'transition-all resize-vertical',
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

OceanTextarea.displayName = 'OceanTextarea';

export { OceanTextarea };
