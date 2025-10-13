import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export const PartyCard = memo<PartyCardProps>(function PartyCard({
  event,
  partyTheme,
  timeFormat,
  onClick,
  delay = 0,
  isExpanded,
  onToggleExpand,
}) {
  // Memoize image URL computation
  const imageUrl = useMemo(
    () =>
      partyTheme?.imageUrl ||
      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/default-party.jpg',
    [partyTheme?.imageUrl]
  );

  // Memoize formatted time
  const formattedTime = useMemo(() => formatTime(event.time, timeFormat), [event.time, timeFormat]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      className="group relative"
    >
      {/* Compact Card */}
      <motion.div
        layout
        onClick={onToggleExpand}
        className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-pink-400/50 hover:shadow-xl hover:shadow-purple-500/20"
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Party Image with overlay */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <motion.img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Sparkle icon - static for performance */}
          <div className="absolute top-2 right-2 bg-pink-500/30 backdrop-blur-sm rounded-full p-1.5 border border-pink-400/50">
            <Sparkles className="w-3 h-3 text-pink-300" />
          </div>

          {/* Party info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="text-white font-bold text-base mb-1 drop-shadow-lg line-clamp-1">
              {event.title}
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/40 backdrop-blur-sm text-white font-semibold border border-blue-400/50">
                <Clock className="w-3 h-3" />
                <span>{formattedTime}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-white/90">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details Section */}
        <AnimatePresence>
          {isExpanded && partyTheme && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-black/20"
            >
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
                    <p className="text-white/80 text-xs leading-relaxed">
                      {partyTheme.costumeIdeas}
                    </p>
                  </div>
                )}

                {/* Amazon Shopping Button (only if URL exists) */}
                {partyTheme.amazonShoppingListUrl && (
                  <motion.a
                    href={partyTheme.amazonShoppingListUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-white text-xs font-semibold rounded-lg border border-amber-400/40 flex items-center justify-center gap-1.5 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Shop Costume Ideas</span>
                  </motion.a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator when collapsed - static for performance */}
        {!isExpanded && partyTheme && (
          <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1 border border-white/30">
            <Info className="w-3 h-3 text-white" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
