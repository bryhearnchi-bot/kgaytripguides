import React, { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DailyEvent, Talent } from "@/data/trip-data";
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import { findTalentInTitle } from '../utils/talentHelpers';
import { getPartyIcon } from '../utils/iconHelpers';

interface TimelineListProps {
  events: DailyEvent[];
  onTalentClick: (name: string) => void;
  onPartyClick?: (party: any) => void;
  eventDate?: string;
  TALENT: Talent[];
  PARTY_THEMES?: any[];
}

export const TimelineList = memo(function TimelineList({
  events,
  onTalentClick,
  onPartyClick,
  eventDate,
  TALENT
}: TimelineListProps) {
  const { timeFormat } = useTimeFormat();
  const sortedEvents = events;

  const renderTitleWithLinks = useCallback((event: DailyEvent, clickableNames: string[]) => {
    if (clickableNames.length === 0) {
      return event.title;
    }

    return (
      <span>
        {(() => {
          // Special handling for specific events that need custom linking
          if (event.title.toLowerCase().includes("audra mcdonald") && clickableNames.includes("Audra McDonald")) {
            const parts = event.title.split(/(\bAudra McDonald\b)/i);
            return parts.map((part, i) => {
              if (/audra mcdonald/i.test(part)) {
                return (
                  <button
                    key={i}
                    onClick={() => onTalentClick("Audra McDonald")}
                    className="underline underline-offset-2 decoration-ocean-500 hover:text-ocean-600 transition-colors"
                  >
                    {part}
                  </button>
                );
              }
              return <span key={i}>{part}</span>;
            });
          }

          if (event.title.toLowerCase().includes("bingo") && clickableNames.includes("The Diva (Bingo)")) {
            const parts = event.title.split(/(\bbingo\b)/i);
            return parts.map((part, i) => {
              if (/bingo/i.test(part)) {
                return (
                  <button
                    key={i}
                    onClick={() => onTalentClick("The Diva (Bingo)")}
                    className="underline underline-offset-2 decoration-ocean-500 hover:text-ocean-600 transition-colors"
                  >
                    {part}
                  </button>
                );
              }
              return <span key={i}>{part}</span>;
            });
          }

          // Default behavior for other performers
          return event.title.split(new RegExp(`(${clickableNames.join('|')})`, 'i')).map((part, i) => {
            const match = clickableNames.find(n => n.toLowerCase() === part.toLowerCase());
            if (match) {
              return (
                <button
                  key={i}
                  onClick={() => onTalentClick(match)}
                  className="underline underline-offset-2 decoration-ocean-500 hover:text-ocean-600 transition-colors"
                >
                  {part}
                </button>
              );
            }
            return <span key={i}>{part}</span>;
          });
        })()}
      </span>
    );
  }, [onTalentClick]);

  return (
    <div className="space-y-3">
      {sortedEvents.map((event, idx) => {
        const clickableNames = findTalentInTitle(event.title, TALENT);
        const titleElement = renderTitleWithLinks(event, clickableNames);

        return (
          <motion.div
            key={`${event.title}-${event.time}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.02 }}
            className="mb-3"
          >
            <Card
              className={`p-4 bg-white/90 hover:shadow-lg transition-all duration-300 border border-gray-200 min-h-24 relative ${
                (clickableNames.length > 0 || event.type === 'party' || event.type === 'club' || event.type === 'after')
                  ? 'cursor-pointer'
                  : ''
              }`}
              onClick={() => {
                if (clickableNames.length > 0 && clickableNames[0]) {
                  onTalentClick(clickableNames[0]);
                } else if ((event.type === 'party' || event.type === 'club' || event.type === 'after') && onPartyClick) {
                  onPartyClick(event);
                }
              }}
            >
              <div className="flex items-center gap-3 w-full">
                {/* Artist Thumbnail, Party Thumbnail, Bingo Thumbnail, or KGay Logo */}
                {(clickableNames.length > 0 || event.title.includes("KGay Travel") || event.type === 'party' || event.type === 'after' || event.type === 'club' || event.title.toLowerCase().includes("bingo")) && (
                  <div className="flex-shrink-0">
                    {event.title.includes("KGay Travel") ? (
                      <img
                        src="https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg"
                        alt="KGay Travel"
                        className="w-12 h-12 rounded-full object-cover border-2 border-ocean-200 cursor-pointer hover:border-ocean-400 transition-colors"
                        title="Pre-Trip Happy Hour by KGay Travel"
                      />
                    ) : clickableNames.length > 0 ? (
                      clickableNames.map((name) => {
                        const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
                        return talent ? (
                          <img
                            key={name}
                            src={talent.img}
                            alt={talent.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-ocean-200 cursor-pointer hover:border-ocean-400 transition-colors"
                            onClick={() => onTalentClick(name)}
                            loading="lazy"
                          />
                        ) : null;
                      }).filter(Boolean)[0]
                    ) : event.title.toLowerCase().includes("bingo") ? (
                      <img
                        src="https://img.freepik.com/premium-vector/bingo-pop-art-cartoon-comic-background-design-template_393879-5344.jpg"
                        alt="Bingo"
                        className="w-12 h-12 rounded-full object-cover border-2 border-ocean-200 shadow-md"
                        loading="lazy"
                      />
                    ) : (event.type === 'party' || event.type === 'after' || event.type === 'club') ? (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-ocean-200 bg-gradient-to-br from-coral to-pink-500 shadow-md">
                        {React.cloneElement(getPartyIcon(event.title), { className: "w-6 h-6 text-white" })}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {globalFormatTime(event.time, timeFormat)}
                      </div>
                      {(event.type === 'party' || event.type === 'club') && (
                        <div className="ml-2 text-coral">
                          {getPartyIcon(event.title)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                        {event.venue}
                      </Badge>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
                      {titleElement}
                    </h3>
                    {clickableNames.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-ocean-600 mb-1">
                        <User className="h-3 w-3" />
                        <span>Click artist name for bio & social links</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});