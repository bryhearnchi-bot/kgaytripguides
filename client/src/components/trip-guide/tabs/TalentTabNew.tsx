import React, { memo, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Instagram,
  Twitter,
  Globe,
  Youtube,
  Linkedin,
  ExternalLink,
  Play,
  Calendar,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Talent } from '@/data/trip-data';
import { useTalentByCategory } from '../hooks/useTalentByCategory';

interface TalentTabProps {
  TALENT: Talent[];
  SCHEDULED_DAILY: Array<{
    key: string;
    items: Array<{
      time: string;
      title: string;
      venue: string;
      talent?: Array<{ name: string }>;
      date?: string;
    }>;
  }>;
  onTalentClick: (name: string) => void;
}

interface TalentCard {
  id: string;
  name: string;
  category: string;
  bio: string;
  knownFor: string;
  img: string;
  social: Record<string, string>;
}

const smoothEasing = [0.4, 0.0, 0.2, 1];

export const TalentTabNew = memo(function TalentTabNew({
  TALENT,
  SCHEDULED_DAILY,
  onTalentClick,
}: TalentTabProps) {
  const { talentByCategory, sortedCategories } = useTalentByCategory(TALENT);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedTalentForEvents, setSelectedTalentForEvents] = useState<string | null>(null);
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter events by selected talent
  const talentEvents = useMemo(() => {
    if (!selectedTalentForEvents || !SCHEDULED_DAILY) return [];

    const events: Array<{
      date: string;
      time: string;
      title: string;
      venue: string;
    }> = [];

    SCHEDULED_DAILY.forEach(day => {
      day.items.forEach(event => {
        // Check if this event features the selected talent
        if (event.talent && event.talent.some(t => t.name === selectedTalentForEvents)) {
          events.push({
            date: day.key,
            time: event.time,
            title: event.title,
            venue: event.venue,
          });
        }
      });
    });

    return events;
  }, [selectedTalentForEvents, SCHEDULED_DAILY]);

  // Center scrollable area on mount
  useEffect(() => {
    scrollRefs.current.forEach(ref => {
      if (ref) {
        const scrollWidth = ref.scrollWidth;
        const clientWidth = ref.clientWidth;
        ref.scrollLeft = (scrollWidth - clientWidth) / 2;
      }
    });
  }, [talentByCategory]);

  const handleCardClick = (id: string) => {
    if (selectedCard === id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(id);
      onTalentClick(id);

      // Center the clicked card
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-card-id="${id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }, 50);
    }
  };

  const getSocialIcon = useCallback((platform: string) => {
    const iconClass = 'w-4 h-4';
    switch (platform) {
      case 'instagram':
        return <Instagram className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
      case 'website':
        return <Globe className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'linkedin':
        return <Linkedin className={iconClass} />;
      case 'linktree':
        return <ExternalLink className={iconClass} />;
      default:
        return <Globe className={iconClass} />;
    }
  }, []);

  const handleViewEvents = (e: React.MouseEvent, talentName: string) => {
    e.stopPropagation();
    setSelectedTalentForEvents(talentName);
    setShowEventsModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <User className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
          Talent & Performers
        </h2>
      </div>

      {TALENT.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No talent information available</h3>
          <p className="text-white/70">Talent roster will be available soon.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCategories.map((category, categoryIndex) => {
            const categoryTalent = talentByCategory[category];
            if (!categoryTalent) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: categoryIndex * 0.05 }}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white/90 bg-gradient-to-r from-ocean-600 to-ocean-400 px-4 py-2 rounded-lg inline-block shadow-md">
                    {category}
                  </h3>
                </div>

                {/* Expandable Cards Container */}
                <div
                  ref={el => {
                    if (el) scrollRefs.current.set(category, el);
                  }}
                  className="scrollbar-hide overflow-x-auto pt-4 pb-8"
                  style={{
                    scrollSnapType: 'x mandatory',
                    scrollPaddingLeft: '20%',
                  }}
                >
                  <div className="flex gap-4">
                    {categoryTalent.map((talent, talentIndex) => {
                      const cardId = `${category}-${talent.name}`;
                      const isSelected = selectedCard === cardId;

                      // 10% smaller than original: 200px → 180px, 300px → 270px
                      const cardWidth = isSelected ? '450px' : '180px';
                      const cardHeight = '270px';

                      return (
                        <motion.div
                          key={cardId}
                          layout
                          data-card-id={cardId}
                          className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/20 shadow-xl bg-white/95"
                          style={{
                            scrollSnapAlign: 'start',
                          }}
                          animate={{
                            width: cardWidth,
                          }}
                          transition={{
                            duration: 0.5,
                            ease: smoothEasing,
                          }}
                          onClick={() => handleCardClick(cardId)}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                        >
                          {/* Main Card Content - Square Image */}
                          <div className="relative h-full w-[180px]">
                            <img
                              src={talent.img}
                              alt={talent.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={e => {
                                e.currentTarget.src =
                                  'https://via.placeholder.com/180?text=No+Image';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                              <h2 className="text-xl font-bold leading-tight">{talent.name}</h2>
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  aria-label="Expand card"
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm transition-transform hover:scale-110"
                                >
                                  <Play className="h-5 w-5 text-white fill-white" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content Panel */}
                          <AnimatePresence mode="popLayout">
                            {isSelected && (
                              <motion.div
                                initial={{ width: 0, opacity: 0, filter: 'blur(5px)' }}
                                animate={{ width: '270px', opacity: 1, filter: 'blur(0px)' }}
                                exit={{ width: 0, opacity: 0, filter: 'blur(5px)' }}
                                transition={{
                                  duration: 0.5,
                                  ease: smoothEasing,
                                  opacity: { duration: 0.3, delay: 0.2 },
                                }}
                                className="absolute top-0 right-0 h-full bg-white"
                              >
                                <motion.div
                                  className="flex h-full flex-col justify-between p-6"
                                  initial={{ opacity: 0, x: 20, filter: 'blur(5px)' }}
                                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                  exit={{ opacity: 0, x: 20, filter: 'blur(5px)' }}
                                  transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                  <div className="space-y-4">
                                    {/* Bio */}
                                    {talent.bio && (
                                      <div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {talent.bio}
                                        </p>
                                      </div>
                                    )}

                                    {/* Known For */}
                                    {talent.knownFor && (
                                      <div>
                                        <p className="text-xs font-semibold text-ocean-700 uppercase tracking-wide mb-1">
                                          Known For
                                        </p>
                                        <p className="text-sm text-gray-600">{talent.knownFor}</p>
                                      </div>
                                    )}

                                    {/* Social Links */}
                                    {talent.social && Object.keys(talent.social).length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-ocean-700 uppercase tracking-wide mb-2">
                                          Connect
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                          {Object.entries(talent.social).map(([platform, url]) => {
                                            if (!url) return null;
                                            return (
                                              <a
                                                key={platform}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center justify-center h-8 w-8 rounded-full bg-ocean-100 text-ocean-600 hover:bg-ocean-200 hover:text-ocean-700 transition-colors"
                                                title={platform}
                                              >
                                                {getSocialIcon(platform)}
                                              </a>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* View Events Button */}
                                  <Button
                                    onClick={e => handleViewEvents(e, talent.name)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-4 bg-ocean-50 border-ocean-300 text-ocean-700 hover:bg-ocean-100"
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    View Events
                                  </Button>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowEventsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedTalentForEvents}</h3>
                <p className="text-sm text-gray-500">
                  {talentEvents.length} {talentEvents.length === 1 ? 'event' : 'events'} scheduled
                </p>
              </div>
              <button
                onClick={() => setShowEventsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Events List */}
            {talentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No events scheduled for this artist</p>
              </div>
            ) : (
              <div className="space-y-3">
                {talentEvents.map((event, index) => {
                  // Format date
                  const eventDate = new Date(event.date);
                  const dateStr = eventDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-ocean-50 to-white border border-ocean-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-ocean-600 text-white rounded-lg p-2">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
                            {event.title}
                          </h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-ocean-600 flex-shrink-0" />
                              <span>{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-ocean-600 flex-shrink-0" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-ocean-600 flex-shrink-0" />
                              <span className="truncate">{event.venue || 'TBD'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setShowEventsModal(false)}
                className="w-full bg-ocean-600 hover:bg-ocean-700"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});
