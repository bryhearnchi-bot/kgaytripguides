import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Circle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface EventCardProps {
  event: {
    time: string;
    title: string;
    venue?: string;
    description?: string;
    imageUrl?: string;
    talent?: Array<{
      id: number;
      name: string;
      profileImageUrl?: string;
    }>;
    partyTheme?: {
      id: number;
      name: string;
      longDescription?: string;
      costumeIdeas?: string;
      imageUrl?: string;
    };
  };
  onTalentClick?: (name: string) => void;
  onPartyThemeClick?: (partyTheme: any) => void;
  className?: string;
}

export const EventCard = memo<EventCardProps>(function EventCard({
  event,
  onTalentClick,
  onPartyThemeClick,
  className = '',
}) {
  const [showViewTypeModal, setShowViewTypeModal] = useState(false);
  const [showArtistSelectModal, setShowArtistSelectModal] = useState(false);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showViewTypeModal || showArtistSelectModal) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showViewTypeModal, showArtistSelectModal]);

  // Memoize computed values
  const eventImage = useMemo(
    () => event.imageUrl || event.talent?.[0]?.profileImageUrl,
    [event.imageUrl, event.talent]
  );

  const hasArtists = useMemo(() => event.talent && event.talent.length > 0, [event.talent]);

  const hasPartyTheme = useMemo(() => !!event.partyTheme, [event.partyTheme]);

  const hasBoth = useMemo(() => hasArtists && hasPartyTheme, [hasArtists, hasPartyTheme]);

  const handleCardClick = useCallback(() => {
    if (hasBoth) {
      // Show view type selection modal
      setShowViewTypeModal(true);
    } else if (hasArtists && event.talent) {
      // Only artists
      if (event.talent.length === 1) {
        // Single artist - open directly
        if (onTalentClick) {
          onTalentClick(event.talent[0].name);
        }
      } else {
        // Multiple artists - show selection
        setShowArtistSelectModal(true);
      }
    } else if (hasPartyTheme && event.partyTheme) {
      // Only party theme
      if (onPartyThemeClick) {
        onPartyThemeClick(event.partyTheme);
      }
    }
  }, [
    hasBoth,
    hasArtists,
    hasPartyTheme,
    event.talent,
    event.partyTheme,
    onTalentClick,
    onPartyThemeClick,
  ]);

  const handleViewArtists = useCallback(() => {
    setShowViewTypeModal(false);
    if (event.talent && event.talent.length === 1) {
      // Single artist - open directly
      if (onTalentClick) {
        onTalentClick(event.talent[0].name);
      }
    } else {
      // Multiple artists - show selection
      setShowArtistSelectModal(true);
    }
  }, [event.talent, onTalentClick]);

  const handleViewPartyTheme = useCallback(() => {
    setShowViewTypeModal(false);
    if (event.partyTheme && onPartyThemeClick) {
      onPartyThemeClick(event.partyTheme);
    }
  }, [event.partyTheme, onPartyThemeClick]);

  const handleArtistSelect = useCallback(
    (artistName: string) => {
      setShowArtistSelectModal(false);
      if (onTalentClick) {
        onTalentClick(artistName);
      }
    },
    [onTalentClick]
  );

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${className}`}
      >
        <div className="flex gap-4">
          {/* Event/Artist Image - Larger Square */}
          {eventImage && (
            <div className="flex-shrink-0">
              <img
                src={eventImage}
                alt={event.title}
                className="w-24 h-24 object-cover rounded-lg border border-white/20 shadow-md"
                loading="lazy"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {/* Desktop/Tablet: Time • Event Name on one line */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-ocean-200 text-sm font-semibold">{event.time}</span>
              <Circle className="w-1.5 h-1.5 fill-current text-ocean-300" />
              <span className="text-white font-bold text-base">{event.title}</span>
            </div>

            {/* Mobile: Time on separate line */}
            <div className="md:hidden">
              <span className="text-ocean-200 text-sm font-semibold">{event.time}</span>
            </div>

            {/* Mobile: Event Name on separate line */}
            <div className="md:hidden">
              <span className="text-white font-bold text-base">{event.title}</span>
            </div>

            {/* Venue/Location - separate line for both */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-medium border border-cyan-400/30">
                {event.venue || 'TBD'}
              </span>
            </div>

            {/* Artists - separate line for both */}
            {event.talent && event.talent.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.talent.map((t: any, tidx: number) => (
                  <button
                    key={tidx}
                    onClick={e => {
                      e.stopPropagation();
                      if (onTalentClick) {
                        onTalentClick(t.name);
                      }
                    }}
                    className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-200 rounded-full hover:bg-purple-500/30 transition-colors border border-purple-400/30 font-medium flex items-center gap-1 group"
                  >
                    <span>{t.name}</span>
                    <span className="text-purple-300 group-hover:translate-x-0.5 transition-transform text-[10px]">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Party Theme Badge - Below Artists */}
            {event.partyTheme && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (onPartyThemeClick) {
                      onPartyThemeClick(event.partyTheme);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium border border-blue-400/30 hover:bg-blue-500/30 transition-colors flex items-center gap-1 group"
                >
                  <span>Party Theme: {event.partyTheme.name}</span>
                  <span className="text-blue-300 group-hover:translate-x-0.5 transition-transform text-[10px]">
                    →
                  </span>
                </button>
              </div>
            )}

            {/* Description (if available) */}
            {event.description && (
              <p className="text-ocean-50 text-xs mt-1 pt-2 border-t border-white/10">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* View Type Selection Modal (Artist vs Party Theme) */}
      {showViewTypeModal &&
        createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={() => setShowViewTypeModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl my-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    What would you like to view?
                  </h3>
                  <button
                    onClick={() => setShowViewTypeModal(false)}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all flex-shrink-0 ml-2"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Party Theme Option */}
                  {event.partyTheme && (
                    <button
                      onClick={handleViewPartyTheme}
                      className="w-full p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-300 font-medium mb-1">Party Theme</p>
                          <p className="text-white font-bold">{event.partyTheme.name}</p>
                        </div>
                        <span className="text-blue-300 group-hover:translate-x-1 transition-transform text-xl">
                          →
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Artists Option */}
                  {event.talent && event.talent.length > 0 && (
                    <button
                      onClick={handleViewArtists}
                      className="w-full p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-xl transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-300 font-medium mb-1">
                            {event.talent.length === 1 ? 'Artist' : 'Artists'}
                          </p>
                          <p className="text-white font-bold">
                            {event.talent.length === 1
                              ? event.talent[0].name
                              : `${event.talent.length} Artists`}
                          </p>
                        </div>
                        <span className="text-purple-300 group-hover:translate-x-1 transition-transform text-xl">
                          →
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}

      {/* Artist Selection Modal */}
      {showArtistSelectModal &&
        event.talent &&
        event.talent.length > 1 &&
        createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={() => setShowArtistSelectModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl my-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Select an Artist</h3>
                  <button
                    onClick={() => setShowArtistSelectModal(false)}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all flex-shrink-0 ml-2"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {event.talent.map((artist, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleArtistSelect(artist.name)}
                      className="w-full p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-xl transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {artist.profileImageUrl && (
                          <img
                            src={artist.profileImageUrl}
                            alt={artist.name}
                            className="w-12 h-12 rounded-lg object-cover border border-purple-400/30"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-bold">{artist.name}</p>
                        </div>
                        <span className="text-purple-300 group-hover:translate-x-1 transition-transform text-xl">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
});
