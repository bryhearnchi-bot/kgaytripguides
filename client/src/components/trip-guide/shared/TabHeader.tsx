import { LucideIcon } from 'lucide-react';

interface TabHeaderProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  className?: string;
}

export const TabHeader = ({
  icon: Icon,
  title,
  iconColor = 'text-blue-400',
  className = '',
}: TabHeaderProps) => {
  return (
    <div className={`pt-4 pb-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex-1 h-px bg-white/20 ml-3"></div>
      </div>
    </div>
  );
};
