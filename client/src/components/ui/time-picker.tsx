import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // Format: "HH:MM" (24-hour format)
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function TimePicker({
  value = '',
  onChange,
  placeholder = '00:00',
  disabled = false,
  required = false,
  className,
}: TimePickerProps) {
  // Strictly enforce 24-hour time format (HH:MM) without AM/PM
  const handleChange = (input: string) => {
    // Allow only digits and colon
    const cleaned = input.replace(/[^0-9:]/g, '');

    // If user is deleting, allow it
    if (cleaned.length < value.length) {
      onChange(cleaned);
      return;
    }

    // Auto-format as user types - automatically add colon after 2 digits
    if (!cleaned.includes(':')) {
      // No colon yet
      if (cleaned.length <= 2) {
        // Just typing hours
        onChange(cleaned);
      } else {
        // More than 2 digits - auto-add colon and continue with minutes
        const hours = cleaned.slice(0, 2);
        const minutes = cleaned.slice(2, 4);
        onChange(`${hours}:${minutes}`);
      }
    } else {
      // Has colon - validate format
      const parts = cleaned.split(':');
      const hours = parts[0].slice(0, 2);
      const minutes = parts[1]?.slice(0, 2) || '';
      onChange(`${hours}:${minutes}`);
    }
  };

  // Validate on blur - ensure valid 24-hour time
  const handleBlur = () => {
    if (!value) return;

    // If user just typed hours (e.g., "11" or "1"), auto-fill minutes with "00"
    if (value.length <= 2 && !value.includes(':')) {
      const hours = parseInt(value, 10);
      if (!isNaN(hours)) {
        const validHours = Math.min(23, Math.max(0, hours));
        onChange(`${validHours.toString().padStart(2, '0')}:00`);
        return;
      }
    }

    // Handle partial time with colon but incomplete minutes (e.g., "11:")
    if (value.includes(':')) {
      const [hoursStr, minutesStr] = value.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

      if (isNaN(hours)) {
        onChange('');
        return;
      }

      // Clamp to valid ranges: 0-23 for hours, 0-59 for minutes
      const validHours = Math.min(23, Math.max(0, hours));
      const validMinutes = Math.min(59, Math.max(0, isNaN(minutes) ? 0 : minutes));

      const formatted = `${validHours.toString().padStart(2, '0')}:${validMinutes.toString().padStart(2, '0')}`;
      onChange(formatted);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="HH:MM (e.g., 14:00)"
        disabled={disabled}
        required={required}
        maxLength={5}
        inputMode="numeric"
        pattern="[0-2][0-9]:[0-5][0-9]"
        className={cn(
          'h-10 px-3 pr-10 w-full',
          'bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]',
          'text-white text-sm font-normal font-mono tracking-wider',
          'transition-all',
          'focus:outline-none',
          'focus:border-cyan-400/60',
          'focus:bg-cyan-400/[0.03]',
          'focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'placeholder:text-white/40 placeholder:font-normal placeholder:tracking-normal',
          className
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Clock className="h-4 w-4 text-white/50" />
      </div>
    </div>
  );
}
