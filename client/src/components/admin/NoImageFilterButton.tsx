import { useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NoImageFilterButtonProps<T> {
  items: T[];
  imageField: keyof T | ((item: T) => string | null | undefined);
  isActive: boolean;
  onToggle: (active: boolean) => void;
  className?: string;
}

export function NoImageFilterButton<T>({
  items,
  imageField,
  isActive,
  onToggle,
  className,
}: NoImageFilterButtonProps<T>) {
  const { noImageCount, hasImages } = useMemo(() => {
    const noImageItems = items.filter(item => {
      const imageValue = typeof imageField === 'function' ? imageField(item) : item[imageField];
      return !imageValue || imageValue === '' || imageValue === null;
    });
    return {
      noImageCount: noImageItems.length,
      hasImages: noImageItems.length > 0,
    };
  }, [items, imageField]);

  if (!hasImages) {
    return null; // Don't show button if there are no items without images
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onToggle(!isActive)}
      className={cn(
        'h-8 px-3 rounded-full text-xs font-medium transition-colors duration-200 border',
        isActive
          ? 'bg-white/20 border-white/30 text-white'
          : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:text-white hover:border-white/30',
        className
      )}
      aria-label={isActive ? 'Show all items' : 'Show only items without images'}
    >
      <ImageOff className="w-3.5 h-3.5 mr-1.5" />
      <span>No Images</span>
      {noImageCount > 0 && (
        <span
          className={cn(
            'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none',
            isActive ? 'bg-white/20' : 'bg-white/10'
          )}
        >
          {noImageCount}
        </span>
      )}
    </Button>
  );
}
