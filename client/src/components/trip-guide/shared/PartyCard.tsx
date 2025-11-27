import React, { memo, useMemo, useState, useEffect } from 'react';
import { Info, Shirt, Clock, MapPin } from 'lucide-react';
import type { DailyEvent, PartyTheme } from '@/data/trip-data';
import { formatTime } from '@/lib/timeFormat';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';
import { CardActionButton } from '@/components/ui/CardActionButton';

interface PartyCardProps {
  event: DailyEvent;
  partyTheme?: PartyTheme;
  timeFormat: '12h' | '24h';
  onPartyClick?: (party: any) => void;
}

export const PartyCard = memo<PartyCardProps>(function PartyCard({
  event,
  partyTheme,
  timeFormat: propTimeFormat,
  onPartyClick,
}) {
  const { timeFormat: contextTimeFormat } = useTimeFormat();
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showCostumeSheet, setShowCostumeSheet] = useState(false);

  // Use prop timeFormat if provided, otherwise use context
  const timeFormat = propTimeFormat || contextTimeFormat;

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showInfoSheet || showCostumeSheet) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
    return undefined;
  }, [showInfoSheet, showCostumeSheet]);

  // Default party image URL
  const defaultPartyImage =
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/sea_dyhgwy.jpg';

  // Memoize image URL computation
  const rawImageUrl = useMemo(
    () => partyTheme?.imageUrl || defaultPartyImage,
    [partyTheme?.imageUrl]
  );

  // Optimized card image URL (for the card display)
  const cardImageUrl = useMemo(
    () => getOptimizedImageUrl(rawImageUrl, IMAGE_PRESETS.card),
    [rawImageUrl]
  );

  // Optimized modal image URL (for larger display in bottom sheets)
  const modalImageUrl = useMemo(
    () => getOptimizedImageUrl(rawImageUrl, IMAGE_PRESETS.modal),
    [rawImageUrl]
  );

  // Memoize formatted time
  const formattedTime = useMemo(() => formatTime(event.time, timeFormat), [event.time, timeFormat]);

  return (
    <>
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 overflow-hidden">
        {/* Party Image */}
        <div className="relative">
          <img
            src={cardImageUrl}
            alt={event.title}
            className="w-full h-48 object-cover"
            loading="lazy"
            decoding="async"
            onError={e => {
              e.currentTarget.src = getOptimizedImageUrl(defaultPartyImage, IMAGE_PRESETS.card);
            }}
          />

          {/* Party Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
            {/* Party Name Badge */}
            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#002147]/80 text-white font-bold text-sm line-clamp-1">
                {event.title}
              </span>
            </div>

            {/* Time and Location Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/50 border border-blue-400/50">
                <Clock className="w-2.5 h-2.5 text-white" />
                <span className="text-white text-[10px] font-semibold">{formattedTime}</span>
              </div>

              {event.venue && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/50 border border-cyan-400/50">
                  <MapPin className="w-2.5 h-2.5 text-white" />
                  <span className="text-white text-[10px] font-medium truncate max-w-[120px]">
                    {event.venue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white/5 border-t border-white/10 px-3 py-1.5">
          <div className="flex gap-2">
            <CardActionButton
              icon={<Info className="w-3.5 h-3.5" />}
              label="Party Info"
              onClick={() => setShowInfoSheet(true)}
              className="flex-1"
            />
            <CardActionButton
              icon={<Shirt className="w-3.5 h-3.5" />}
              label="Costume Ideas"
              onClick={() => setShowCostumeSheet(true)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Party Info Sheet */}
      <ReactiveBottomSheet
        open={showInfoSheet}
        onOpenChange={setShowInfoSheet}
        title={event.title}
        icon={Info}
      >
        <div className="space-y-4">
          {/* Party Hero Image */}
          <div className="w-full">
            <img
              src={modalImageUrl}
              alt={event.title}
              className="w-full aspect-video object-cover rounded-xl border-2 border-blue-400/30 shadow-lg"
              loading="lazy"
            />
          </div>

          {partyTheme?.shortDesc && (
            <p className="text-white/90 text-sm leading-relaxed">{partyTheme.shortDesc}</p>
          )}
          {partyTheme?.desc && (
            <p className="text-white/80 text-sm leading-relaxed">{partyTheme.desc}</p>
          )}
          {!partyTheme?.shortDesc && !partyTheme?.desc && (
            <p className="text-white/60 text-sm italic">No party information available yet.</p>
          )}
        </div>
      </ReactiveBottomSheet>

      {/* Costume Ideas Sheet */}
      <ReactiveBottomSheet
        open={showCostumeSheet}
        onOpenChange={setShowCostumeSheet}
        title="Costume Ideas"
        icon={Shirt}
      >
        <div className="space-y-4">
          {/* Party Hero Image */}
          <div className="w-full">
            <img
              src={modalImageUrl}
              alt={event.title}
              className="w-full aspect-video object-cover rounded-xl border-2 border-pink-400/30 shadow-lg"
              loading="lazy"
            />
          </div>

          {partyTheme?.costumeIdeas ? (
            <p className="text-white/80 text-sm leading-relaxed">{partyTheme.costumeIdeas}</p>
          ) : (
            <p className="text-white/60 text-sm italic">No costume ideas available yet.</p>
          )}
        </div>
      </ReactiveBottomSheet>
    </>
  );
});
