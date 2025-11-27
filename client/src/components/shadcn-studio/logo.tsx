// LogoSvg import removed - module not found
// import LogoSvg from '../../../../assets/svg/logo';

// Util Imports
import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Logo SVG placeholder - original module not found */}
      <div className="size-8.5 bg-white/20 rounded" />
      <span className="text-xl font-semibold">shadcn/studio</span>
    </div>
  );
};

export default Logo;
