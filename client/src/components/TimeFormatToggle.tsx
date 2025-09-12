import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeFormat } from '@/contexts/TimeFormatContext';

export default function TimeFormatToggle() {
  const { timeFormat, toggleTimeFormat } = useTimeFormat();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTimeFormat}
      className="flex items-center space-x-2 !text-gray-800 !border-gray-300 !bg-white hover:!bg-gray-100 hover:!text-gray-900 transition-colors"
      title={`Switch to ${timeFormat === '12h' ? '24-hour' : '12-hour'} format`}
    >
      <Clock className="w-4 h-4" />
      <span className="text-xs font-medium">
        {timeFormat === '12h' ? 'AM/PM' : '24H'}
      </span>
    </Button>
  );
}