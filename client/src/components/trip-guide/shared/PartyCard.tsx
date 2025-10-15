import React, { memo, useMemo } from 'react';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { DailyEvent, PartyTheme } from '@/data/trip-data';
import { formatTime } from '@/lib/timeFormat';

interface PartyCardProps {
  event: DailyEvent;
  partyTheme?: PartyTheme;
  timeFormat: '12h' | '24h';
  onPartyClick?: (party: any) => void;
}

export const PartyCard = memo<PartyCardProps>(function PartyCard({
  event,
  partyTheme,
  timeFormat,
  onPartyClick,
}) {
  // Memoize image URL computation
  const imageUrl = useMemo(
    () =>
      partyTheme?.imageUrl ||
      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/sea_dyhgwy.jpg',
    [partyTheme?.imageUrl]
  );

  // Memoize formatted time
  const formattedTime = useMemo(() => formatTime(event.time, timeFormat), [event.time, timeFormat]);

  return (
    <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-colors duration-200 h-full">
      {/* Desktop: Side-by-side, Mobile: Stacked - Fixed height to match all cards */}
      <div className="flex flex-col sm:flex-row h-full sm:h-[240px]">
        {/* Left/Top: Party Image with overlay info */}
        <div className="relative w-full sm:w-1/2 h-48 sm:h-full flex-shrink-0">
          {/* Party Image */}
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={e => {
              e.currentTarget.src =
                'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/sea_dyhgwy.jpg';
            }}
          />

          {/* Sparkle Icon - Top Right */}
          <div className="absolute top-3 right-3 bg-pink-500/40 rounded-full p-1.5 border border-pink-400/50 z-20">
            <Sparkles className="w-3.5 h-3.5 text-pink-200" />
          </div>

          {/* Party Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/90 to-transparent">
            {/* Party Name */}
            <h3 className="text-white font-bold text-base sm:text-lg mb-2 line-clamp-2">
              {event.title}
            </h3>

            {/* Time and Location Badges - Side by Side */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/50 border border-blue-400/50">
                <Clock className="w-2.5 h-2.5 text-white" />
                <span className="text-white text-[10px] font-semibold">{formattedTime}</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/50 border border-cyan-400/50">
                <MapPin className="w-2.5 h-2.5 text-white" />
                <span className="text-white text-[10px] font-medium truncate max-w-[120px]">
                  {event.venue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right/Bottom: Content Details */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col min-w-0 bg-black/20">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Description */}
            {(partyTheme?.desc || partyTheme?.longDescription) && (
              <div>
                <p className="text-white/90 text-xs leading-relaxed line-clamp-4">
                  {partyTheme.desc || partyTheme.longDescription}
                </p>
              </div>
            )}

            {/* Costume Ideas */}
            {partyTheme?.costumeIdeas && (
              <div className="pt-2 border-t border-white/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                  <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wide">
                    Costume Ideas
                  </h4>
                </div>
                <p className="text-white/90 text-xs leading-relaxed line-clamp-4">
                  {partyTheme.costumeIdeas}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
