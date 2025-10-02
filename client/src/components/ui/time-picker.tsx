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
  // Format time to HH:MM
  const formatTime = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;

    // Insert colon after first 2 digits
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2, 4);

    return `${hours}:${minutes}`;
  };

  // Validate and format time input
  const handleChange = (input: string) => {
    const formatted = formatTime(input);

    if (formatted.length === 5) {
      // Full time entered - validate
      const [hours, minutes] = formatted.split(':').map(Number);

      // Validate hours (0-23)
      const validHours = Math.min(23, Math.max(0, hours));
      // Validate minutes (0-59)
      const validMinutes = Math.min(59, Math.max(0, minutes));

      const validTime = `${validHours.toString().padStart(2, '0')}:${validMinutes.toString().padStart(2, '0')}`;
      onChange(validTime);
    } else {
      onChange(formatted);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={5}
        className={cn(
          'h-10 px-3 pr-10',
          'bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px]',
          'text-white text-sm font-normal',
          'transition-all',
          'focus:outline-none',
          'focus:border-cyan-400/60',
          'focus:bg-cyan-400/[0.03]',
          'focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'placeholder:text-white/50',
          className
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Clock className="h-4 w-4 text-white/50" />
      </div>
    </div>
  );
}
