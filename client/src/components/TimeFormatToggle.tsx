import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const variantStyles = {
    default: '!text-gray-800 !border-gray-300 !bg-white hover:!bg-gray-100 hover:!text-gray-900',
    banner: 'text-white border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30',
    menu: 'text-white border-0 bg-transparent hover:bg-white/10 justify-start w-full',
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTimeFormat}
      className={cn(
        'flex items-center space-x-2 transition-colors',
        variantStyles[variant],
        className
      )}
      title={`Switch to ${timeFormat === '12h' ? '24-hour' : '12-hour'} format`}
    >
      <Clock className="w-4 h-4" />
      <span className="text-xs font-medium">{timeFormat === '12h' ? 'AM/PM' : '24H'}</span>
    </Button>
  );
}
