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
import { StandardizedHero } from "@/components/StandardizedHero";


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