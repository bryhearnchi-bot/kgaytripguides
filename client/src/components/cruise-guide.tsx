import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Talent, DailyEvent, CityAttraction } from "@/data/cruise-data";
import { useCruiseData, transformCruiseData } from "@/hooks/useCruiseData";




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

function parseTime(timeStr: string): { h: number; m: number } | null {
  if (!timeStr || timeStr === "—" || /overnight/i.test(timeStr)) return null;

  // Handle 24h format (HH:mm)
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { h: parseInt(match24[1], 10), m: parseInt(match24[2], 10) };
  }

  // Handle 12h format (H:mm AM/PM)
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const isPM = /pm/i.test(match12[3]);

    if (h === 12) h = 0;
    if (isPM) h += 12;

    return { h, m };
  }

  return null;
}

function formatTime(timeStr: string, mode: "12h" | "24h"): string {
  const parsed = parseTime(timeStr);
  if (!parsed) return timeStr;

  const { h, m } = parsed;
  const mm = String(m).padStart(2, "0");

  if (mode === "24h") {
    const hh = String(h).padStart(2, "0");
    return `${hh}:${mm}`;
  } else {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h >= 12 ? "PM" : "AM";
    return `${h12}:${mm} ${period}`;
  }
}

function formatAllAboard(departTime: string, mode: "12h" | "24h"): string {
  const parsed = parseTime(departTime);
  if (!parsed) return departTime;

  let { h, m } = parsed;
  h = h - 1;
  if (h < 0) h = 23;

  const mm = String(m).padStart(2, "0");

  if (mode === "24h") {
    const hh = String(h).padStart(2, "0");
    return `${hh}:${mm}`;
  } else {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h >= 12 ? "PM" : "AM";
    return `${h12}:${mm} ${period}`;
  }
}

function isDateInPast(dateKey: string): boolean {
  const today = new Date();
  const cruiseDate = new Date(dateKey);

  // Set both dates to start of day for comparison
  today.setHours(0, 0, 0, 0);
  cruiseDate.setHours(0, 0, 0, 0);

  return cruiseDate < today;
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
    'Aug': 7, 'August': 7  // JavaScript months are 0-indexed
  };
  const month = monthMap[monthStr] ?? 7; // Default to August
  const day = parseInt(dayStr, 10);

  // Parse the event time
  const timeData = parseTime(event.time);
  if (!timeData) {
    throw new Error('Invalid time format');
  }

  // Get timezone offset for the port location
  const portTimezoneOffset = getPortTimezoneOffset(eventDate);

  // Create date in UTC and adjust for port timezone
  const utcDate = new Date(Date.UTC(year, month, day, timeData.h, timeData.m));
  const startDate = new Date(utcDate.getTime() - (portTimezoneOffset * 60 * 60 * 1000));

  // Set duration based on event type - KGay Travel pre-cruise party is 3 hours, others are 1 hour
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

