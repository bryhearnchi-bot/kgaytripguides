import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { dateOnly } from "@/lib/utils";
import { UniversalHero } from "@/components/UniversalHero";
import { StandardizedTabContainer } from "@/components/StandardizedTabContainer";
import { StandardizedContentLayout } from "@/components/StandardizedContentLayout";
import {
  ChevronDown, 
  ChevronUp, 
  CalendarDays, 
  MapPin, 
  PartyPopper, 
  Clock, 
  Search, 
  Images, 
  Music, 
  Info, 
  X, 
  ChevronRight, 
  Anchor, 
  FileText, 
  Map, 
  Phone, 
  Wine, 
  Waves, 
  Piano, 
  Crown, 
  Zap, 
  Heart, 
  Globe, 
  Star, 
  Sparkles, 
  Disc, 
  Music2, 
  Palette, 
  Flag, 
  Ship, 
  Mail, 
  ExternalLink, 
  Plus, 
  Download, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin, 
  User, 
  RefreshCw,
  Lightbulb,
  UtensilsCrossed
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Talent, DailyEvent, CityAttraction } from "@/data/trip-data";
import { useTripData, transformTripData } from "@/hooks/useTripData";
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime, formatAllAboard as globalFormatAllAboard, parseTime } from '@/lib/timeFormat';




function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

// Helper function to convert time to minutes since midnight for proper sorting
function timeToMinutes(timeStr: string): number {
  const parsed = parseTime(timeStr);
  if (!parsed) return 9999; // Put unparseable times at the end
  return parsed.h * 60 + parsed.m;
}

function isDateInPast(dateKey: string): boolean {
  const today = new Date();
  // Parse date string directly as local date
  const [year, month, day] = dateKey.split('-').map(Number);
  const tripDate = new Date(year || 2025, (month || 1) - 1, day || 1, 0, 0, 0, 0);

  // Set today to start of day for comparison
  today.setHours(0, 0, 0, 0);

  return tripDate < today;
}

function createCalendarEvent(event: DailyEvent, eventDate: string): {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description: string;
} {
  // Parse the event date to get the year, month, day
  const dateMatch = eventDate.match(/(\w+),\s*(\w+)\s*(\d+)/);
  if (!dateMatch) {
    throw new Error('Invalid date format');
  }

  const [, , monthStr, dayStr] = dateMatch;
  const year = 2025;
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'January': 0,
    'Feb': 1, 'February': 1,
    'Mar': 2, 'March': 2,
    'Apr': 3, 'April': 3,
    'May': 4,
    'Jun': 5, 'June': 5,
    'Jul': 6, 'July': 6,
    'Aug': 7, 'August': 7,
    'Sep': 8, 'September': 8,
    'Oct': 9, 'October': 9,
    'Nov': 10, 'November': 10,
    'Dec': 11, 'December': 11
  };
  const month = monthMap[monthStr || ''] ?? 8; // Default to September for current trip
  const day = parseInt(dayStr || '0', 10);

  // Parse the event time
  const timeData = parseTime(event.time);
  if (!timeData) {
    throw new Error('Invalid time format');
  }

  // Create date in local timezone (no timezone adjustments)
  const startDate = new Date(year, month, day, timeData.h, timeData.m, 0, 0);

  // Set duration based on event type - KGay Travel pre-trip party is 3 hours, others are 1 hour
  const duration = event.title.includes("KGay Travel") ? 3 : 1;
  const endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));

  return {
    title: event.title,
    startDate,
    endDate,
    location: event.venue,
    description: `${event.title} at ${event.venue}`
  };
}

// Removed getPortTimezoneOffset function - no longer needed as we don't do timezone adjustments

