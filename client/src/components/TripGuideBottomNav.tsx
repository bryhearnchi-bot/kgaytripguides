import React from 'react';
import {
  Map,
  CalendarDays,
  PartyPopper,
  Star,
  Info,
  HelpCircle,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripGuideBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCruise: boolean;
}

export function TripGuideBottomNav({ activeTab, onTabChange, isCruise }: TripGuideBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10001] xl:hidden pointer-events-none">
      <div
        className="flex justify-center px-4 pb-4"
        style={{ paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 8px))' }}
      >
        <nav className="bg-white/35 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20 pointer-events-auto">
          <button
            onClick={() => onTabChange('overview')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'overview' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Overview"
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'overview' && 'inline md:inline'
              )}
            >
              Overview
            </span>
          </button>
          <button
            onClick={() => onTabChange('itinerary')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'itinerary'
                ? 'bg-white/60 text-black'
                : 'text-black hover:text-black/80'
            }`}
            aria-label={isCruise ? 'Itinerary' : 'Schedule'}
          >
            <Map className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'itinerary' && 'inline md:inline'
              )}
            >
              {isCruise ? 'Itinerary' : 'Schedule'}
            </span>
          </button>
          <button
            onClick={() => onTabChange('schedule')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'schedule' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Events"
          >
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'schedule' && 'inline md:inline'
              )}
            >
              Events
            </span>
          </button>
          <button
            onClick={() => onTabChange('parties')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'parties' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Parties"
          >
            <PartyPopper className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'parties' && 'inline md:inline'
              )}
            >
              Parties
            </span>
          </button>
          <button
            onClick={() => onTabChange('talent')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'talent' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Talent"
          >
            <Star className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'talent' && 'inline md:inline'
              )}
            >
              Talent
            </span>
          </button>
          <button
            onClick={() => onTabChange('info')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'info' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Info"
          >
            <Info className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'info' && 'inline md:inline'
              )}
            >
              Info
            </span>
          </button>
          <button
            onClick={() => onTabChange('faq')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'faq' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="FAQ"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'faq' && 'inline md:inline'
              )}
            >
              FAQ
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
