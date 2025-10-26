import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';
import { MapPin, Anchor, Calendar, Clock, Landmark, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateOnly } from '@/lib/utils';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';

export interface ItineraryStop {
  key: string;
  port: string;
  arrive: string;
  depart: string;
  allAboard?: string;
  imageUrl?: string;
  rawDate: string;
  description?: string;
  topAttractions?: string[];
  topLgbtVenues?: string[];
  locationId?: number;
}

export interface ItineraryCardProps {
  stops: ItineraryStop[];
  className?: string;
  onViewEvents?: (dateKey: string, portName: string) => void;
}

export default function ItineraryCard({ stops, className, onViewEvents }: ItineraryCardProps) {
  const { timeFormat } = useTimeFormat();
  const [activeStop, setActiveStop] = useState<ItineraryStop | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setActiveStop(null));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveStop(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {activeStop ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        ) : null}
      </AnimatePresence>

      {/* Expanded card modal */}
      <AnimatePresence>
        {activeStop ? (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto">
            <motion.div
              className="bg-white/95 backdrop-blur-lg flex w-full max-w-4xl cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/30 shadow-2xl my-8"
              ref={ref}
              layoutId={`stop-${activeStop.key}`}
              style={{ borderRadius: 16 }}
            >
              {/* Hero image */}
              <motion.div
                className="relative h-64 w-full overflow-hidden"
                layoutId={`stop-image-${activeStop.key}`}
              >
                <img
                  src={
                    activeStop.imageUrl ||
                    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
                  }
                  alt={activeStop.port}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src =
                      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <motion.h2
                    className="text-3xl font-bold text-white drop-shadow-lg"
                    layoutId={`stop-port-${activeStop.key}`}
                  >
                    {activeStop.port}
                  </motion.h2>
                  <motion.div
                    className="mt-2 flex items-center gap-2 text-white/90"
                    layoutId={`stop-date-${activeStop.key}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {dateOnly(activeStop.rawDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex flex-col gap-6 p-6">
                {/* Times section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap gap-4"
                  layoutId={`stop-times-${activeStop.key}`}
                >
                  {activeStop.arrive !== '—' && (
                    <div className="flex items-center gap-2 rounded-lg bg-ocean-50 px-4 py-2">
                      <Anchor className="h-4 w-4 text-ocean-600" />
                      <span className="text-sm font-medium text-gray-700">Arrive:</span>
                      <span className="text-sm font-bold text-ocean-700">
                        {formatTime(activeStop.arrive, timeFormat)}
                      </span>
                    </div>
                  )}
                  {activeStop.depart !== '—' && (
                    <div className="flex items-center gap-2 rounded-lg bg-ocean-50 px-4 py-2">
                      <Anchor className="h-4 w-4 text-ocean-600 rotate-180" />
                      <span className="text-sm font-medium text-gray-700">Depart:</span>
                      <span className="text-sm font-bold text-ocean-700">
                        {formatTime(activeStop.depart, timeFormat)}
                      </span>
                    </div>
                  )}
                  {activeStop.allAboard && activeStop.allAboard !== '—' && (
                    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-coral to-pink-500 px-4 py-2 shadow-md">
                      <Clock className="h-4 w-4 text-white" />
                      <span className="text-sm font-bold text-white">All Aboard:</span>
                      <span className="text-sm font-bold text-white">
                        {formatTime(activeStop.allAboard, timeFormat)}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Description */}
                {activeStop.description && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-gray-700"
                  >
                    <p className="text-sm leading-relaxed">{activeStop.description}</p>
                  </motion.div>
                )}

                {/* Top Attractions */}
                {activeStop.topAttractions && activeStop.topAttractions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-ocean-600" />
                      <h3 className="text-lg font-bold text-gray-900">Top Attractions</h3>
                    </div>
                    <ul className="space-y-2">
                      {activeStop.topAttractions.map((attraction, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                        >
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-800">{attraction}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Top LGBT+ Venues */}
                {activeStop.topLgbtVenues && activeStop.topLgbtVenues.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Wine className="h-5 w-5 text-pink-600" />
                      <h3 className="text-lg font-bold text-gray-900">LGBT+ Venues & Bars</h3>
                    </div>
                    <ul className="space-y-2">
                      {activeStop.topLgbtVenues.map((venue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-lg bg-pink-50 p-3 transition-colors hover:bg-pink-100"
                        >
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pink-200 text-xs font-bold text-pink-700">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-800">{venue}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* View Events Button */}
                {onViewEvents && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center pt-4"
                  >
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        onViewEvents(activeStop.key, activeStop.port);
                        setActiveStop(null);
                      }}
                      className="bg-ocean-600 px-6 py-3 text-white hover:bg-ocean-700"
                    >
                      View Events for This Day
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Collapsed cards list */}
      <div className={`relative flex flex-col gap-4 ${className || ''}`}>
        {stops.map((stop, index) => (
          <motion.div
            layoutId={`stop-${stop.key}`}
            key={stop.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.02 }}
            className="group cursor-pointer overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            onClick={() => setActiveStop(stop)}
            style={{ borderRadius: 12 }}
          >
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <motion.div
                layoutId={`stop-image-${stop.key}`}
                className="h-48 w-full flex-shrink-0 overflow-hidden md:h-auto md:w-56"
              >
                <img
                  src={
                    stop.imageUrl ||
                    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
                  }
                  alt={stop.port}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src =
                      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                  }}
                />
              </motion.div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  {/* Date badge */}
                  <motion.div layoutId={`stop-date-${stop.key}`} className="mb-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-ocean-500/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">
                        {dateOnly(stop.rawDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="md:hidden">
                        {dateOnly(stop.rawDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </motion.div>

                  {/* Port name */}
                  <motion.div
                    layoutId={`stop-port-${stop.key}`}
                    className="mb-3 flex items-center gap-2"
                  >
                    <MapPin className="h-5 w-5 flex-shrink-0 text-white" />
                    <h3 className="text-xl font-bold text-white">{stop.port}</h3>
                  </motion.div>

                  {/* Times */}
                  <motion.div
                    layoutId={`stop-times-${stop.key}`}
                    className="flex flex-wrap gap-2 text-sm text-white/90"
                  >
                    {stop.arrive !== '—' && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Arrive:</span>
                        <span className="font-bold">{formatTime(stop.arrive, timeFormat)}</span>
                      </div>
                    )}
                    {stop.depart !== '—' && (
                      <>
                        <span className="text-white/50">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Depart:</span>
                          <span className="font-bold">{formatTime(stop.depart, timeFormat)}</span>
                        </div>
                      </>
                    )}
                    {stop.allAboard && stop.allAboard !== '—' && (
                      <>
                        <span className="text-white/50">•</span>
                        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-pink-500 px-2 py-0.5 text-white">
                          <Clock className="h-3 w-3" />
                          <span className="font-bold">
                            All Aboard: {formatTime(stop.allAboard, timeFormat)}
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
