import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
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
  ChevronDown,
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
  ChevronUp,
  Mail,
  Plus
} from "lucide-react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube, FaLinkedin, FaGlobe } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeToggle } from "@/components/ui/time-toggle";
import { ITINERARY, DAILY, TALENT, PARTY_THEMES, CITY_ATTRACTIONS, type Talent, type DailyEvent, type CityAttraction } from "@/data/cruise-data";


// Calendar helper functions
function createGoogleCalendarUrl(title: string, date: string, time: string, location?: string): string {
  const startDateTime = formatCalendarDateTime(date, time);
  const endDateTime = formatCalendarDateTime(date, time, 60); // Add 1 hour duration
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDateTime}/${endDateTime}`,
    details: `Atlantis Greek Isles Cruise Event`,
    location: location || 'Virgin Resilient Lady'
  });
  
  return `https://calendar.google.com/calendar/render?${params}`;
}

function handleAppleCalendarClick(title: string, date: string, time: string, location?: string) {
  const startDateTime = formatCalendarDateTime(date, time);
  const endDateTime = formatCalendarDateTime(date, time, 60);
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Atlantis Events//Greek Isles Cruise//EN
BEGIN:VEVENT
UID:${Date.now()}@atlantis-cruise.com
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${title}
DESCRIPTION:Atlantis Greek Isles Cruise Event
LOCATION:${location || 'Virgin Resilient Lady'}
END:VEVENT
END:VCALENDAR`;

  // Simple, reliable approach that works across all browsers
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.ics`;
  
  // Create a blob and use URL.createObjectURL - most compatible method
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Create temporary link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Add to DOM and trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}


function formatCalendarDateTime(dateStr: string, timeStr: string, addMinutes = 0): string {
  // Parse date from format like "Wed, Aug 20" or "August 20"
  const year = '2025';
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'January': '01', 'Feb': '02', 'February': '02', 'Mar': '03', 'March': '03', 
    'Apr': '04', 'April': '04', 'May': '05', 'Jun': '06', 'June': '06',
    'Jul': '07', 'July': '07', 'Aug': '08', 'August': '08', 'Sep': '09', 'September': '09', 
    'Oct': '10', 'October': '10', 'Nov': '11', 'November': '11', 'Dec': '12', 'December': '12'
  };
  
  // Try multiple date formats
  let dateMatch = dateStr.match(/(\w+),?\s+(\w+)\s+(\d+)/); // "Wed, Aug 20"
  if (!dateMatch) {
    dateMatch = dateStr.match(/(\w+)\s+(\d+)/); // "August 20"
    if (dateMatch) {
      dateMatch = [dateMatch[0], '', dateMatch[1], dateMatch[2]]; // Adjust for consistent indexing
    }
  }
  
  if (!dateMatch) {
    console.warn('Could not parse date:', dateStr, 'defaulting to Aug 20, 2025');
    return `20250820T120000Z`;
  }
  
  const monthName = dateMatch[2] || dateMatch[1];
  const day = dateMatch[3] || dateMatch[2];
  const month = monthMap[monthName];
  
  if (!month) {
    console.warn('Could not parse month:', monthName, 'defaulting to August');
    return `20250820T120000Z`;
  }
  
  const paddedDay = day.padStart(2, '0');
  
  // Parse time - handle both 12-hour and 24-hour formats
  let timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) {
    console.warn('Could not parse time:', timeStr, 'defaulting to 12:00');
    return `${year}${month}${paddedDay}T120000Z`;
  }
  
  let hours = parseInt(timeMatch[1], 10);
  let minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3];
  
  // Convert to 24-hour format
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  
  // Add duration minutes
  const totalMinutes = hours * 60 + minutes + addMinutes;
  const finalHours = Math.floor(totalMinutes / 60) % 24;
  const finalMinutes = totalMinutes % 60;
  
  return `${year}${month}${paddedDay}T${finalHours.toString().padStart(2, '0')}${finalMinutes.toString().padStart(2, '0')}00Z`;
}

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

function findTalentInTitle(title: string): string[] {
  return TALENT
    .filter(t => title.toLowerCase().includes(t.name.toLowerCase()))
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
  return <PartyPopper className="w-4 h-4" />;
}

interface TimelineListProps {
  events: DailyEvent[];
  timeMode: "12h" | "24h";
  onTalentClick: (name: string) => void;
  eventDate?: string;
}