function getPortTimezoneOffset(eventDate: string): number {
  // Map of port locations to their timezone offsets from UTC
  const portTimezones: { [key: string]: number } = {
    'Barcelona': 2,      // UTC+2 (CEST in August)
    'Mykonos': 3,        // UTC+3 (EEST in August)
    'Kusadasi': 3,       // UTC+3 (TRT in August)
    'Crete': 3,          // UTC+3 (EEST in August)
    'Santorini': 3,      // UTC+3 (EEST in August)
    'Sea Day': 2,        // Default to ship timezone (likely Mediterranean time)
  };

  // Extract location from date string or determine based on itinerary
  let location = 'Sea Day'; // Default

  // Check if it's a sea day or specific port
  if (eventDate.includes('Mykonos')) location = 'Mykonos';
  else if (eventDate.includes('Kusadasi')) location = 'Kusadasi';
  else if (eventDate.includes('Crete')) location = 'Crete';
  else if (eventDate.includes('Santorini')) location = 'Santorini';
  else if (eventDate.includes('Barcelona')) location = 'Barcelona';

  return portTimezones[location] || 2; // Default to UTC+2 if location not found
}

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
    'PRODID:-//Atlantis Cruise Guide//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@cruise-guide.com`,
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
  const sortedEvents = events.sort((a, b) => {
    // Special case: if this is Thursday and we have Neon Playground, put it last
    if (eventDate?.includes("Aug 28")) {
      if (a.title === "Neon Playground") return 1;
      if (b.title === "Neon Playground") return -1;
    }
    return a.time.localeCompare(b.time);
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
                        title="Pre-Cruise Happy Hour by KGay Travel"
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
                      <span className="text-sm font-medium">{formatTime(event.time, "24h")}</span>
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
                      <div className="text-xs text-gray-500">
                        {clickableNames.map((name, idx) => {
                          const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
                          return talent ? (
                            <span key={name}>
                              {talent.cat}
                              {idx < clickableNames.length - 1 && ', '}
                            </span>
                          ) : null;
                        }).filter(Boolean)}
                      </div>
                    )}
                  </div>
                  {event.type === 'party' && (
                    <p className="text-xs text-gray-600">
                      {PARTY_THEMES.find(p => event.title.includes(p.key))?.shortDesc}
                    </p>
                  )}
                  {event.title.includes("KGay Travel") && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Join us for our Pre-Cruise Meet and Greet!</strong></p>
                      <p>📍 38 Akadimias, Omirou Street, Athens</p>
                      <p>💰 €25 entrance for unlimited consumption on cocktails (Aperol, Porn Star Martini and Paloma), beers, wine, soft drinks</p>
                      <p>⏰ 5:00 PM - 8:00 PM • Limited capacity - arrive early!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Button - positioned in bottom right corner */}
              {eventDate && (
                <div className="absolute bottom-2 right-2">
                  <AddToCalendarButton event={event} eventDate={eventDate} />
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function ItineraryTab({ onTalentClick, ITINERARY, CITY_ATTRACTIONS, DAILY, TALENT, PARTY_THEMES }: { onTalentClick: (talent: Talent) => void; ITINERARY: any[]; CITY_ATTRACTIONS: any[]; DAILY: any[]; TALENT: any[]; PARTY_THEMES: any[] }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityAttraction | null>(null);
  const getPortImage = (port: string, date: string) => {
    const portImages = {
      "Athens, Greece": "/images/ports/athens-greece.jpg",
      "Santorini, Greece": "/images/ports/santorini-greece.jpg", 
      "Kuşadası, Turkey": "/images/ports/kusadasi-turkey.jpg",
      "Alexandria (Cairo), Egypt": "/images/ports/alexandria-egypt.jpg",
      "Mykonos, Greece": "/images/ports/mykonos-greece.jpg",
      "Iraklion, Crete": "/images/ports/iraklion-crete.jpg"
    };

    // Handle Istanbul's two different days
    if (port === "Istanbul, Turkey") {
      // First day (Aug 24) - Blue Mosque
      if (date === "Sun, Aug 24") {
        return "/images/ports/istanbul-turkey-day1.jpg";
      }
      // Second day (Aug 25) - Mosque panorama
      return "/images/ports/istanbul-turkey-day2.jpg";
    }

    if (port === "Day at Sea") {
      // First sea day (Aug 26)
      if (date === "Tue, Aug 26") {
        return "/images/ports/sea-day.jpg";
      }
      // Second sea day (Aug 28) - Virgin Resilient Lady
      return "/images/ports/sea-day.jpg";
    }

    // Handle Athens with special labels
    if (port.includes("Athens, Greece")) {
      return portImages["Athens, Greece"];
    }

    return portImages[port as keyof typeof portImages];
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-blue-800 text-sm font-medium">
              The information listed is based on the official cruise guide from Atlantis. Be sure to check the Virgin app for any possible changes.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        {ITINERARY.map((stop, idx) => {
          const isSea = /sea/i.test(stop.port);
          const isOvernight = /overnight/i.test(stop.depart);

          return (
            <motion.div
              key={stop.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <Card className="p-0 bg-white hover:shadow-xl transition-shadow duration-200 border-2 border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                  {/* Image Section - Fixed size */}
                  <div className="lg:col-span-1">
                    {getPortImage(stop.port, stop.date) ? (
                      <img 
                        src={getPortImage(stop.port, stop.date)} 
                        alt={stop.port} 
                        className="w-full h-48 lg:h-full object-cover"
                        onError={(e) => {
                          // Fallback to a default cruise ship image if the specific image fails
                          (e.target as HTMLImageElement).src = "/images/ports/sea-day.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 lg:h-full bg-gradient-to-br from-ocean-100 to-ocean-200 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-ocean-600" />
                      </div>
                    )}
                  </div>

                  {/* Content Section - Consistent layout */}
                  <div className="lg:col-span-2 p-6 flex flex-col justify-between">
                    {/* Header */}
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-ocean-700" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{stop.port}</h3>
                          <p className="text-sm text-gray-600">{stop.date}</p>
                        </div>
                      </div>

                      {/* Times Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Arrive</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            {formatTime(stop.arrive, "24h")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Depart</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            {formatTime(stop.depart, "24h")}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-4">
                        {!isSea && stop.depart !== "—" && !isOvernight && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-800 uppercase tracking-wide font-medium">All Aboard</p>
                            <p className="text-sm font-bold text-amber-900 mt-1">
                              {formatAllAboard(stop.depart, "24h")}
                            </p>
                            {stop.port.includes("Santorini") && (
                              <p className="text-xs text-amber-700 mt-1 font-medium">
                                Last tender: 9:00 PM
                              </p>
                            )}
                          </div>
                        )}

                        {isOvernight && (
                          <div className="p-3 bg-coral-50 border border-coral-200 rounded-lg">
                            <p className="text-xs text-coral-800 uppercase tracking-wide font-medium">Extended Port</p>
                            <p className="text-sm font-bold text-coral-900 mt-1">Overnight Stay</p>
                          </div>
                        )}

                        {isSea && (
                          <div className="p-3 bg-ocean-50 border border-ocean-200 rounded-lg">
                            <p className="text-xs text-ocean-800 uppercase tracking-wide font-medium">Sea Day</p>
                            <p className="text-sm font-bold text-ocean-900 mt-1">Relax & Enjoy</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buttons - Always at bottom */}
                    <div className="flex gap-3 mt-auto">
                      <Button
                        onClick={() => setSelectedDay(stop.key)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-ocean-300 text-ocean-700 hover:bg-ocean-50 font-medium"
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        View Events
                      </Button>
                      {!isSea && (() => {
                        const cityName = stop.port.includes("(") ? 
                          stop.port.split("(")[0].trim() : 
                          stop.port.replace(/\s*\(.*?\)/, '');
                        const cityData = CITY_ATTRACTIONS.find(city => 
                          city.city.toLowerCase().includes(cityName.toLowerCase()) ||
                          cityName.toLowerCase().includes(city.city.toLowerCase()) ||
                          // Special handling for Crete/Iraklion
                          (cityName.toLowerCase().includes("iraklion") && city.city.toLowerCase().includes("iraklion")) ||
                          (cityName.toLowerCase().includes("crete") && city.city.toLowerCase().includes("crete"))
                        );
                        return cityData ? (
                          <Button
                            onClick={() => setSelectedCity(cityData)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-ocean-300 text-ocean-700 hover:bg-ocean-50 font-medium"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Things to Do
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Events Modal */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-ocean-600" />
                Events for {ITINERARY.find(i => i.key === selectedDay)?.date}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {(() => {
                let allEvents = ITINERARY.find(i => i.key === selectedDay)?.key ? (DAILY.find(d => d.key === ITINERARY.find(i => i.key === selectedDay)?.key)?.items || []) : [];

                // Special case: if viewing Thursday (2025-08-28), include Neon Playground from Friday
                if (ITINERARY.find(i => i.key === selectedDay)?.key === "2025-08-28") {
                  const fridayEvents = DAILY.find(d => d.key === "2025-08-29");
                  const neonPlayground = fridayEvents?.items.find(item => item.title === "Neon Playground");
                  if (neonPlayground) {
                    allEvents = [...allEvents, neonPlayground];
                  }
                }

                const handleTalentClick = (name: string) => {
                  const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
                  if (talent) {
                    setSelectedDay(null);
                    onTalentClick(talent);
                  }
                };

                return allEvents.length > 0 ? (
                  <TimelineList 
                    events={allEvents} 
                    onTalentClick={handleTalentClick}
                    eventDate={ITINERARY.find(i => i.key === selectedDay)?.date || ''}
                    TALENT={TALENT}
                    PARTY_THEMES={PARTY_THEMES}
                  />
                ) : (
                  <p className="text-gray-500 italic text-center py-8">No events scheduled for this day.</p>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Things to Do Modal */}
      {selectedCity && (
        <Dialog open={!!selectedCity} onOpenChange={(open) => !open && setSelectedCity(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-coral-600" />
                Things to Do in {selectedCity.city}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              {/* Top Attractions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  {selectedCity.city.includes("Alexandria") ? "Top 3 Attractions besides the Pyramids" : "Top 3 Attractions"}
                </h3>
                <div className="grid gap-3">
                  {selectedCity.topAttractions.map((attraction, idx) => (
                    <div key={idx} className="p-3 bg-gold/10 rounded-lg border border-gold/20">
                      <p className="font-medium text-gray-800">{attraction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Things to Do */}
              {selectedCity.otherThingsToDo.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-ocean-600" />
                    Other Things to Do
                  </h3>
                  <div className="grid gap-2">
                    {selectedCity.otherThingsToDo.map((activity, idx) => (
                      <div key={idx} className="p-3 bg-ocean-50 rounded-lg border border-ocean-100">
                        <p className="text-gray-700">{activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gay Bars/Clubs */}
              {selectedCity.gayBars.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-coral" />
                    Gay Bars & Clubs
                  </h3>
                  <div className="grid gap-2">
                    {selectedCity.gayBars.map((bar, idx) => {
                      // Check if the bar entry contains an address (has a colon)
                      const hasAddress = bar.includes(': ');
                      if (hasAddress) {
                        const [name, address] = bar.split(': ');
                        return (
                          <div key={idx} className="p-3 bg-coral/10 rounded-lg border border-coral/20">
                            <div className="text-gray-700">
                              <span className="font-medium">{name}</span>
                              <br />
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ocean-600 hover:text-ocean-800 underline text-sm"
                              >
                                {address}
                              </a>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="p-3 bg-coral/10 rounded-lg border border-coral/20">
                            <p className="text-gray-700">{bar}</p>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EntertainmentTab({ onTalentClick, DAILY, TALENT, ITINERARY, PARTY_THEMES }: { onTalentClick: (talent: Talent) => void; DAILY: any[]; TALENT: any[]; ITINERARY: any[]; PARTY_THEMES: any[] }) {
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const dates = DAILY.filter(d => d.items.length > 0).map(d => ({
    key: d.key,
    label: ITINERARY.find(i => i.key === d.key)?.date.split(', ')[1] || d.key.split('-')[2]
  }));

  const filteredDaysWithEvents = selectedDate === "all" 
    ? DAILY.filter(d => d.items.length > 0)
    : DAILY.filter(d => d.key === selectedDate && d.items.length > 0);

  const handleTalentClick = (name: string) => {
    const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (talent) onTalentClick(talent);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-blue-800 text-sm font-medium">
              The information listed is based on the official cruise guide from Atlantis. Be sure to check the Virgin app for any possible changes.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-white hover:bg-white/20 p-2 mb-2"
          >
            <div className="flex items-center gap-2">
              {isFilterOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Filter by Day</span>
              <span className="text-xs text-white/70 ml-2">
                ({selectedDate === "all" ? "All Days" : dates.find(d => d.key === selectedDate)?.label})
              </span>
            </div>
          </Button>

          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={selectedDate === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate("all")}
                  className={selectedDate === "all" ? "bg-ocean-700 hover:bg-ocean-800" : ""}
                >
                  All Days
                </Button>
                {dates.map(date => (
                  <Button
                    key={date.key}
                    variant={selectedDate === date.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(date.key)}
                    className={selectedDate === date.key ? "bg-ocean-700 hover:bg-ocean-800" : ""}
                  >
                    {date.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {filteredDaysWithEvents.map((day) => {
          const itinerary = ITINERARY.find(i => i.key === day.key);
          let allEvents = [...day.items];

          // Special case: if viewing Thursday (2025-08-28), include Neon Playground from Friday
          if (day.key === "2025-08-28") {
            const fridayEvents = DAILY.find(d => d.key === "2025-08-29");
            const neonPlayground = fridayEvents?.items.find(item => item.title === "Neon Playground");
            if (neonPlayground) {
              allEvents = [...allEvents, neonPlayground];
            }
          }

          // Special case: if viewing Friday (2025-08-29), exclude Neon Playground since it shows on Thursday
          if (day.key === "2025-08-29") {
            allEvents = allEvents.filter(item => item.title !== "Neon Playground");
          }

          return (
            <div key={day.key} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{itinerary?.date}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/30 bg-white/90 text-gray-800 font-medium px-4 py-2 text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {itinerary?.port}
                  </Badge>
                  {itinerary && (itinerary.arrive !== "—" || itinerary.depart !== "—") && (
                    <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                      {itinerary.arrive !== "—" && (
                        <span>Arrive: {formatTime(itinerary.arrive, "24h")}</span>
                      )}
                      {itinerary.arrive !== "—" && itinerary.depart !== "—" && <span>•</span>}
                      {itinerary.depart !== "—" && (
                        <span>Depart: {formatTime(itinerary.depart, "24h")}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {allEvents.length > 0 ? (
                <TimelineList 
                  events={allEvents} 
                  onTalentClick={handleTalentClick}
                  eventDate={itinerary?.date || ''}
                  TALENT={TALENT}
                  PARTY_THEMES={PARTY_THEMES}
                />
              ) : (
                <p className="text-gray-500 italic">No entertainment scheduled for this day.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Venue Guide at bottom of Events page */}
      <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-ocean-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Venue Guide</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Music className="w-8 h-8 text-coral" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Red Room</h4>
            <p className="text-sm text-gray-600 mb-1">Main theater for major shows and performances</p>
            <Badge variant="outline" className="text-xs">Deck 5</Badge>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wine className="w-8 h-8 text-yellow-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">The Manor</h4>
            <p className="text-sm text-gray-600 mb-1">Intimate venue for cabaret and comedy shows</p>
            <Badge variant="outline" className="text-xs">Deck 7</Badge>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-ocean-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Waves className="w-8 h-8 text-ocean-700" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Aquatic Club</h4>
            <p className="text-sm text-gray-600 mb-1">Pool deck parties and T-Dance events</p>
            <Badge variant="outline" className="text-xs">Deck 16</Badge>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Piano className="w-8 h-8 text-purple-700" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">On the Rocks</h4>
            <p className="text-sm text-gray-600 mb-1">Mixology bar with aged whiskies</p>
            <Badge variant="outline" className="text-xs">Deck 6</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EntertainersTab({ onTalentClick, TALENT }: { onTalentClick: (talent: Talent) => void; TALENT: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(TALENT.map(t => t.cat)))];

  const filteredTalent = TALENT.filter(talent => {
    const matchesCategory = selectedCategory === "all" || talent.cat === selectedCategory;
    return matchesCategory;
  });

  const groupedTalent = filteredTalent.reduce((acc, talent) => {
    if (!acc[talent.cat]) acc[talent.cat] = [];
    acc[talent.cat].push(talent);
    return acc;
  }, {} as Record<string, Talent[]>);

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-blue-800 text-sm font-medium">
              The information listed is based on the official cruise guide from Atlantis. Be sure to check the Virgin app for any possible changes.
            </p>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-ocean-700 hover:bg-ocean-800" : ""}
            >
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedTalent).map(([category, talents]) => (
          <div key={category} className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                {category}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {talents.map((talent, idx) => (
                <motion.div
                  key={talent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group bg-white"
                    onClick={() => onTalentClick(talent)}
                  >
                    <div className="relative h-48 w-full bg-gradient-to-br from-ocean-800/40 to-indigo-900/50 flex items-center justify-center overflow-hidden">
                      {talent.img ? (
                        <img 
                          src={talent.img} 
                          alt={talent.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <Images className="h-10 w-10 text-ocean-300" />
                      )}
                      {talent.social?.instagram && (
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            className="w-8 h-8 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full"
                            asChild
                          >
                            <a 
                              href={talent.social.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-gray-900">{talent.name}</h4>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-ocean-600 transition-colors" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {talent.cat}
                      </Badge>
                      <p className="text-sm text-gray-600">{talent.knownFor}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{talent.bio}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartiesTab({ onTalentClick, DAILY, PARTY_THEMES, ITINERARY }: { onTalentClick: (talent: Talent) => void; DAILY: any[]; PARTY_THEMES: any[]; ITINERARY: any[] }) {
  const partyEventsByDay = DAILY.reduce((acc, day) => {
    const itinerary = ITINERARY.find(i => i.key === day.key);
    let parties = day.items
      .filter(item => item.type === 'party' || item.type === 'after')
      .map(item => ({
        ...item,
        date: itinerary?.date || day.key,
        dayKey: day.key,
        port: itinerary?.port,
        arrive: itinerary?.arrive,
        depart: itinerary?.depart,
        themeDesc: PARTY_THEMES.find(p => item.title.includes(p.key))?.desc
      }));

    // Special case: if viewing Thursday (2025-08-28), include Neon Playground from Friday
    if (day.key === "2025-08-28") {
      const fridayEvents = DAILY.find(d => d.key === "2025-08-29");
      const neonPlayground = fridayEvents?.items.find(item => item.title === "Neon Playground");
      if (neonPlayground) {
        parties = [...parties, {
          ...neonPlayground,
          date: itinerary?.date || day.key,
          dayKey: day.key,
          port: itinerary?.port,
          arrive: itinerary?.arrive,
          depart: itinerary?.depart,
          themeDesc: PARTY_THEMES.find(p => neonPlayground.title.includes(p.key))?.desc
        }];
      }
    }

    // Special case: if viewing Friday (2025-08-29), exclude Neon Playground since it shows on Thursday
    if (day.key === "2025-08-29") {
      parties = parties.filter(item => item.title !== "Neon Playground");
    }

    if (parties.length > 0) {
      acc[day.key] = {
        date: itinerary?.date || day.key,
        port: itinerary?.port,
        arrive: itinerary?.arrive,
        depart: itinerary?.depart,
        parties
      };
    }
    return acc;
  }, {} as Record<string, { date: string; port?: string; arrive?: string; depart?: string; parties: any[] }>);

  const handleTalentClick = (name: string) => {
    const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (talent) onTalentClick(talent);
  };

  const getPartyGradient = (title: string) => {
    if (title.includes("White")) return "from-coral to-pink-500";
    if (title.includes("Lost")) return "from-ocean-700 to-ocean-500";
    if (title.includes("Empires")) return "from-yellow-500 to-gold";
    if (title.includes("Neon")) return "from-purple-600 to-pink-600";
    if (title.includes("Pink")) return "from-pink-500 to-pink-600";
    if (title.includes("Disco")) return "from-orange-500 to-yellow-500";
    return "from-ocean-600 to-ocean-700";
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-blue-800 text-sm font-medium">
              The information listed is based on the official cruise guide from Atlantis. Be sure to check the Virgin app for any possible changes.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {Object.entries(partyEventsByDay).map(([dayKey, dayData]) => (
          <div key={dayKey} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{dayData.date}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {dayData.port && (
                  <Badge variant="outline" className="border-white/30 bg-white/90 text-gray-800 font-medium px-4 py-2 text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {dayData.port}
                  </Badge>
                )}
                {dayData.depart && dayData.depart !== "—" && (
                  <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                    <span>Depart: {formatTime(dayData.depart, "24h")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {dayData.parties.sort((a, b) => {
                // Special case: if this is Thursday and we have Neon Playground, put it last
                if (dayKey === "2025-08-28") {
                  if (a.title === "Neon Playground") return 1;
                  if (b.title === "Neon Playground") return -1;
                }
                return a.time.localeCompare(b.time);
              }).map((party, idx) => (
                <motion.div
                  key={`${party.title}-${party.time}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className="bg-white p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 overflow-hidden relative min-h-52 flex flex-col">
                    <div className="relative z-10 flex flex-col h-full pb-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center border border-ocean-200 shadow-lg">
                            {React.cloneElement(getPartyIcon(party.title), { className: "w-6 h-6 text-ocean-600" })}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold leading-tight text-gray-900">{party.title}</h3>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 mb-3">
                        {party.themeDesc && (
                          <p className={`text-gray-600 text-xs leading-relaxed italic ${party.title === "Neon Playground" ? "" : "line-clamp-3"}`}>
                            {party.themeDesc}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200 px-2 py-1 font-medium text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(party.time, "24h")}
                        </Badge>
                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200 px-2 py-1 font-medium text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {party.venue}
                        </Badge>
                      </div>
                    </div>

                    {/* Calendar Button - positioned in bottom right corner */}
                    <div className="absolute bottom-2 right-2">
                      <AddToCalendarButton event={party} eventDate={dayData.date} />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoTab({ IMPORTANT_INFO, CRUISE_INFO }: { IMPORTANT_INFO: any; CRUISE_INFO: any }) {
  return (
    <div className="space-y-8">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-blue-800 text-sm font-medium">
              The information listed is based on the official cruise guide from Atlantis. Be sure to check the Virgin app for any possible changes.
            </p>
          </div>
        </div>
      </div>

      {/* First Day Tips - Moved to top */}
      <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-coral" />
          First Day Tips
        </h3>
        <ul className="space-y-3 text-gray-700">
          {IMPORTANT_INFO?.firstDayTips?.map((tip, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm leading-relaxed">{tip}</span>
            </li>
          )) || (
            <li className="text-gray-500 italic">First day tips loading...</li>
          )}
        </ul>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
              <Ship className="w-5 h-5 text-ocean-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Ship Details</h3>
          </div>
            <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ship:</span>
              <span className="font-medium">Virgin Resilient Lady</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacity:</span>
              <span className="font-medium">2,770 passengers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Decks:</span>
              <span className="font-medium">17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Length:</span>
              <span className="font-medium">278m</span>
            </div>
            </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-ocean-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Key Dates</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Embarkation:</span>
              <span className="font-medium">Aug 21, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disembarkation:</span>
              <span className="font-medium">Aug 31, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">10 nights</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ports:</span>
              <span className="font-medium">7 destinations</span>
            </div>
            </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-ocean-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Resources</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://atlantisevents.com/wp-content/uploads/ar25-cruise-vacation-guide-final.pdf?utm_source=exacttarget&utm_medium=email&utm_campaign=email" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <FileText className="w-5 h-5 text-ocean-700 mr-3" />
                <span className="text-ocean-700">Cruise Guide PDF</span>
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://www.planetcruise.com/en/resilient-lady/deck-plans" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Map className="w-5 h-5 text-ocean-700 mr-3" />
                <span className="text-ocean-700">Deck Plans</span>
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://atlantisevents.com/vacation/greek-isles-istanbul-and-pyramids-cruise/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Phone className="w-5 h-5 text-ocean-700 mr-3" />
                <span className="text-ocean-700">Atlantis Cruise Page</span>
              </a>
            </Button>
            </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Embarkation Information</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 mb-1"><strong>Port:</strong> Piraeus Terminal C (Alkimos)</p>
              <p className="text-gray-600 mb-1">10 Akti Miaouli, Piraeus 185 38 Greece</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1"><strong>Check-in:</strong> Opens at 1:00 PM</p>
              <p className="text-gray-600 mb-1"><strong>Embarkation:</strong> Starts at 1:30 PM</p>
              <p className="text-gray-600 mb-1"><strong>Check-in closes:</strong> 5:00 PM</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-red-700 text-xs"><strong>Important:</strong> No waiting area available before 1 PM. Immigration processing may take up to an hour.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Passport & Visa Requirements</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-700 text-xs"><strong>Required:</strong> Valid passport expiring no earlier than March 3rd, 2026</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-xs mb-2"><strong>Passport Collection Process:</strong></p>
              <p className="text-yellow-700 text-xs mb-2">In order to clear all sailors for these ports, Virgin will collect all passports after you check in and before you embark the ship. Passports will be returned to you on the sea day before we arrive in Alexandria, with details on how to collect them provided onboard.</p>
              <p className="text-yellow-700 text-xs">Guests from certain Restricted Nationalities will also have to present themselves for face-to-face pre-arrival clearance in Mykonos. A letter will be delivered to all impacted Sailors indicating the process.</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1"><strong>No visa required for:</strong></p>
              <p className="text-gray-600 text-xs">USA, Canada, UK, or EU passport holders visiting Turkey and Egypt</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1"><strong>Other citizens:</strong></p>
              <p className="text-gray-600 text-xs">Check with consulate/embassy for Turkey and Egypt visa requirements</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Packing Advice</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 mb-2"><strong>Dress Code:</strong> Casual, comfortable atmosphere</p>
              <p className="text-gray-600 text-xs mb-2">• No formal nights or jacket/tie required</p>
              <p className="text-gray-600 text-xs mb-2">• Avoid gym wear at dinner (tank tops, gym shorts)</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1"><strong>Weather:</strong> Hot summer weather expected</p>
              <p className="text-gray-600 text-xs mb-1">• Daytime: ~90°F / 32°C</p>
              <p className="text-gray-600 text-xs mb-1">• Nighttime: ~72°F / 22°C</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 text-xs"><strong>Bring:</strong> Lightweight cotton clothes, hat, sunblock, comfortable shoes</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Prohibited Items</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-700 text-xs mb-2"><strong>Do not bring:</strong></p>
              <p className="text-yellow-700 text-xs">• Irons (including travel steamers)</p>
              <p className="text-yellow-700 text-xs">• Alcoholic beverages</p>
              <p className="text-yellow-700 text-xs">• Knives or firearms</p>
              <p className="text-yellow-700 text-xs">• Power strips</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs"><strong>Currency:</strong> Ship operates on US Dollars</p>
              <p className="text-gray-600 text-xs">EUR exchange rate: ~1.18 for $1 USD</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Departure Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Ship className="w-5 h-5 text-ocean-600" />
            Departure Information
          </h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>Port:</strong> {CRUISE_INFO?.departureInfo?.port || 'Loading...'}</p>
            <p><strong>Pier Opens:</strong> {CRUISE_INFO?.departureInfo?.pierOpens || 'Loading...'}</p>
            <p><strong>Luggage Drop-off:</strong> {CRUISE_INFO?.departureInfo?.luggageDropOff || 'Loading...'}</p>
            <p><strong>Sailaway Party:</strong> {CRUISE_INFO?.departureInfo?.sailawayParty || 'Loading...'}</p>
            <p><strong>Latest Arrival:</strong> {CRUISE_INFO?.departureInfo?.latestArrival || 'Loading...'}</p>
          </div>
        </Card>

        {/* Entertainment Booking */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Music className="w-5 h-5 text-coral" />
            Entertainment Information
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm font-medium mb-2"><strong>Important Update:</strong></p>
              <p className="text-amber-700 text-sm mb-2">We have changed the times and dates of several of our shows and parties since the Vacation Guide was published. Please refer to the times listed in the App as well as on the "Glance at a Day" printed program that you'll find in your room today.</p>
              <p className="text-amber-700 text-sm">The "Glance at a Day" program is only delivered on day One – after that you can find a copy at Sailor Services, Grounds Club, or The Galley. It's the same information as on the App.</p>
              <p className="text-amber-700 text-sm">And yes, we moved Neon Playground to a new night, next Thursday, for a better experience for all.</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Booking Information</p>
              <p className="text-sm mb-1"><strong>Booking Opens:</strong> {IMPORTANT_INFO?.entertainment?.bookingStart || 'Loading...'}</p>
              <p className="text-sm mb-1"><strong>Walk-ins:</strong> {IMPORTANT_INFO?.entertainment?.walkIns || 'Loading...'}</p>
              <p className="text-sm mb-1"><strong>Standby Release:</strong> {IMPORTANT_INFO?.entertainment?.standbyRelease || 'Loading...'}</p>
              <p className="text-sm"><strong>Rockstar Suites:</strong> {IMPORTANT_INFO?.entertainment?.rockstarSuites || 'Loading...'}</p>
            </div>
          </div>
        </Card>

        {/* Dining Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wine className="w-5 h-5 text-coral" />
            Dining Information
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 text-sm font-medium"><strong>Good News:</strong> All restaurants are included in your cruise fare - no extra charges!</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Reservations & Walk-ins</p>
              <p className="text-sm mb-1"><strong>Reservations:</strong> {IMPORTANT_INFO?.dining?.reservations || 'Loading...'}</p>
              <p className="text-sm mb-1"><strong>Walk-ins:</strong> {IMPORTANT_INFO?.dining?.walkIns || 'Loading...'}</p>
              <p className="text-sm text-gray-600 italic">Pro tip: Even "sold out" restaurants accept walk-ins - this just means no more reservations available</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Dining Times</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Breakfast</p>
                  <p>7:00 AM - 11:30 AM</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Lunch</p>
                  <p>12:00 PM - 3:30 PM</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Dinner</p>
                  <p>6:00 PM - 10:30 PM</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Late Night</p>
                  <p>11:00 PM - 2:00 AM</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Restaurant Highlights</p>
              <div className="space-y-1 text-sm">
                <p><strong>The Wake:</strong> Fine dining with sea views</p>
                <p><strong>Pink Agave:</strong> Mexican cuisine & cocktails</p>
                <p><strong>Razzle Dazzle:</strong> Vegetarian fine dining</p>
                <p><strong>The Galley:</strong> Food court with multiple options</p>
                <p><strong>The Pizza Place:</strong> 24/7 pizza counter</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-700 text-sm"><strong>Room Service:</strong> Available 24/7 with no delivery fee. Perfect for those late-night cravings!</p>
            </div>
          </div>
        </Card>

        </div>

      {/* KGay Travel Sponsorship Card */}
      <Card className="p-8 bg-white border-0 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <a href="https://kgaytravel.com/" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg" 
              alt="KGay Travel" 
              className="h-20 w-auto mb-4 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </a>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">This Guide Sponsored by KGay Travel</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">About KGay Travel</h4>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              KGay Travel is an outstanding gay travel specialist led by Steven Krumholz (Steven K). With expertise and passion for LGBTQ+ travel, 
              Steven curates unforgettable experiences with personalized service and extensive knowledge of LGBTQ+ friendly destinations. 
              Seven-time winner of the San Diego Awards for Travel Agency and 2024 San Diego Business Hall of Fame qualifier.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              **WE NEVER CHARGE YOU FOR OUR SERVICE!** Let a professional with connections help you plan your next vacation!
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-ocean-600" />
                <a href="tel:3105609887" className="text-ocean-600 hover:text-ocean-700 font-medium">310.560.9887</a>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-ocean-600" />
                <a href="mailto:steven@kgaytravel.com" className="text-ocean-600 hover:text-ocean-700 font-medium">steven@kgaytravel.com</a>
              </div>
              <div className="flex items-start gap-2 mt-3">
                <MapPin className="w-4 h-4 text-ocean-600 mt-0.5" />
                <div className="text-gray-700">
                  <div>3245 University Ave #1111</div>
                  <div>San Diego, CA 92104</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">CST #2089491-50</p>
              <p className="text-xs text-gray-600 mt-1">Specializing in Atlantis Events, Brand G, Vacaya, and luxury LGBTQ+ travel worldwide</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TalentModal({ talent, isOpen, onClose, DAILY }: { talent: Talent | null; isOpen: boolean; onClose: () => void; DAILY: any[] }) {
  const appearances = useMemo(() => {
    if (!talent) return [];

    const events: Array<{ date: string; time: string; venue: string; title: string }> = [];

    DAILY.filter(day => !isDateInPast(day.key)).forEach(day => {
      day.items.forEach(event => {
        const titleLower = event.title.toLowerCase();
        const nameLower = talent.name.toLowerCase();

        const isMatch = titleLower.includes(nameLower) ||
          (talent.name === "Special Guest" && titleLower.includes("surprise guest")) ||
          (talent.name === "The Diva (Bingo)" && titleLower.includes("bingo")) ||
          (talent.name === "Monét X Change" && titleLower.includes("monet")) ||
          (talent.name === "Sherry Vine" && titleLower.includes("sherry")) ||
          (talent.name === "Alexis Michelle" && titleLower.includes("alexis")) ||
          (talent.name === "Reuben Kaye" && titleLower.includes("reuben")) ||
          (talent.name === "Rob Houchen" && titleLower.includes("rob")) ||
          (talent.name === "Alyssa Wray" && titleLower.includes("alyssa")) ||
          (talent.name === "Brad Loekle" && titleLower.includes("brad")) ||
          (talent.name === "Rachel Scanlon" && titleLower.includes("rachel")) ||
          (talent.name === "Daniel Webb" && titleLower.includes("daniel")) ||
          (talent.name === "Leona Winter" && titleLower.includes("leona")) ||
          (talent.name === "AirOtic" && titleLower.includes("airotic")) ||
          (talent.name === "Another Rose" && titleLower.includes("another rose")) ||
          (talent.name === "Persephone" && titleLower.includes("persephone")) ||
          (talent.name === "William TN Hall" && titleLower.includes("william")) ||
          (talent.name === "Brian Nash" && titleLower.includes("brian")) ||
          (talent.name === "Brandon James Gwinn" && titleLower.includes("brandon"));

        if (isMatch) {

          const dayData = ITINERARY.find(itineraryDay => itineraryDay.key === day.key);
          events.push({
            date: dayData?.date || day.key,
            time: event.time,
            venue: event.venue,
            title: event.title
          });
        }
      });
    });

    return events;
  }, [talent]);

  if (!talent) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{talent.name}</DialogTitle>
          <p className="text-ocean-600 font-medium">{talent.role} • {talent.cat}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="sm:col-span-1">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gradient-to-br from-ocean-900/50 to-indigo-950/70 flex items-center justify-center">
              {talent.img ? (
                <img 
                  src={talent.img} 
                  alt={talent.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-ocean-300" />
              )}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-4">
            <div>
              <h5 className="text-gray-900 font-semibold mb-2">Bio</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{talent.bio}</p>
            </div>

            {talent.social && Object.keys(talent.social).length > 0 && (
              <div>
                <h5 className="text-gray-900 font-semibold mb-2">Follow {talent.name}</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(talent.social).map(([platform, url]) => (
                    <SocialMediaButton key={platform} platform={platform} url={url} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h5 className="text-gray-900 font-semibold mb-2">Appearances on This Cruise</h5>
              {appearances.length === 0 ? (
                <p className="text-sm text-gray-500">No direct listings found.</p>
              ) : (
                <div className="space-y-2">
                  {appearances.map((appearance, index) => (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                      <span className="text-ocean-600 font-medium">{appearance.date}</span> • {appearance.time} @ {appearance.venue}
                      <div className="text-gray-600">{appearance.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialMediaButton({ platform, url }: { platform: string; url: string }) {
  let icon;
  let colorClass;

  switch (platform.toLowerCase()) {
    case 'instagram':
      icon = <Instagram className="h-4 w-4" />;
      colorClass = 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
      break;
    case 'twitter':
      icon = <Twitter className="h-4 w-4" />;
      colorClass = 'from-blue-400 to-blue-500 hover:from-blue-500 to-blue-600';
      break;
    case 'youtube':
      icon = <Youtube className="h-4 w-4" />;
      colorClass = 'from-red-500 to-red-600 hover:from-red-600 to-red-700';
      break;
    case 'linkedin':
      icon = <Linkedin className="h-4 w-4" />;
      colorClass = 'from-blue-700 to-blue-800 hover:from-blue-800 to-blue-900';
      break;
    default:
      return null;
  }

  return (
    <Button
      size="sm"
      className={`w-8 h-8 p-0 bg-gradient-to-r text-white border-0 rounded-full ${colorClass}`}
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        {icon}
      </a>
    </Button>
  );
}

interface CruiseGuideProps {
  slug?: string;
}

export default function CruiseGuide({ slug = 'greek-isles-2025' }: CruiseGuideProps) {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch cruise data from the database
  const { data: cruiseData, isLoading, error } = useCruiseData(slug);
  
  // Transform the data to match our existing format
  const transformedData = cruiseData ? transformCruiseData(cruiseData) : null;
  
  // Extract the transformed data
  const ITINERARY = transformedData?.ITINERARY || [];
  const DAILY = transformedData?.DAILY || [];
  const TALENT = transformedData?.TALENT || [];
  const PARTY_THEMES = transformedData?.PARTY_THEMES || [];
  const CITY_ATTRACTIONS = transformedData?.CITY_ATTRACTIONS || [];
  const IMPORTANT_INFO = transformedData?.IMPORTANT_INFO || {};
  const CRUISE_INFO = transformedData?.CRUISE_INFO || {};

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // In a real app, you would fetch fresh data here.
    // For this example, we'll just update the timestamp.
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your cruise guide...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Ship className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Unable to load cruise data</h2>
          <p className="text-lg">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!transformedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Ship className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">No cruise data available</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      {/* Header */}
      <header className="cruise-gradient wave-pattern text-white fixed top-0 left-0 right-0 z-50 bg-ocean-600 opacity-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 mb-2">
                <img 
                  src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png" 
                  alt="Atlantis Events" 
                  className="h-9 w-auto brightness-0 invert"
                />
                <a href="https://kgaytravel.com/" target="_blank" rel="noopener noreferrer">
                  <img 
                    src="https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg" 
                    alt="KGay Travel" 
                    className="h-16 w-auto hover:opacity-80 transition-opacity"
                  />
                </a>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                Greek Isles Cruise Guide
              </h1>
              <p className="text-white/80 text-base">August 21-31, 2025</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <p className="text-white/60 text-xs">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1 h-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex-1"></div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="itinerary" className="flex items-center gap-2">
                    <Anchor className="w-4 h-4" />
                    <span className="hidden sm:inline">Itinerary</span>
                  </TabsTrigger>
                  <TabsTrigger value="entertainment" className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    <span className="hidden sm:inline">Shows</span>
                  </TabsTrigger>
                  <TabsTrigger value="talent" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
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

        {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <main className="max-w-7xl mx-auto px-4 pt-[25px] pb-[25px]">
          <TabsContent value="itinerary">
            <ItineraryTab onTalentClick={setSelectedTalent} ITINERARY={ITINERARY} CITY_ATTRACTIONS={CITY_ATTRACTIONS} DAILY={DAILY} TALENT={TALENT} PARTY_THEMES={PARTY_THEMES} />
          </TabsContent>
          <TabsContent value="entertainment">
            <EntertainmentTab onTalentClick={setSelectedTalent} DAILY={DAILY} TALENT={TALENT} ITINERARY={ITINERARY} PARTY_THEMES={PARTY_THEMES} />
          </TabsContent>
          <TabsContent value="talent">
            <EntertainersTab onTalentClick={setSelectedTalent} TALENT={TALENT} />
          </TabsContent>
          <TabsContent value="parties">
            <PartiesTab onTalentClick={setSelectedTalent} DAILY={DAILY} PARTY_THEMES={PARTY_THEMES} ITINERARY={ITINERARY} />
          </TabsContent>
          <TabsContent value="info" className="mt-4">
            <InfoTab IMPORTANT_INFO={IMPORTANT_INFO} CRUISE_INFO={CRUISE_INFO} />
          </TabsContent>
        </main>
      </Tabs>

        {/* Footer */}
        <footer className="atlantis-gradient wave-pattern text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png" 
                alt="Atlantis Events" 
                className="h-8 w-auto mr-3 brightness-0 invert"
              />
              <div className="text-left">
                <p className="text-sm text-white/80">All-Gay Vacations Since 1991</p>
              </div>
            </div>
            <p className="text-sm text-white/80 mb-2">
              Virgin Resilient Lady • August 21-31, 2025
            </p>
            <p className="text-sm font-bold text-white/90">
              This guide was sponsored by KGay Travel
            </p>
          </div>
        </footer>

        <TalentModal
          talent={selectedTalent}
          isOpen={!!selectedTalent}
          onClose={() => setSelectedTalent(null)}
          DAILY={DAILY}
        />

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button
                onClick={scrollToTop}
                size="lg"
                className="w-12 h-12 rounded-full bg-ocean-600 hover:bg-ocean-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/20"
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}