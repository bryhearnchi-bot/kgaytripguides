import { cn } from '@/lib/utils';
import type { DailyEvent, PartyTheme } from '@/data/trip-data';
import { formatTime } from '@/lib/timeFormat';
import { MapPin, Clock, RotateCw } from 'lucide-react';

interface PartyFlipCardProps {
  event: DailyEvent;
  partyTheme?: PartyTheme;
  timeFormat: '12h' | '24h';
  isFlipped: boolean;
  onFlip: () => void;
}

export function PartyFlipCard({
  event,
  partyTheme,
  timeFormat,
  isFlipped,
  onFlip,
}: PartyFlipCardProps) {
  // Get the party theme image or fallback
  const imageUrl =
    partyTheme?.imageUrl ||
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/parties/default-party.jpg';

  return (
    <div className="relative w-full h-[240px] [perspective:2000px] cursor-pointer" onClick={onFlip}>
      <div
        className={cn(
          'relative w-full h-full',
          '[transform-style:preserve-3d]',
          'transition-all duration-700',
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        )}
      >
        {/* Front of card - Party Image */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full',
            '[backface-visibility:hidden] [transform:rotateY(0deg)]',
            'overflow-hidden rounded-xl',
            'border border-white/20',
            'shadow-xl',
            'transition-all duration-300',
            'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-400/60',
            isFlipped ? 'opacity-0' : 'opacity-100'
          )}
        >
          {/* Party Theme Image */}
          <img
            src={imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Party name and time at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <h4 className="text-white text-lg font-bold leading-tight drop-shadow-lg">
              {event.title}
            </h4>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/30 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-blue-400/40">
              <Clock className="w-3 h-3" />
              <span>{formatTime(event.time, timeFormat)}</span>
            </div>
          </div>

          {/* Flip indicator icon - bottom right */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <RotateCw className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Back of card - Party Details */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full',
            '[backface-visibility:hidden] [transform:rotateY(180deg)]',
            'rounded-xl',
            'bg-white/10 backdrop-blur-lg',
            'border border-blue-400/40',
            'shadow-xl',
            'transition-all duration-700',
            !isFlipped ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="p-5 pb-14 h-full overflow-y-auto space-y-3">
            {/* Party name */}
            <h3 className="text-lg font-bold text-blue-200 leading-tight">{event.title}</h3>

            {/* Time and Venue */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>{formatTime(event.time, timeFormat)}</span>
              </div>
              <div className="flex items-center gap-2 text-ocean-200 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.venue}</span>
              </div>
            </div>

            {/* Party theme description */}
            {partyTheme && (
              <div className="space-y-2">
                <p className="text-xs text-white/90 leading-relaxed">
                  {partyTheme.shortDesc || partyTheme.desc}
                </p>

                {/* Costume ideas if available */}
                {partyTheme.costumeIdeas && (
                  <div className="pt-3 border-t border-white/20">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5">
                      Costume Ideas
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {partyTheme.costumeIdeas}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!partyTheme && <p className="text-sm text-ocean-200">Theme info coming soon</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