function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICSContent(eventData: ReturnType<typeof createCalendarEvent>): string {
  const startDate = formatDateForCalendar(eventData.startDate);
  const endDate = formatDateForCalendar(eventData.endDate);
  const now = formatDateForCalendar(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atlantis Trip Guide//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@trip-guide.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${eventData.title}`,
    `DESCRIPTION:${eventData.description}`,
    `LOCATION:${eventData.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function addToGoogleCalendar(eventData: ReturnType<typeof createCalendarEvent>) {
  const startDate = eventData.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = eventData.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${startDate}/${endDate}`,
    details: eventData.description,
    location: eventData.location
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

function addToAppleCalendar(eventData: ReturnType<typeof createCalendarEvent>) {
  const icsContent = generateICSContent(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Try to open with webcal protocol first (for macOS)
  const webcalUrl = url.replace('blob:', 'webcal://');

  // Create a temporary link to trigger download/open
  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

  // For iOS devices, try to open with calendar app
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    link.href = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function downloadICS(eventData: ReturnType<typeof createCalendarEvent>) {
  const icsContent = generateICSContent(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function findTalentInTitle(title: string, TALENT: any[]): string[] {
  return TALENT
    .filter(t => {
      const titleLower = title.toLowerCase();
      const nameLower = t.name.toLowerCase();

      // Check for exact name matches first
      if (titleLower.includes(nameLower)) return true;

      // Special cases for specific performers
      if (t.name === "Audra McDonald" && titleLower.includes("audra mcdonald")) return true;
      if (t.name === "The Diva (Bingo)" && titleLower.includes("bingo")) return true;
      if (t.name === "Monét X Change" && titleLower.includes("monet")) return true;
      if (t.name === "Sherry Vine" && titleLower.includes("sherry")) return true;
      if (t.name === "Alexis Michelle" && titleLower.includes("alexis")) return true;
      if (t.name === "Reuben Kaye" && titleLower.includes("reuben")) return true;
      if (t.name === "Rob Houchen" && titleLower.includes("rob")) return true;
      if (t.name === "Alyssa Wray" && titleLower.includes("alyssa")) return true;
      if (t.name === "Brad Loekle" && titleLower.includes("brad")) return true;
      if (t.name === "Rachel Scanlon" && titleLower.includes("rachel")) return true;
      if (t.name === "Daniel Webb" && titleLower.includes("daniel")) return true;
      if (t.name === "Leona Winter" && titleLower.includes("leona")) return true;
      if (t.name === "AirOtic" && titleLower.includes("airotic")) return true;
      if (t.name === "Another Rose" && titleLower.includes("another rose")) return true;
      if (t.name === "Persephone" && titleLower.includes("persephone")) return true;
      if (t.name === "William TN Hall" && titleLower.includes("william")) return true;
      if (t.name === "Brian Nash" && titleLower.includes("brian")) return true;
      if (t.name === "Brandon James Gwinn" && titleLower.includes("brandon")) return true;

      return false;
    })
    .map(t => t.name);
}

function getPartyIcon(title: string) {
  if (title.includes("Dog Tag")) return <Flag className="w-4 h-4" />;
  if (title.includes("UNITE")) return <Globe className="w-4 h-4" />;
  if (title.includes("Empires")) return <Crown className="w-4 h-4" />;
  if (title.includes("Greek Isles") || title.includes("Here We Go Again")) return <Star className="w-4 h-4" />;
  if (title.includes("Lost At Sea")) return <Anchor className="w-4 h-4" />;
  if (title.includes("Neon")) return <Zap className="w-4 h-4" />;
  if (title.includes("Think Pink")) return <Heart className="w-4 h-4" />;
  if (title.includes("Virgin White") || title.includes("White")) return <Sparkles className="w-4 h-4" />;
  if (title.includes("Revival") || title.includes("Disco")) return <Disc className="w-4 h-4" />;
  if (title.includes("Atlantis Classics")) return <Music2 className="w-4 h-4" />;
  if (title.includes("Off-White")) return <Palette className="w-4 h-4" />;
  if (title.includes("Last Dance")) return <Music className="w-4 h-4" />;
  if (title.includes("Welcome") || title.includes("Sail-Away")) return <PartyPopper className="w-4 h-4" />;
  if (title.toLowerCase().includes("bingo")) return <img src="https://img.freepik.com/premium-vector/bingo-pop-art-cartoon-comic-background-design-template_393879-5344.jpg" alt="Bingo" className="w-4 h-4 rounded object-cover" />;
  return <PartyPopper className="w-4 h-4" />;
}

interface AddToCalendarButtonProps {
  event: DailyEvent;
  eventDate: string;
}

function AddToCalendarButton({ event, eventDate }: AddToCalendarButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAddToCalendar = (type: 'google' | 'apple' | 'ics') => {
    try {
      const eventData = createCalendarEvent(event, eventDate);

      switch (type) {
        case 'google':
          addToGoogleCalendar(eventData);
          break;
        case 'apple':
          addToAppleCalendar(eventData);
          break;
        case 'ics':
          downloadICS(eventData);
          break;
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Error adding to calendar:', error);
    }
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-8 h-8 p-0 rounded-full border-ocean-300 text-ocean-700 hover:bg-ocean-50 flex items-center justify-center"
        title="Add to Calendar"
      >
        <Plus className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <div className="absolute bottom-full right-0 mb-1 bg-gray-100 border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
          <button
            onClick={() => handleAddToCalendar('google')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg flex items-center"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
          </button>
          <button
            onClick={() => handleAddToCalendar('apple')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Calendar
          </button>
          <button
            onClick={() => handleAddToCalendar('ics')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-b-lg flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ICS
          </button>
        </div>
      )}
    </div>
  );
}

interface TimelineListProps {
  events: DailyEvent[];
  onTalentClick: (name: string) => void;
  onPartyClick?: (party: any) => void;
  eventDate?: string;
  TALENT: any[];
  PARTY_THEMES?: any[];
}



function TimelineList({ events, onTalentClick, onPartyClick, eventDate, TALENT, PARTY_THEMES = [] }: TimelineListProps) {
  const { timeFormat } = useTimeFormat();
  // Events are already sorted by the parent component with 6am rule applied
  const sortedEvents = events;

  return (
    <div className="space-y-3">
      {sortedEvents.map((event, idx) => {
        const clickableNames = findTalentInTitle(event.title, TALENT);

        const titleElement = clickableNames.length > 0 ? (
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
        ) : (
          event.title
        );

        const getEventColor = (type: string) => {
          switch (type) {
            case 'party':
            case 'club': return 'from-coral to-pink-500';
            case 'show': return 'from-gold to-yellow-500';
            case 'dining': return 'from-purple-500 to-purple-600';
            case 'lounge': return 'from-ocean-500 to-ocean-600';
            case 'fun': return 'from-green-500 to-green-600';
            case 'after': return 'from-purple-600 to-purple-700';
            default: return 'from-gray-500 to-gray-600';
          }
        };

        const getEventGradient = (type: string) => {
          switch (type) {
            case 'party':
            case 'club': return 'bg-gradient-to-r from-white to-coral/20 border-coral/30';
            case 'show': return 'bg-gradient-to-r from-white to-gold/20 border-gold/30';
            case 'dining': return 'bg-gradient-to-r from-white to-purple-200/60 border-purple-300/40';
            case 'lounge': return 'bg-gradient-to-r from-white to-ocean-200/60 border-ocean-300/40';
            case 'fun': return 'bg-gradient-to-r from-white to-green-200/60 border-green-300/40';
            case 'after': return 'bg-gradient-to-r from-white to-purple-200/40 border-purple-300/30';
            default: return 'bg-gradient-to-r from-white to-gray-100 border-gray-200';
          }
        };

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
                if (clickableNames.length > 0) {
                  // If there are talent names, click the first one
                  onTalentClick(clickableNames[0]);
                } else if ((event.type === 'party' || event.type === 'club' || event.type === 'after') && onPartyClick) {
                  // If it's a party event, open party modal
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
}

// Rest of the component continues with the same structure but cruise → trip transformations...
// (Continuing with the large component structure but with cruise/cruise terminology changed to trip/trip)

interface TripGuideProps {
  slug?: string;
}

export default function TripGuide({ slug }: TripGuideProps) {
  const { timeFormat } = useTimeFormat();
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedItineraryStop, setSelectedItineraryStop] = useState<any>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [cameFromEventsModal, setCameFromEventsModal] = useState(false);
  const [collapsedDays, setCollapsedDays] = useLocalStorage<string[]>('collapsedDays', []);

  // Use the trip data hook
  const { data: tripData, isLoading, error } = useTripData(slug);

  const data = useMemo(() => {
    if (!tripData) return null;
    return transformTripData(tripData);
  }, [tripData]);

  // Robust scroll to top when component content is ready
  useEffect(() => {
    if (data && !isLoading) {
      const forceScrollToTop = () => {
        // Multiple scroll methods for maximum compatibility
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also try with options
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      };

      // Immediate scroll
      forceScrollToTop();

      // Store timeout IDs for cleanup
      const timeouts: number[] = [];

      // Use requestAnimationFrame for next paint cycle
      const rafId = requestAnimationFrame(() => {
        forceScrollToTop();

        // Additional attempts to ensure it works
        timeouts.push(window.setTimeout(forceScrollToTop, 1));
        timeouts.push(window.setTimeout(forceScrollToTop, 10));
        timeouts.push(window.setTimeout(forceScrollToTop, 50));
        timeouts.push(window.setTimeout(forceScrollToTop, 100));
        timeouts.push(window.setTimeout(forceScrollToTop, 300));
        timeouts.push(window.setTimeout(forceScrollToTop, 500));
      });

      // Cleanup function to cancel pending timeouts
      return () => {
        cancelAnimationFrame(rafId);
        timeouts.forEach(id => clearTimeout(id));
      };
    }
  }, [data, isLoading, slug]);

  const ITINERARY = data?.ITINERARY || [];
  const DAILY = data?.DAILY || [];

  // Show party themes, talent, and important info for cruises that have talent
  const isGreekCruise = slug === 'greek-isles-2025';
  const isDragStarsCruise = slug === 'drag-stars-at-sea-2025';
  const hasTalent = isGreekCruise || isDragStarsCruise;
  const TALENT = hasTalent ? (data?.TALENT || []) : [];
  const PARTY_THEMES = hasTalent ? (data?.PARTY_THEMES || []) : [];
  const CITY_ATTRACTIONS = data?.CITY_ATTRACTIONS || [];
  const IMPORTANT_INFO = hasTalent ? (data?.IMPORTANT_INFO || {}) : {};
  const TRIP_INFO = data?.TRIP_INFO || {};

  // Utility function: Events before 6am belong to the previous day's schedule
  const getScheduleDate = (date: string, time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 6) {
      // Before 6am - belongs to previous day
      const currentDate = new Date(date);
      currentDate.setDate(currentDate.getDate() - 1);
      return currentDate.toISOString().split('T')[0];
    }
    return date;
  };

  // Filter events based on cruise status and timing
  const filterEventsByTiming = (events: any[], cruiseStatus: string) => {
    if (cruiseStatus !== 'current') {
      // For upcoming or past cruises, show all events
      return events;
    }

    // For current cruise, filter out past events
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return events.filter(event => {
      const eventDate = event.dateKey || event.key;

      // Future dates are always included
      if (eventDate > today) return true;

      // Past dates are excluded
      if (eventDate < today) return false;

      // For today, check the time
      if (eventDate === today) {
        const [eventHour, eventMinute] = event.time.split(':').map(Number);
        const eventTotalMinutes = eventHour * 60 + eventMinute;
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // Only show future events
        return eventTotalMinutes > currentTotalMinutes;
      }

      return true;
    });
  };

  // Apply 6am rule to reorganize events for both schedule and parties tabs
  const getScheduledDaily = () => {
    // Create a map to collect all events by their scheduled date (applying 6am rule)
    const eventsByScheduledDate: Record<string, any[]> = {};

    DAILY.forEach(day => {
      day.items.forEach(event => {
        const scheduledDate = getScheduleDate(day.key, event.time);
        if (!eventsByScheduledDate[scheduledDate]) {
          eventsByScheduledDate[scheduledDate] = [];
        }
        eventsByScheduledDate[scheduledDate].push({
          ...event,
          originalDate: day.key // Keep track of original date for reference
        });
      });
    });

    // Convert back to DAILY format, sorted by date
    return Object.keys(eventsByScheduledDate)
      .sort()
      .map(dateKey => ({
        key: dateKey,
        items: eventsByScheduledDate[dateKey].sort((a, b) => {
          // Custom sort to handle events that cross midnight
          const timeA = a.time;
          const timeB = b.time;
          const hourA = parseInt(timeA.split(':')[0]);
          const hourB = parseInt(timeB.split(':')[0]);

          // Convert time to minutes for proper chronological sorting
          const getMinutesFromMidnight = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            const adjustedHours = hours === 24 ? 0 : hours; // Handle 24:00 as 00:00

            // Events before 6am are "next day" events, so add 24 hours worth of minutes
            if (adjustedHours < 6) {
              return (adjustedHours + 24) * 60 + minutes;
            }
            return adjustedHours * 60 + minutes;
          };

          return getMinutesFromMidnight(timeA) - getMinutesFromMidnight(timeB);
        })
      }));
  };

  const getFilteredScheduledDaily = () => {
    const scheduledDaily = getScheduledDaily();
    const cruiseStatus = data?.trip?.status || 'upcoming';

    return scheduledDaily.map(day => ({
      ...day,
      items: filterEventsByTiming(day.items, cruiseStatus)
    })).filter(day => day.items.length > 0); // Remove days with no events after filtering
  };

  const SCHEDULED_DAILY = getFilteredScheduledDaily();

  // Rest of the component logic remains the same but with trip terminology
  const toggleDayCollapse = (dateKey: string) => {
    const newCollapsedDays = collapsedDays.includes(dateKey)
      ? collapsedDays.filter((d: string) => d !== dateKey)
      : [...collapsedDays, dateKey];
    setCollapsedDays(newCollapsedDays);
  };

  const handleTalentClick = (name: string) => {
    const talent = TALENT.find(t => t.name === name);
    if (talent) {
      setSelectedTalent({ ...talent, role: talent.knownFor });
      setShowTalentModal(true);
    }
  };

  const handleViewEvents = (dateKey: string, portName: string) => {
    // Find events for this date
    const dayEvents = SCHEDULED_DAILY.find(day => day.key === dateKey);
    setSelectedDateEvents(dayEvents?.items || []);
    setSelectedItineraryStop({ port: portName, date: dateKey });
    setShowEventsModal(true);
  };

  const handlePartyClick = (party: any) => {
    setSelectedParty(party);
    setShowPartyModal(true);
  };

  // Custom close handlers that return to events modal if needed
  const handleTalentModalClose = (open: boolean) => {
    setShowTalentModal(open);
    if (!open && cameFromEventsModal) {
      setShowEventsModal(true);
      setCameFromEventsModal(false);
    }
  };

  const handlePartyModalClose = (open: boolean) => {
    setShowPartyModal(open);
    if (!open && cameFromEventsModal) {
      setShowEventsModal(true);
      setCameFromEventsModal(false);
    }
  };

  // Group talent by category
  const talentByCategory = TALENT.reduce((acc, talent) => {
    const category = talent.cat || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(talent);
    return acc;
  }, {} as Record<string, typeof TALENT>);

  const sortedCategories = Object.keys(talentByCategory).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading trip guide...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
        <div className="text-center text-white">
          <Ship className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Unable to load trip guide</h2>
          <p className="text-lg mb-4">Please try refreshing the page</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gray-100/20 hover:bg-gray-100/30 text-white border border-white/20"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Filter daily events based on selected date 
  const filteredDaily = selectedDate 
    ? DAILY.filter(day => day.key === selectedDate)
    : DAILY;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      <UniversalHero
        variant="trip"
        tripImageUrl={tripData?.trip?.heroImageUrl}
        title={tripData?.trip?.name || "Trip Guide"}
        subtitle=""
        additionalInfo={tripData?.trip?.startDate && tripData?.trip?.endDate
          ? `${format(dateOnly(tripData.trip.startDate), 'MMMM d')} - ${format(dateOnly(tripData.trip.endDate), 'MMMM d, yyyy')}`
          : undefined
        }
        tabSection={
          <StandardizedTabContainer>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="itinerary" className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Itinerary</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="parties" className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4" />
                  <span className="hidden sm:inline">Parties</span>
                </TabsTrigger>
                <TabsTrigger value="talent" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Talent</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </StandardizedTabContainer>
        }
      />

      <StandardizedContentLayout>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Daily Schedule Tab */}
            <TabsContent value="schedule">
              <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
                <div className="flex items-center justify-between mb-4 -mt-2">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-white/80" />
                    <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Daily Schedule</h2>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        // If all are collapsed, expand all. Otherwise, collapse all
                        const allCollapsed = SCHEDULED_DAILY.length === collapsedDays.length;
                        setCollapsedDays(allCollapsed ? [] : SCHEDULED_DAILY.map(day => day.key));
                      }}
                      className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm"
                    >
                      {SCHEDULED_DAILY.length === collapsedDays.length ? (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          <span>Expand All</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          <span>Collapse All</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Daily Events */}
                <div className="space-y-6">
                  {SCHEDULED_DAILY.map((day, dayIndex) => {
                    const isCollapsed = collapsedDays.includes(day.key);
                    const itineraryStop = ITINERARY.find(stop => stop.key === day.key);
                    const isPastDate = isDateInPast(day.key);

                    return (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: dayIndex * 0.02 }}
                        className={`${isPastDate ? 'opacity-75' : ''}`}
                      >

                        <div className="bg-white/85 backdrop-blur-sm border border-white/30 rounded-md overflow-hidden hover:shadow-xl transition-all duration-300">
                          <div
                            className={`p-3 cursor-pointer transition-colors ${
                              isCollapsed ? 'hover:bg-white' : 'bg-ocean-50/50'
                            }`}
                            onClick={() => toggleDayCollapse(day.key)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full">
                                  {itineraryStop?.date || day.key}
                                </div>
                                {itineraryStop && (
                                  <div className="text-gray-600 text-sm">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {itineraryStop.port}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {day.items.length > 0 && (
                                  <span className="text-xs text-gray-500 hidden sm:inline">
                                    Departs: {globalFormatTime(day.items[day.items.length - 1].time, timeFormat)}
                                  </span>
                                )}
                                {isCollapsed ? (
                                  <ChevronDown className="w-5 h-5 text-ocean-600 hover:text-ocean-700 transition-colors" />
                                ) : (
                                  <ChevronUp className="w-5 h-5 text-ocean-600 hover:text-ocean-700 transition-colors" />
                                )}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-ocean-100/30"
                              >
                                <div className="px-4 pt-2 pb-3 bg-ocean-50/50">
                                  {day.items.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                      No scheduled events for this day
                                    </p>
                                  ) : (
                                    <TimelineList
                                      events={day.items}
                                      onTalentClick={handleTalentClick}
                                      onPartyClick={handlePartyClick}
                                      eventDate={itineraryStop?.date}
                                      TALENT={TALENT}
                                      PARTY_THEMES={PARTY_THEMES}
                                    />
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {DAILY.length === 0 && (
                  <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-500">No events are currently scheduled.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary">
              <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-2 -mt-2">
                  <Map className="w-5 h-5 text-white/80" />
                  <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Itinerary</h2>
                </div>
                {ITINERARY.length === 0 ? (
                  <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
                    <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary available</h3>
                    <p className="text-gray-500">Itinerary information will be available soon.</p>
                  </div>
                ) : (
                  <div>
                    {ITINERARY.map((stop, index) => (
                      <motion.div
                        key={stop.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.02 }}
                        className="mb-6"
                      >

                        <div
                          className="bg-gray-100 border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                          onClick={() => handleViewEvents(stop.key, stop.port)}
                        >
                          {/* View Events Button - positioned in top right corner */}
                          <div className="absolute top-3 right-3 z-10">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent double-click from card
                                handleViewEvents(stop.key, stop.port);
                              }}
                              className="bg-ocean-600 hover:bg-ocean-700 text-white text-xs px-4 py-2"
                            >
                              View Events
                            </Button>
                          </div>

                          <div className="flex flex-col lg:flex-row">
                            {/* Hero Image */}
                            <div className="w-full h-48 lg:w-48 lg:h-32 flex-shrink-0 overflow-hidden">
                              <img
                                src={stop.imageUrl || (() => {
                                  if (stop.port?.includes('Santorini')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/santorini-greece.jpg';
                                  if (stop.port?.includes('Athens')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/athens-greece.jpg';
                                  if (stop.port?.includes('Mykonos')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/mykonos-greece.jpg';
                                  if (stop.port?.includes('Istanbul')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/istanbul-turkey.jpg';
                                  if (stop.port?.includes('Kuşadası')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/kusadasi-turkey.jpg';
                                  if (stop.port?.includes('Alexandria') || stop.port?.includes('Cairo')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/alexandria-cairo-egypt.jpg';
                                  if (stop.port?.includes('Iraklion') || stop.port?.includes('Crete')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/location-images/iraklion-crete.jpg';
                                  if (stop.port?.includes('Day at Sea')) return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/day-at-sea.jpg';
                                  return 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                                })()}
                                alt={stop.port}
                                className="w-full h-full object-cover"
                                style={{ objectFit: 'cover' }}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                                }}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-3 lg:p-4">
                              <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 mb-3">
                                <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full self-start">
                                  <span className="lg:hidden">
                                    {dateOnly((stop as any).rawDate).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className="hidden lg:inline">
                                    {dateOnly((stop as any).rawDate).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center min-w-0">
                                  <MapPin className="w-4 h-4 text-gray-600 mr-1 flex-shrink-0" />
                                  <span className="text-base font-bold text-gray-900 break-words">{stop.port}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 text-sm mb-3">
                                {/* Arrive and Depart times grouped together */}
                                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                                  {stop.arrive !== '—' && (
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <span className="font-medium text-gray-700 whitespace-nowrap">Arrive:</span>
                                      <span className="font-bold text-gray-800 break-words">
                                        {stop.arrive}
                                      </span>
                                    </div>
                                  )}
                                  {stop.depart !== '—' && (
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <span className="font-medium text-gray-700 whitespace-nowrap">Depart:</span>
                                      <span className="font-bold text-gray-800 break-words">
                                        {stop.depart}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* All Aboard time always on separate line below */}
                                {stop.allAboard && stop.allAboard !== '—' && (
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <span className="font-bold text-gray-700 whitespace-nowrap">All Aboard:</span>
                                    <span className="bg-gradient-to-r from-coral to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                                      {stop.allAboard}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Talent Tab */}
            <TabsContent value="talent">
              <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-2 -mt-2">
                  <Star className="w-5 h-5 text-white/80" />
                  <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Featured Talent</h2>
                </div>

                {/* Talent by Category */}
                {Object.keys(talentByCategory).length > 0 ? (
                  <div className="space-y-8">
                    {sortedCategories.map((category) => (
                      <div key={category} className="bg-white/85 backdrop-blur-sm rounded-md p-3 sm:p-6 shadow-lg border border-white/30">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                          <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full self-start">
                            {category}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {talentByCategory[category].map((talent, index) => (
                            <motion.div
                              key={talent.name}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: index * 0.02 }}
                              className="mb-4"
                            >

                              <Card
                                className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-gray-100 border border-gray-200 overflow-hidden"
                                onClick={() => handleTalentClick(talent.name)}
                              >
                                <div className="flex flex-row">
                                  <div className="w-32 h-32 flex-shrink-0">
                                    <img
                                      src={talent.img}
                                      alt={talent.name}
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 break-words">{talent.name}</h3>
                                        <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                                          <span className="break-words">{(talent as any).role || talent.knownFor}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 break-words leading-relaxed">{talent.bio}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {TALENT.length === 0 && (
                  <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No talent found</h3>
                    <p className="text-gray-500">Talent information will be available soon.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Parties Tab */}
            <TabsContent value="parties">
              <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-2 -mt-2">
                  <PartyPopper className="w-5 h-5 text-white/80" />
                  <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Party Events</h2>
                </div>

                {(() => {
                  // Get all party events from scheduled daily (with 6am rule applied)
                  const partyEvents = SCHEDULED_DAILY.flatMap(day =>
                    day.items.filter(event =>
                      event.type === 'party' || event.type === 'after' || event.type === 'club'
                    ).map(event => ({
                      ...event,
                      dateKey: day.key
                    }))
                  ).sort((a, b) => {
                    // Sort by date first, then by time
                    const dateCompare = a.dateKey.localeCompare(b.dateKey);
                    if (dateCompare !== 0) return dateCompare;
                    return a.time.localeCompare(b.time);
                  });

                  // Group by date
                  const partiesByDate = partyEvents.reduce((acc, event) => {
                    if (!acc[event.dateKey]) {
                      acc[event.dateKey] = [];
                    }
                    acc[event.dateKey].push(event);
                    return acc;
                  }, {} as Record<string, typeof partyEvents>);

                  const partyDates = Object.keys(partiesByDate).sort();

                  return partyDates.length === 0 ? (
                    <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
                      <PartyPopper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No party events available</h3>
                      <p className="text-gray-500">Party information will be available soon.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {partyDates.map((dateKey) => {
                        const dayParties = partiesByDate[dateKey];
                        const date = dateOnly(dateKey + 'T00:00:00.000Z');
                        const formattedDate = date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        });
                        const itineraryStop = ITINERARY.find(stop => stop.key === dateKey);

                        return (
                          <div key={dateKey} className="bg-white/85 backdrop-blur-sm rounded-md p-3 sm:p-6 shadow-lg border border-white/30">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                              <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full self-start">
                                <span className="sm:hidden">
                                  {date.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className="hidden sm:inline">
                                  {formattedDate}
                                </span>
                              </div>
                              {itineraryStop && (
                                <div className="text-gray-600 text-sm">
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  {itineraryStop.port}
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              {dayParties.map((party, index) => (
                                <div key={`${party.title}-${party.time}`} className="bg-white/90 rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200">
                                  <div className="flex flex-col lg:flex-row">
                                    {/* Hero Image */}
                                    <div className="w-full h-48 lg:w-48 lg:h-32 flex-shrink-0 overflow-hidden">
                                      <img
                                        src={party.imageUrl || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'}
                                        alt={party.title}
                                        className="w-full h-full object-cover"
                                        style={{ objectFit: 'cover' }}
                                        loading="lazy"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
                                        }}
                                      />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 lg:p-4">
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                                          <h4 className="text-lg font-bold text-gray-900 break-words flex items-center gap-2">
                                            <PartyPopper className="w-5 h-5 text-ocean-600 flex-shrink-0" />
                                            {party.title}
                                          </h4>
                                          <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                                            {globalFormatTime(party.time, timeFormat)}
                                          </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 self-start sm:self-center">
                                          <span className="break-words">{party.venue}</span>
                                        </Badge>
                                      </div>
                                      {party.description && (
                                        <p className="text-sm text-gray-700 leading-relaxed mb-2 break-words">
                                          <span className="font-medium">{party.description.split('.')[0]}.</span>
                                          {party.description.split('.').slice(1).join('.') &&
                                            <span>{party.description.split('.').slice(1).join('.')}</span>
                                          }
                                        </p>
                                      )}

                                      {/* Party Theme Details */}
                                      {party.partyTheme && (
                                        <div className="mt-3 space-y-2 border-t pt-3">
                                          {(party.partyTheme.longDescription || party.partyTheme.long_description || party.partyTheme.description) && (
                                            <p className="text-xs text-gray-600 italic">
                                              {party.partyTheme.longDescription || party.partyTheme.long_description || party.partyTheme.description}
                                            </p>
                                          )}

                                          {(party.partyTheme.costumeIdeas || party.partyTheme.costume_ideas) && (
                                            <div>
                                              <p className="text-xs font-medium text-gray-700 mb-1">💡 Costume Ideas:</p>
                                              <p className="text-xs text-gray-600">
                                                {party.partyTheme.costumeIdeas || party.partyTheme.costume_ideas}
                                              </p>
                                            </div>
                                          )}

                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </TabsContent>

            {/* Important Info Tab */}
            <TabsContent value="info">
              <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-2 -mt-2">
                  <Info className="w-5 h-5 text-white/80" />
                  <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Important Trip Information</h2>
                </div>
                  
                {/* Check-In Information */}
                {(IMPORTANT_INFO as any).checkIn && (
                  <div className="bg-gray-100 rounded-md p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CalendarDays className="w-5 h-5 mr-2 text-ocean-600" />
                      Check-In Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Location:</span> {(IMPORTANT_INFO as any).checkIn.location}</p>
                      <p><span className="font-medium">Address:</span> {(IMPORTANT_INFO as any).checkIn.address}</p>
                      <p><span className="font-medium">Time:</span> {(IMPORTANT_INFO as any).checkIn.time}</p>
                      <div>
                        <span className="font-medium">Required Documents:</span>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {(IMPORTANT_INFO as any).checkIn.documents.map((doc: any, index: number) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Departure Information */}
                {(IMPORTANT_INFO as any).departure && (
                  <div className="bg-gray-100 rounded-md p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Ship className="w-5 h-5 mr-2 text-ocean-600" />
                      Departure Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Sail Away:</span> {(IMPORTANT_INFO as any).departure.sailAway}</p>
                      <p><span className="font-medium">All Aboard:</span> {(IMPORTANT_INFO as any).departure.allAboard}</p>
                    </div>
                  </div>
                )}

                {/* First Day Tips */}
                {(IMPORTANT_INFO as any).firstDayTips && (
                  <div className="bg-gray-100 rounded-md p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-ocean-600" />
                      First Day Tips
                    </h3>
                    <div className="bg-gray-100 rounded-md p-4">
                      <ul className="space-y-2">
                        {(IMPORTANT_INFO as any).firstDayTips.map((tip: any, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-ocean-100 text-ocean-700 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Entertainment Info */}
                {(IMPORTANT_INFO as any).entertainment && (
                  <div className="bg-gray-100 rounded-md p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-ocean-600" />
                      Entertainment Booking
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Booking Start:</span> {(IMPORTANT_INFO as any).entertainment.bookingStart}</p>
                      <p><span className="font-medium">Walk-ins:</span> {(IMPORTANT_INFO as any).entertainment.walkIns}</p>
                      <p><span className="font-medium">Standby Release:</span> {(IMPORTANT_INFO as any).entertainment.standbyRelease}</p>
                      <p><span className="font-medium">Rockstar Suites:</span> {(IMPORTANT_INFO as any).entertainment.rockstarSuites}</p>
                    </div>
                  </div>
                )}

                {/* Dining Info */}
                {(IMPORTANT_INFO as any).dining && (
                  <div className="bg-gray-100 rounded-md p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UtensilsCrossed className="w-5 h-5 mr-2 text-ocean-600" />
                      Dining Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Reservations:</span> {(IMPORTANT_INFO as any).dining.reservations}</p>
                      <p><span className="font-medium">Walk-ins:</span> {(IMPORTANT_INFO as any).dining.walkIns}</p>
                      <p><span className="font-medium">Included:</span> {(IMPORTANT_INFO as any).dining.included}</p>
                    </div>
                  </div>
                )}

                {/* Info tab placeholder when no data */}
                {Object.keys(IMPORTANT_INFO).length === 0 && (
                  <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
                    <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No information available</h3>
                    <p className="text-gray-500">Trip information will be available soon.</p>
                  </div>
                )}
              </div>
            </TabsContent>

        </Tabs>
      </StandardizedContentLayout>

      {/* Talent Modal */}
      <Dialog open={showTalentModal} onOpenChange={handleTalentModalClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedTalent?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Biography and information for {selectedTalent?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTalent && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={selectedTalent.img}
                    alt={selectedTalent.name}
                    className="w-32 h-32 rounded-md object-cover mx-auto lg:mx-0"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 text-center lg:text-left min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 break-words">{selectedTalent.name}</h2>
                  <Badge variant="secondary" className="mb-2">{selectedTalent.cat}</Badge>
                  <p className="text-ocean-600 font-medium mb-2 break-words">{(selectedTalent as any).role || selectedTalent.knownFor}</p>
                  <p className="text-gray-700 leading-relaxed break-words">{selectedTalent.bio}</p>
                </div>
              </div>

              {/* Performance Schedule */}
              {(() => {
                // Find all performances for this talent
                const allTalentPerformances = SCHEDULED_DAILY.flatMap(day =>
                  day.items
                    .filter(event =>
                      findTalentInTitle(event.title, TALENT).includes(selectedTalent.name) ||
                      (event.talent && event.talent.some((t: any) => t.name === selectedTalent.name))
                    )
                    .map(event => ({
                      ...event,
                      dateKey: day.key,
                      date: ITINERARY.find(stop => stop.key === day.key)?.date || day.key
                    }))
                ).sort((a, b) => {
                  const dateCompare = a.dateKey.localeCompare(b.dateKey);
                  if (dateCompare !== 0) return dateCompare;
                  return a.time.localeCompare(b.time);
                });

                // Apply timing filter for talent performances
                const cruiseStatus = data?.trip?.status || 'upcoming';
                const talentPerformances = filterEventsByTiming(allTalentPerformances, cruiseStatus);

                return talentPerformances.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Music className="w-4 h-4 mr-2" />
                      Performance Schedule
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {talentPerformances.map((performance, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2 px-2 bg-gray-50 rounded">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-900 break-words">{performance.title}</span>
                            <span className="text-xs text-gray-500 ml-2 break-words">({performance.venue})</span>
                          </div>
                          <div className="text-sm text-ocean-600 font-medium whitespace-nowrap">
                            {performance.date} • {globalFormatTime(performance.time, timeFormat)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedTalent.social && Object.keys(selectedTalent.social).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Social Links & Website
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTalent.social.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedTalent.social.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </a>
                      </Button>
                    )}
                    {selectedTalent.social.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedTalent.social.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-4 h-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {selectedTalent.social.youtube && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedTalent.social.youtube} target="_blank" rel="noopener noreferrer">
                          <Youtube className="w-4 h-4 mr-2" />
                          YouTube
                        </a>
                      </Button>
                    )}
                    {selectedTalent.social.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedTalent.social.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {selectedTalent.social.linktree && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedTalent.social.linktree} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Linktree
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Events Modal */}
      <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Events for {selectedItineraryStop?.port}
            </DialogTitle>
            <DialogDescription>
              View scheduled events and activities for this port
            </DialogDescription>
          </DialogHeader>

          {/* Port Description */}
          {selectedItineraryStop && (() => {
            const itineraryStop = ITINERARY.find(stop => stop.key === selectedItineraryStop.date);
            return itineraryStop?.description && (
              <div className="border-b pb-4 mb-4">
                <p className="text-gray-700 text-sm leading-relaxed">{itineraryStop.description}</p>
              </div>
            );
          })()}

          <div className="space-y-4">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event, index) => {
                const clickableNames = findTalentInTitle(event.title, TALENT);
                const isPartyEvent = event.type === 'party' || event.type === 'club' || event.type === 'after';
                const isClickable = clickableNames.length > 0 || isPartyEvent;

                return (
                  <div
                    key={index}
                    className={`border-l-4 border-ocean-500 pl-4 py-2 rounded-r-lg transition-all duration-200 ${
                      isClickable
                        ? 'cursor-pointer hover:bg-ocean-50 hover:shadow-md'
                        : ''
                    }`}
                    onClick={() => {
                      if (clickableNames.length > 0) {
                        // If there are talent names, click the first one
                        setCameFromEventsModal(true);
                        handleTalentClick(clickableNames[0]);
                        setShowEventsModal(false); // Close events modal
                      } else if (isPartyEvent) {
                        // If it's a party event, open party modal
                        setCameFromEventsModal(true);
                        handlePartyClick(event);
                        setShowEventsModal(false); // Close events modal
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${isClickable ? 'text-ocean-700 hover:text-ocean-800' : 'text-gray-900'}`}>
                        {event.title}
                        {isClickable && <span className="ml-1 text-xs text-ocean-500">→</span>}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ocean-600 font-medium">
                          {globalFormatTime(event.time, timeFormat)}
                        </span>
                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                          {event.venue}
                        </Badge>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600">{event.description}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-gray-500">
                No scheduled events for this day
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Party Modal */}
      <Dialog open={showPartyModal} onOpenChange={handlePartyModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedParty?.title}
            </DialogTitle>
            <DialogDescription>
              Party details and information
            </DialogDescription>
          </DialogHeader>

          {selectedParty && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {selectedParty.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={selectedParty.imageUrl}
                      alt={selectedParty.title}
                      className="w-32 h-32 rounded-md object-cover mx-auto lg:mx-0"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 text-center lg:text-left space-y-2 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                      <span className="break-words">{selectedParty.venue}</span>
                    </Badge>
                    <span className="text-ocean-600 font-medium break-words">
                      {selectedParty.time && globalFormatTime(selectedParty.time, timeFormat)}
                    </span>
                  </div>
                  {selectedParty.description && (
                    <p className="text-gray-700 leading-relaxed break-words">{selectedParty.description}</p>
                  )}
                  {selectedParty.dressCode && (
                    <div>
                      <span className="font-medium text-gray-900">Dress Code: </span>
                      <span className="text-gray-700 break-words">{selectedParty.dressCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="atlantis-gradient wave-pattern text-white py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png"
              alt="Atlantis Events"
              className="h-8 w-auto mr-3 brightness-0 invert"
              loading="lazy"
            />
            <div className="text-left">
              <p className="text-sm text-white/80">All-Gay Vacations Since 1991</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Your ultimate resource for cruise information and planning
          </p>
        </div>
      </footer>
    </div>
  );
}