import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { dateOnly } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const tripDate = new Date(year, month - 1, day, 0, 0, 0, 0);

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
  const month = monthMap[monthStr] ?? 8; // Default to September for current trip
  const day = parseInt(dayStr, 10);

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
        <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
          <button
            onClick={() => handleAddToCalendar('google')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg flex items-center"
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
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Calendar
          </button>
          <button
            onClick={() => handleAddToCalendar('ics')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg flex items-center"
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
  eventDate?: string;
  TALENT: any[];
  PARTY_THEMES?: any[];
}



function TimelineList({ events, onTalentClick, eventDate, TALENT, PARTY_THEMES = [] }: TimelineListProps) {
  const { timeFormat } = useTimeFormat();
  const sortedEvents = events.sort((a, b) => {
    // Special case: if this is Thursday and we have Neon Playground, put it last
    if (eventDate?.includes("Aug 28")) {
      if (a.title === "Neon Playground") return 1;
      if (b.title === "Neon Playground") return -1;
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  return (
    <div className="relative border-l border-ocean-300/40 ml-2">
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
            case 'party': return 'from-coral to-pink-500';
            case 'show': return 'from-gold to-yellow-500';
            case 'dining': return 'from-purple-500 to-purple-600';
            case 'lounge': return 'from-ocean-500 to-ocean-600';
            case 'fun': return 'from-green-500 to-green-600';
            case 'club': return 'from-indigo-500 to-indigo-600';
            case 'after': return 'from-purple-600 to-purple-700';
            default: return 'from-gray-500 to-gray-600';
          }
        };

        const getEventGradient = (type: string) => {
          switch (type) {
            case 'party': return 'bg-gradient-to-r from-white to-coral/20 border-coral/30';
            case 'show': return 'bg-gradient-to-r from-white to-gold/20 border-gold/30';
            case 'dining': return 'bg-gradient-to-r from-white to-purple-200/60 border-purple-300/40';
            case 'lounge': return 'bg-gradient-to-r from-white to-ocean-200/60 border-ocean-300/40';
            case 'fun': return 'bg-gradient-to-r from-white to-green-200/60 border-green-300/40';
            case 'club': return 'bg-gradient-to-r from-white to-indigo-200/60 border-indigo-300/40';
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
            className="mb-3 ml-4 relative"
          >
            <motion.span 
              className="absolute -left-5 top-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center z-10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (idx * 0.02) + 0.1 }}
            >
              <span className={`h-3 w-3 rounded-full bg-gradient-to-br ${getEventColor(event.type)} shadow-md border border-white`} />
            </motion.span>
            <Card className="p-4 bg-white hover:shadow-lg transition-all duration-300 border-2 border-gray-200 min-h-24 relative">
              <div className="flex items-center gap-3 w-full pr-10">
                {/* Artist Thumbnail, Party Thumbnail, Bingo Thumbnail, or KGay Logo */}
                {(clickableNames.length > 0 || event.title.includes("KGay Travel") || event.type === 'party' || event.type === 'after' || event.title.toLowerCase().includes("bingo")) && (
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
                          />
                        ) : null;
                      }).filter(Boolean)[0]
                    ) : event.title.toLowerCase().includes("bingo") ? (
                      <img
                        src="https://img.freepik.com/premium-vector/bingo-pop-art-cartoon-comic-background-design-template_393879-5344.jpg"
                        alt="Bingo"
                        className="w-12 h-12 rounded-full object-cover border-2 border-ocean-200 shadow-md"
                      />
                    ) : (event.type === 'party' || event.type === 'after') ? (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-ocean-200 bg-gradient-to-br from-coral to-pink-500 shadow-md">
                        {React.cloneElement(getPartyIcon(event.title), { className: "w-6 h-6 text-white" })}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-ocean-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{globalFormatTime(event.time, timeFormat)}</span>
                      {event.type === 'party' && (
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

                {/* Add to Calendar Button */}
                {eventDate && (
                  <div className="absolute top-2 right-2">
                    <AddToCalendarButton event={event} eventDate={eventDate} />
                  </div>
                )}
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
  const [collapsedDays, setCollapsedDays] = useLocalStorage<string[]>('collapsedDays', []);

  // Use the trip data hook
  const { data: tripData, isLoading, error } = useTripData(slug);

  const data = useMemo(() => {
    if (!tripData) return null;
    return transformTripData(tripData);
  }, [tripData]);

  const ITINERARY = data?.ITINERARY || [];
  const DAILY = data?.DAILY || [];
  const TALENT = data?.TALENT || [];
  
  // Only show party themes and important info for Greek cruise
  const isGreekCruise = slug === 'greek-isles-2025';
  const PARTY_THEMES = isGreekCruise ? (data?.PARTY_THEMES || []) : [];
  const CITY_ATTRACTIONS = data?.CITY_ATTRACTIONS || [];
  const IMPORTANT_INFO = isGreekCruise ? (data?.IMPORTANT_INFO || {}) : {};
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

  // Create mapping of party themes to their scheduled dates and times
  const partyScheduleMap: Record<string, { date: string; time: string; dateTime: string; venue: string; scheduleDate: string }> = {};
  DAILY.forEach(day => {
    day.items.forEach(item => {
      if (item.type === 'party' || item.type === 'after') {
        const theme = PARTY_THEMES.find(p => item.title.includes(p.key));
        if (theme) {
          const scheduleDate = getScheduleDate(day.key, item.time);
          const dateTime = `${scheduleDate}T${item.time.padStart(5, '0')}`;
          partyScheduleMap[theme.key] = { 
            date: day.key, 
            time: item.time, 
            dateTime, 
            venue: item.venue, 
            scheduleDate 
          };
        }
      }
    });
  });

  // Group parties by schedule date (respecting 6am rule)
  const partiesByDate = PARTY_THEMES
    .filter(theme => partyScheduleMap[theme.key]) // Only show parties that are scheduled
    .reduce((acc, theme) => {
      const schedule = partyScheduleMap[theme.key];
      const groupDate = schedule.scheduleDate;
      if (!acc[groupDate]) {
        acc[groupDate] = [];
      }
      acc[groupDate].push({ theme, schedule });
      return acc;
    }, {} as Record<string, { theme: typeof PARTY_THEMES[0]; schedule: { date: string; time: string; dateTime: string; venue: string; scheduleDate: string } }[]>);

  // Sort dates and parties within each date
  const sortedPartyDates = Object.keys(partiesByDate).sort();
  Object.values(partiesByDate).forEach(dayParties => {
    dayParties.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  });

  // Rest of the component logic remains the same but with trip terminology
  const toggleDayCollapse = (dateKey: string) => {
    setCollapsedDays(prev => 
      prev.includes(dateKey) 
        ? prev.filter(d => d !== dateKey)
        : [...prev, dateKey]
    );
  };

  const handleTalentClick = (name: string) => {
    const talent = TALENT.find(t => t.name === name);
    if (talent) {
      setSelectedTalent({ ...talent, role: talent.knownFor });
      setShowTalentModal(true);
    }
  };

  const filteredTalent = TALENT.filter(talent =>
    talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    talent.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    talent.knownFor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group talent by category
  const talentByCategory = filteredTalent.reduce((acc, talent) => {
    const category = talent.cat || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(talent);
    return acc;
  }, {} as Record<string, typeof filteredTalent>);

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
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
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
      {/* Header with Hero Image Background */}
      <header className="relative overflow-hidden text-white fixed top-0 left-0 right-0 z-40 pt-[15px] pb-[24px]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10"></div>
          {tripData?.trip?.heroImageUrl ? (
            <img 
              src={tripData.trip.heroImageUrl} 
              alt={tripData.trip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src="/images/ships/resilient-lady-hero.jpg" 
              alt="Trip Ship"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-1">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              {tripData?.trip?.name || "Trip Guide"}
            </h1>
            <p className="text-white/80 text-base">
              {tripData?.trip?.shipName && tripData?.trip?.cruiseLine 
                ? `Aboard ${tripData.trip.shipName} • ${tripData.trip.cruiseLine}`
                : "Your Adventure Awaits"
              }
            </p>
            {tripData?.trip?.startDate && tripData?.trip?.endDate && (
              <div className="flex items-center justify-center gap-4 mt-2">
                <p className="text-white/60 text-xs">
                  {format(new Date(tripData.trip.startDate), 'MMMM d')} - {format(new Date(tripData.trip.endDate), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="itinerary" className="flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Itinerary</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="hidden sm:inline">Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger value="talent" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="hidden sm:inline">Talent</span>
                  </TabsTrigger>
                  <TabsTrigger value="parties" className="flex items-center gap-2">
                    <PartyPopper className="w-4 h-4" />
                    <span className="hidden sm:inline">Parties</span>
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Info</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </Tabs>
        </div>
      </header>

      <div className="bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 pt-[24px] pb-[2px]">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Daily Schedule Tab */}
            <TabsContent value="schedule" className="min-h-screen">
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Date Filter */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-5 h-5 text-ocean-600" />
                      <span className="font-medium text-gray-900">Filter by Date:</span>
                    </div>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                    >
                      <option value="">All Days</option>
                      {ITINERARY.map((stop) => (
                        <option key={stop.key} value={stop.key}>
                          {stop.date} - {stop.port}
                        </option>
                      ))}
                    </select>
                    {selectedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate("")}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>

                {/* Daily Events */}
                <AnimatePresence>
                  {filteredDaily.map((day, dayIndex) => {
                    const isCollapsed = collapsedDays.includes(day.key);
                    const itineraryStop = ITINERARY.find(stop => stop.key === day.key);
                    const isPastDate = isDateInPast(day.key);
                    
                    return (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden ${isPastDate ? 'opacity-75' : ''}`}
                      >
                        <div 
                          className={`p-4 cursor-pointer transition-colors ${
                            isCollapsed ? 'hover:bg-gray-50' : 'hover:bg-ocean-50'
                          }`}
                          onClick={() => toggleDayCollapse(day.key)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isPastDate && (
                                <span className="text-gray-400 text-sm">Past</span>
                              )}
                              <h3 className="text-lg font-bold text-gray-900">
                                {itineraryStop?.date || day.key}
                              </h3>
                              {itineraryStop && (
                                <Badge variant="outline" className="text-ocean-700 border-ocean-300">
                                  {itineraryStop.port}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="bg-gray-100">
                                {day.items.length} events
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {day.items.length > 0 && (
                                <span className="text-sm text-gray-500">
                                  {globalFormatTime(day.items[0].time, timeFormat)} - {globalFormatTime(day.items[day.items.length - 1].time, timeFormat)}
                                </span>
                              )}
                              {isCollapsed ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
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
                              className="border-t border-gray-100"
                            >
                              <div className="p-4">
                                {day.items.length === 0 ? (
                                  <p className="text-gray-500 text-center py-8">
                                    No scheduled events for this day
                                  </p>
                                ) : (
                                  <TimelineList 
                                    events={day.items} 
                                    onTalentClick={handleTalentClick}
                                    eventDate={itineraryStop?.date}
                                    TALENT={TALENT}
                                    PARTY_THEMES={PARTY_THEMES}
                                  />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredDaily.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-500">
                      {selectedDate ? 'No events scheduled for the selected date.' : 'No events are currently scheduled.'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="min-h-screen">
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                {ITINERARY.length === 0 ? (
                  <div className="text-center py-12">
                    <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary available</h3>
                    <p className="text-gray-500">Itinerary information will be available soon.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ITINERARY.map((stop, index) => (
                      <div key={stop.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex">
                          {/* Hero Image */}
                          <div className="w-48 h-32 flex-shrink-0">
                            <img 
                              src={(() => {
                                if (stop.port.includes('Santorini')) return '/images/ports/santorini-greece.jpg';
                                if (stop.port.includes('Athens')) return '/images/ports/athens-greece.jpg';
                                if (stop.port.includes('Mykonos')) return '/images/ports/mykonos-greece.jpg';
                                if (stop.port.includes('Istanbul')) return '/images/ports/istanbul-turkey.jpg';
                                if (stop.port.includes('Kuşadası')) return '/images/ports/kusadasi-turkey.jpg';
                                if (stop.port.includes('Alexandria') || stop.port.includes('Cairo')) return '/images/ports/alexandria-cairo-egypt.jpg';
                                if (stop.port.includes('Iraklion') || stop.port.includes('Crete')) return '/images/ports/iraklion-crete.jpg';
                                if (stop.port.includes('Day at Sea')) return '/images/ports/day-at-sea.jpg';
                                return '/images/ships/resilient-lady-hero.jpg';
                              })()}
                              alt={stop.port}
                              className={`w-full h-full object-cover ${
                                stop.port.includes('Day at Sea') 
                                  ? 'object-center' // For cruise ship wake, show the center with deck and wake
                                  : 'object-center' // For city/landmark images, show the center
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = '/images/ships/resilient-lady-hero.jpg';
                              }}
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full">
                                {new Date(stop.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">{stop.port}</h3>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <span className="font-medium text-gray-700">Arrive:</span>
                                <p className="text-gray-600">{stop.arrive}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Depart:</span>
                                <p className="text-gray-600">{stop.depart}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">All Aboard:</span>
                                <p className="text-gray-600">{stop.allAboard || '—'}</p>
                              </div>
                            </div>
                            
                            {stop.description && (
                              <p className="text-gray-600 text-sm">{stop.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Talent Tab */}
            <TabsContent value="talent" className="min-h-screen">
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Search */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search talent by name, category, or known for..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-ocean-500 focus:ring-ocean-500"
                    />
                  </div>
                </div>

                {/* Talent by Category */}
                {sortedCategories.length > 0 ? (
                  <div className="space-y-8">
                    {sortedCategories.map((category) => (
                      <div key={category} className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <Star className="w-5 h-5 mr-2 text-ocean-600" />
                          {category} ({talentByCategory[category].length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {talentByCategory[category].map((talent, index) => (
                            <motion.div
                              key={talent.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <Card 
                                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-200"
                                onClick={() => handleTalentClick(talent.name)}
                              >
                                <div className="p-0">
                                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                                    <img 
                                      src={talent.img} 
                                      alt={talent.name}
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                      onError={(e) => {
                                        e.currentTarget.src = "/images/talent/default-performer.jpg";
                                      }}
                                    />
                                    <div className="absolute top-2 right-2">
                                      <Badge variant="secondary" className="bg-white/90 text-gray-700 border-white/50">
                                        {talent.cat}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{talent.name}</h3>
                                    <p className="text-sm text-ocean-600 mb-2">{(talent as any).role || talent.knownFor}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{talent.bio}</p>
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

                {filteredTalent.length === 0 && (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No talent found</h3>
                    <p className="text-gray-500">Try adjusting your search terms.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Parties Tab */}
            <TabsContent value="parties" className="min-h-screen">
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <PartyPopper className="w-6 h-6 text-ocean-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Party Themes</h2>
                  </div>
                  
                  {sortedPartyDates.length === 0 ? (
                    <div className="text-center py-12">
                      <PartyPopper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No party themes available</h3>
                      <p className="text-gray-500">Party information will be available soon.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {sortedPartyDates.map((dateKey) => {
                        const dayParties = partiesByDate[dateKey];
                        const date = new Date(dateKey);
                        const formattedDate = date.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        const itineraryStop = ITINERARY.find(stop => stop.key === dateKey);
                        
                        return (
                          <div key={dateKey} className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-center space-x-3 mb-6">
                              <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full">
                                {formattedDate}
                              </div>
                              {itineraryStop && (
                                <div className="text-gray-600 text-sm">
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  {itineraryStop.port}
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              {dayParties.map(({ theme, schedule }, index) => (
                                <div key={theme.key} className="flex items-start space-x-4 p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex-shrink-0 flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-ocean-200 bg-gradient-to-br from-coral to-pink-500 shadow-md">
                                      {React.cloneElement(getPartyIcon(theme.key), { className: "w-6 h-6 text-white" })}
                                    </div>
                                    <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {globalFormatTime(schedule.time, timeFormat)}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-lg font-bold text-gray-900">{theme.key}</h4>
                                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                        {schedule.venue}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 mb-2">{theme.desc}</p>
                                    {theme.shortDesc && (
                                      <p className="text-sm text-ocean-600 font-medium italic">"{theme.shortDesc}"</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Important Info Tab */}
            <TabsContent value="info" className="min-h-screen">
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <Info className="w-6 h-6 text-ocean-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Important Trip Information</h2>
                  </div>
                  
                  {/* Check-In Information */}
                  {(IMPORTANT_INFO as any).checkIn && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarDays className="w-5 h-5 mr-2 text-ocean-600" />
                        Check-In Information
                      </h3>
                      <div className="bg-white rounded-lg p-4 space-y-2">
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
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Ship className="w-5 h-5 mr-2 text-ocean-600" />
                        Departure Information
                      </h3>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Sail Away:</span> {(IMPORTANT_INFO as any).departure.sailAway}</p>
                        <p><span className="font-medium">All Aboard:</span> {(IMPORTANT_INFO as any).departure.allAboard}</p>
                      </div>
                    </div>
                  )}

                  {/* First Day Tips */}
                  {(IMPORTANT_INFO as any).firstDayTips && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-ocean-600" />
                        First Day Tips
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
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
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-ocean-600" />
                        Entertainment Booking
                      </h3>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Booking Start:</span> {(IMPORTANT_INFO as any).entertainment.bookingStart}</p>
                        <p><span className="font-medium">Walk-ins:</span> {(IMPORTANT_INFO as any).entertainment.walkIns}</p>
                        <p><span className="font-medium">Standby Release:</span> {(IMPORTANT_INFO as any).entertainment.standbyRelease}</p>
                        <p><span className="font-medium">Rockstar Suites:</span> {(IMPORTANT_INFO as any).entertainment.rockstarSuites}</p>
                      </div>
                    </div>
                  )}

                  {/* Dining Info */}
                  {(IMPORTANT_INFO as any).dining && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UtensilsCrossed className="w-5 h-5 mr-2 text-ocean-600" />
                        Dining Information
                      </h3>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Reservations:</span> {(IMPORTANT_INFO as any).dining.reservations}</p>
                        <p><span className="font-medium">Walk-ins:</span> {(IMPORTANT_INFO as any).dining.walkIns}</p>
                        <p><span className="font-medium">Included:</span> {(IMPORTANT_INFO as any).dining.included}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>

    {/* Talent Modal */}
      <Dialog open={showTalentModal} onOpenChange={setShowTalentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedTalent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTalent && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={selectedTalent.img} 
                    alt={selectedTalent.name}
                    className="w-32 h-32 rounded-lg object-cover mx-auto sm:mx-0"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTalent.name}</h2>
                  <Badge variant="secondary" className="mb-2">{selectedTalent.cat}</Badge>
                  <p className="text-ocean-600 font-medium mb-2">{(selectedTalent as any).role || selectedTalent.knownFor}</p>
                  <p className="text-gray-700 leading-relaxed">{selectedTalent.bio}</p>
                </div>
              </div>
              
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
    </div>
  );
}