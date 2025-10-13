import React, { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { Clock, MapPin, Sparkles, Info, ShoppingBag } from 'lucide-react';
import type { DailyEvent, PartyTheme } from '@/data/trip-data';
import { formatTime } from '@/lib/timeFormat';

interface PartyCardProps {
  event: DailyEvent;
  partyTheme?: PartyTheme;
  timeFormat: '12h' | '24h';
  onClick: () => void;
  delay?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Pre-define animation variants outside component to prevent recreation
const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  hover: { y: -4, scale: 1.02 },
  tap: { scale: 0.98 },
};

const imageHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
};

// Static sparkle animation - use CSS instead of Framer Motion
const SparkleIcon = memo(function SparkleIcon() {
  return (
    <div className="absolute top-2 right-2 bg-pink-500/30 backdrop-blur-sm rounded-full p-1.5 border border-pink-400/50 animate-sparkle">
      <Sparkles className="w-3 h-3 text-pink-300" />
    </div>
  );
});

// Memoized info indicator
const InfoIndicator = memo(function InfoIndicator() {
  return (
    <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1 border border-white/30 animate-float">
      <Info className="w-3 h-3 text-white" />
    </div>
  );
});

// Memoized party details section
const PartyDetails = memo(function PartyDetails({
  partyTheme,
  onShopClick,
}: {
  partyTheme: PartyTheme;
  onShopClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      {/* Description */}
      <p className="text-white/90 text-xs leading-relaxed">{partyTheme.desc}</p>

      {/* Costume Ideas */}
      {partyTheme.costumeIdeas && (
        <div className="pt-2 border-t border-white/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-pink-300" />
            <h5 className="text-xs font-bold text-pink-300 uppercase tracking-wide">
              Costume Ideas
            </h5>
          </div>
          <p className="text-white/80 text-xs leading-relaxed">{partyTheme.costumeIdeas}</p>
        </div>
      )}

      {/* Amazon Shopping Button */}
      {partyTheme.amazonShoppingListUrl && (
        <a
          href={partyTheme.amazonShoppingListUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onShopClick}
          className="block w-full mt-2 px-3 py-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-white text-xs font-semibold rounded-lg border border-amber-400/40 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="flex items-center justify-center gap-1.5">
            <ShoppingBag className="w-3 h-3" />
            Shop Costume Ideas
          </span>
        </a>
      )}
    </div>
  );
});

// Optimized image component with lazy loading and intersection observer
const PartyImage = memo(function PartyImage({
  src,
  alt,
  onHover,
}: {
  src: string;
  alt: string;
  onHover: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Use intersection observer for truly lazy loading
  const imageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [src]
  );

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 animate-pulse" />
      )}
      <img
        ref={imageRef}
        src={imageSrc || undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-600 ${
          onHover ? 'scale-110' : 'scale-100'
        } ${imageLoaded ? '' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
      />
    </>
  );
});

// Main component with React.memo and proper comparison
export const PartyCardOptimized = memo(
  function PartyCardOptimized({
    event,
    partyTheme,
    timeFormat,
    onClick,
    delay = 0,
    isExpanded,
    onToggleExpand,
  }: PartyCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Memoize callbacks
    const handleShopClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // Get the party theme image or fallback
    const imageUrl =
      partyTheme?.imageUrl ||
      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/default-party.jpg';

    // Use LazyMotion for smaller bundle size
    return (
      <LazyMotion features={domAnimation}>
        <m.div
          initial="initial"
          animate="animate"
          variants={cardVariants}
          transition={{
            duration: 0.4,
            delay,
            type: 'spring',
            stiffness: 100,
          }}
          className="group relative"
        >
          {/* Compact Card */}
          <m.div
            layout
            onClick={onToggleExpand}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-pink-400/50 hover:shadow-xl hover:shadow-purple-500/20"
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
          >
            {/* Party Image with overlay */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <PartyImage src={imageUrl} alt={event.title} onHover={isHovered} />

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Static sparkle icon with CSS animation */}
              <SparkleIcon />

              {/* Party info at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4 className="text-white font-bold text-base mb-1 drop-shadow-lg line-clamp-1">
                  {event.title}
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/40 backdrop-blur-sm text-white font-semibold border border-blue-400/50">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.time, timeFormat)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-white/90">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Details Section */}
            <AnimatePresence mode="wait">
              {isExpanded && partyTheme && (
                <m.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={expandVariants}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden bg-black/20"
                >
                  <PartyDetails partyTheme={partyTheme} onShopClick={handleShopClick} />
                </m.div>
              )}
            </AnimatePresence>

            {/* Expand indicator when collapsed */}
            {!isExpanded && partyTheme && <InfoIndicator />}
          </m.div>
        </m.div>
      </LazyMotion>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.event.title === nextProps.event.title &&
      prevProps.event.time === nextProps.event.time &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.timeFormat === nextProps.timeFormat &&
      prevProps.delay === nextProps.delay
    );
  }
);