function CalendarButton({ event, eventDate }: { event: DailyEvent; eventDate?: string }) {
  const [showOptions, setShowOptions] = useState(false);

  const handleGoogleCalendar = () => {
    const url = createGoogleCalendarUrl(event.title, eventDate || '', event.time, event.venue);
    window.open(url, '_blank');
    setShowOptions(false);
  };

  const handleAppleCalendar = () => {
    handleAppleCalendarClick(event.title, eventDate || '', event.time, event.venue);
    setShowOptions(false);
  };

  return (
    <div className="absolute bottom-2 right-2 z-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        className="h-8 w-8 rounded-full bg-white border-ocean-300 text-ocean-700 hover:bg-ocean-50 p-0 shadow-sm"
        title="Add to Calendar"
      >
        <Plus className="w-4 h-4" />
      </Button>
      
      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
            <button
              onClick={handleGoogleCalendar}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              Google Calendar
            </button>
            <button
              onClick={handleAppleCalendar}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-gray-800 rounded-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              Apple Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TimelineList({ events, timeMode, onTalentClick, eventDate }: TimelineListProps) {
  const sortedEvents = events.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="relative border-l border-ocean-300/40 ml-2">
      {sortedEvents.map((event, idx) => {
        const clickableNames = findTalentInTitle(event.title);
        
        const titleElement = clickableNames.length > 0 ? (
          <span>
            {event.title.split(new RegExp(`(${clickableNames.join('|')})`, 'i')).map((part, i) => {
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
            })}
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
            <Card className="p-4 bg-white hover:shadow-lg transition-all duration-300 border-2 border-gray-200 min-h-24 flex items-center">
              <div className="flex items-center gap-3 w-full">
                {/* Artist Thumbnail or KGay Logo */}
                {(clickableNames.length > 0 || event.title.includes("KGay Travel")) && (
                  <div className="flex-shrink-0">
                    {event.title.includes("KGay Travel") ? (
                      <img
                        src="https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg"
                        alt="KGay Travel"
                        className="w-12 h-12 rounded-full object-cover border-2 border-ocean-200 cursor-pointer hover:border-ocean-400 transition-colors"
                        title="Pre-Cruise Happy Hour by KGay Travel"
                      />
                    ) : (
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
                    )}
                  </div>
                )}
                
                {/* Event Content */}
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-ocean-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{formatTime(event.time, timeMode)}</span>
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
            <CalendarButton event={event} eventDate={eventDate} />
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function ItineraryTab({ timeMode, onTalentClick }: { timeMode: "12h" | "24h"; onTalentClick: (talent: Talent) => void }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityAttraction | null>(null);
  const getPortImage = (port: string, date: string) => {
    const portImages = {
      "Athens, Greece": "https://images.unsplash.com/photo-1555993539-1732b0258235?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
      "Santorini, Greece": "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200", 
      "Kuşadası, Turkey": "https://www.spotblue.com/app/uploads/2024/12/what-makes-Kusadasi-in-Turkey-special.jpg",
      "Alexandria (Cairo), Egypt": "https://cdn.mos.cms.futurecdn.net/7YrobQvFFzw8aWsAUtoYXB.jpg",
      "Mykonos, Greece": "https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
      "Iraklion, Crete": "https://www.oreotravel.com/blog/wp-content/uploads/2024/08/heraklion-old-town.jpg"
    };

    // Handle Istanbul's two different days
    if (port === "Istanbul, Turkey") {
      // First day (Aug 24) - Blue Mosque
      if (date === "Sun, Aug 24") {
        return "https://cdn-imgix.headout.com/media/images/fd89223056e350ae524f6c6120198677-Bluemosqueistanbul.jpg?auto=format&w=1222.3999999999999&h=687.6&q=90&ar=16%3A9&crop=faces&fit=crop";
      }
      // Second day (Aug 25) - Mosque panorama
      return "https://www.airpano.ru/files/mosques-istanbul-turkey/images/image1.jpg";
    }

    if (port === "Day at Sea") {
      // First sea day (Aug 26)
      if (date === "Tue, Aug 26") {
        return "https://modularassets.cdn.ignitetravel.com/modular_multisite/wp-content/uploads/sites/2/2022/03/04123250/1110x625-2023-08-04T123142.700.png";
      }
      // Second sea day (Aug 28) - Virgin Resilient Lady
      return "https://www.usatoday.com/gcdn/authoring/authoring-images/2024/02/09/USAT/72538478007-resilientlady.png?crop=1498,844,x0,y139&width=1498&height=749&format=pjpg&auto=webp";
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
              <Card className="p-6 hover:shadow-xl transition-shadow duration-200 bg-white/90 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-ocean-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{stop.port}</h3>
                        <p className="text-sm text-gray-500">{stop.date}</p>
                      </div>
                    </div>
                    
                    {getPortImage(stop.port, stop.date) && (
                      <img 
                        src={getPortImage(stop.port, stop.date)} 
                        alt={stop.port} 
                        className="w-full h-48 object-cover rounded-lg mb-4 shadow-md"
                        onError={(e) => {
                          // Fallback to a default cruise ship image if the specific image fails
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200";
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="md:ml-6 md:text-right">
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Arrive</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTime(stop.arrive, timeMode)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Depart</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTime(stop.depart, timeMode)}
                        </p>
                      </div>
                    </div>
                    
                    {!isSea && stop.depart !== "—" && !isOvernight && (
                      <div className="p-3 bg-gold/10 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">All Aboard</p>
                        <p className="text-sm font-semibold text-yellow-600">
                          {formatAllAboard(stop.depart, timeMode)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 italic">
                          *Please confirm with official Virgin announcements on board
                        </p>
                      </div>
                    )}
                    
                    {isOvernight && (
                      <div className="p-3 bg-coral/10 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Extended Port</p>
                        <p className="text-sm font-semibold text-coral">Overnight Stay</p>
                      </div>
                    )}
                    
                    {isSea && (
                      <div className="p-3 bg-ocean-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Sea Day</p>
                        <p className="text-sm font-semibold text-ocean-600">Relax & Enjoy</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => setSelectedDay(stop.key)}
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none border-ocean-300 text-ocean-700 hover:bg-ocean-50"
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
                            className="flex-1 md:flex-none border-ocean-300 text-ocean-700 hover:bg-ocean-50"
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
                const dayEvents = DAILY.find(d => d.key === selectedDay);
                const handleTalentClick = (name: string) => {
                  const talent = TALENT.find(t => t.name.toLowerCase() === name.toLowerCase());
                  if (talent) {
                    setSelectedDay(null);
                    onTalentClick(talent);
                  }
                };
                
                return dayEvents && dayEvents.items.length > 0 ? (
                  <TimelineList 
                    events={dayEvents.items} 
                    timeMode={timeMode} 
                    onTalentClick={handleTalentClick}
                    eventDate={ITINERARY.find(i => i.key === selectedDay)?.date}
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

function EntertainmentTab({ timeMode, onTalentClick }: { timeMode: "12h" | "24h"; onTalentClick: (talent: Talent) => void }) {
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
          const allEvents = day.items;
          
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
                        <span>Arrive: {formatTime(itinerary.arrive, timeMode)}</span>
                      )}
                      {itinerary.arrive !== "—" && itinerary.depart !== "—" && <span>•</span>}
                      {itinerary.depart !== "—" && (
                        <span>Depart: {formatTime(itinerary.depart, timeMode)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {allEvents.length > 0 ? (
                <TimelineList 
                  events={allEvents} 
                  timeMode={timeMode} 
                  onTalentClick={handleTalentClick}
                  eventDate={selectedDate === "all" ? undefined : dates.find(d => d.key === selectedDate)?.label}
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

function EntertainersTab({ onTalentClick }: { onTalentClick: (talent: Talent) => void }) {
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

function PartiesTab({ timeMode, onTalentClick }: { timeMode: "12h" | "24h"; onTalentClick: (talent: Talent) => void }) {
  const partyEventsByDay = DAILY.reduce((acc, day) => {
    const itinerary = ITINERARY.find(i => i.key === day.key);
    const parties = day.items
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
                    <span>Depart: {formatTime(dayData.depart, timeMode)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {dayData.parties.map((party, idx) => (
                <motion.div
                  key={`${party.title}-${party.time}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className="bg-white p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 overflow-hidden relative h-48 flex flex-col">
                    <div className="relative z-10 flex flex-col h-full">
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
                          <p className="text-gray-600 text-xs leading-relaxed italic line-clamp-3">{party.themeDesc}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200 px-2 py-1 font-medium text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(party.time, timeMode)}
                        </Badge>
                        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200 px-2 py-1 font-medium text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {party.venue}
                        </Badge>
                      </div>
                    </div>
                    <CalendarButton event={party} eventDate={dayData.date} />
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

function InfoTab() {
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

function TalentCalendarButton({ appearance }: { appearance: { date: string; time: string; venue: string; title: string } }) {
  const [showOptions, setShowOptions] = useState(false);

  const handleGoogleCalendar = () => {
    const url = createGoogleCalendarUrl(appearance.title, appearance.date, appearance.time, appearance.venue);
    window.open(url, '_blank');
    setShowOptions(false);
  };

  const handleAppleCalendar = () => {
    handleAppleCalendarClick(appearance.title, appearance.date, appearance.time, appearance.venue);
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        className="h-6 w-6 rounded-full bg-white border-ocean-300 text-ocean-700 hover:bg-ocean-50 p-0 shadow-sm"
        title="Add to Calendar"
      >
        <Plus className="w-3 h-3" />
      </Button>
      
      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
            <button
              onClick={handleGoogleCalendar}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              Google Calendar
            </button>
            <button
              onClick={handleAppleCalendar}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-gray-800 rounded-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              Apple Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TalentModal({ talent, isOpen, onClose }: { talent: Talent | null; isOpen: boolean; onClose: () => void }) {
  if (!talent) return null;

  const appearances = DAILY.reduce((acc, day) => {
    day.items.forEach(item => {
      if (item.title.toLowerCase().includes(talent.name.toLowerCase())) {
        const itinerary = ITINERARY.find(i => i.key === day.key);
        acc.push({
          date: itinerary?.date || day.key,
          time: item.time,
          venue: item.venue,
          title: item.title
        });
      }
    });
    return acc;
  }, [] as Array<{ date: string; time: string; venue: string; title: string }>);

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
                <Images className="h-10 w-10 text-ocean-300" />
              )}
            </div>
          </div>
          
          <div className="sm:col-span-2 space-y-4">
            <div>
              <h5 className="text-gray-900 font-semibold mb-2">Bio</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{talent.bio}</p>
            </div>

            {/* Social Media Links */}
            {talent.social && Object.keys(talent.social).length > 0 && (
              <div>
                <h5 className="text-gray-900 font-semibold mb-2">Follow {talent.name}</h5>
                <div className="flex flex-wrap gap-2">
                  {talent.social.instagram && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaInstagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {talent.social.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaTwitter className="h-4 w-4 text-blue-500" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {talent.social.tiktok && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaTiktok className="h-4 w-4 text-black" />
                        TikTok
                      </a>
                    </Button>
                  )}
                  {talent.social.youtube && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaYoutube className="h-4 w-4 text-red-500" />
                        YouTube
                      </a>
                    </Button>
                  )}
                  {talent.social.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaLinkedin className="h-4 w-4 text-blue-600" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {talent.social.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FaGlobe className="h-4 w-4 text-gray-600" />
                        Website
                      </a>
                    </Button>
                  )}
                  {talent.social.linktree && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={talent.social.linktree} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <SiLinktree className="h-4 w-4 text-green-500" />
                        Linktree
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h5 className="text-gray-900 font-semibold mb-2">Appearances on This Cruise</h5>
              {appearances.length === 0 ? (
                <p className="text-sm text-gray-500">No direct listings found.</p>
              ) : (
                <div className="space-y-2">
                  {appearances.map((app, i) => (
                    <div key={i} className="text-sm text-gray-700 p-2 bg-gray-50 rounded flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-ocean-600 font-medium">{app.date}</span> • {app.time} @ {app.venue}
                        <div className="text-gray-600">{app.title}</div>
                      </div>
                      <TalentCalendarButton appearance={app} />
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

export default function CruiseGuide() {
  const [timeMode, setTimeMode] = useLocalStorage<"12h" | "24h">("cruise_time_mode", "12h");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      {/* Header */}
      <header className="cruise-gradient wave-pattern text-white shadow-xl fixed top-0 left-0 right-0 z-50 bg-ocean-600 opacity-100">
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
              <p className="text-white/80 text-base">
                August 21-31, 2025
              </p>
            </div>
            <div className="flex-1"></div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center items-center gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
              <div className="grid grid-cols-5 gap-1">
                <Button
                  variant={activeTab === "itinerary" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("itinerary")}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    activeTab === "itinerary" ? "bg-ocean-700 text-white hover:bg-ocean-800" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Itinerary</span>
                </Button>
                <Button
                  variant={activeTab === "entertainment" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("entertainment")}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    activeTab === "entertainment" ? "bg-ocean-700 text-white hover:bg-ocean-800" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Events</span>
                </Button>
                <Button
                  variant={activeTab === "entertainers" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("entertainers")}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    activeTab === "entertainers" ? "bg-ocean-700 text-white hover:bg-ocean-800" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span className="hidden sm:inline">Entertainers</span>
                </Button>
                <Button
                  variant={activeTab === "parties" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("parties")}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    activeTab === "parties" ? "bg-ocean-700 text-white hover:bg-ocean-800" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <PartyPopper className="w-4 h-4" />
                  <span className="hidden sm:inline">Parties</span>
                </Button>
                <Button
                  variant={activeTab === "info" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("info")}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    activeTab === "info" ? "bg-ocean-700 text-white hover:bg-ocean-800" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">Info</span>
                </Button>
              </div>
            </div>
            <div className="ml-4">
              <TimeToggle timeMode={timeMode} onToggle={setTimeMode} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-[25px] pb-[25px]">
        {activeTab === "itinerary" && <ItineraryTab timeMode={timeMode} onTalentClick={setSelectedTalent} />}
        {activeTab === "entertainment" && <EntertainmentTab timeMode={timeMode} onTalentClick={setSelectedTalent} />}
        {activeTab === "entertainers" && <EntertainersTab onTalentClick={setSelectedTalent} />}
        {activeTab === "parties" && <PartiesTab timeMode={timeMode} onTalentClick={setSelectedTalent} />}
        {activeTab === "info" && <InfoTab />}
      </main>

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
