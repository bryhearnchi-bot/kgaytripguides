import { Clock } from 'lucide-react';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { cn } from '@/lib/utils';

interface TimeFormatToggleProps {
  variant?: 'default' | 'banner' | 'menu';
  className?: string;
}

export default function TimeFormatToggle({
  variant = 'default',
  className,
}: TimeFormatToggleProps) {
  const { timeFormat, toggleTimeFormat } = useTimeFormat();

  const is24h = timeFormat === '24h';

  const variantStyles = {
    default: {
      text: 'text-gray-800',
      track: 'bg-gray-300',
      trackActive: 'bg-blue-500',
      thumb: 'bg-white',
    },
    banner: {
      text: 'text-white',
      track: 'bg-white/20',
      trackActive: 'bg-white/40',
      thumb: 'bg-white',
    },
    menu: {
      text: 'text-white',
      track: 'bg-white/20',
      trackActive: 'bg-white/40',
      thumb: 'bg-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <button
      onClick={toggleTimeFormat}
      className={cn('flex items-center gap-2 transition-all', className)}
      title={`Switch to ${is24h ? '12-hour' : '24-hour'} format`}
      aria-label="Toggle between 12-hour and 24-hour time format"
    >
      <Clock className="w-4 h-4" />
      <span className={cn('text-xs font-medium', styles.text)}>{is24h ? '24H' : 'AM/PM'}</span>

      {/* Toggle Switch */}
      <div
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          is24h ? styles.trackActive : styles.track
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full transition-transform',
            styles.thumb,
            is24h ? 'translate-x-5' : 'translate-x-0.5',
            'shadow-sm'
          )}
        />
      </div>
    </button>
  );
}
