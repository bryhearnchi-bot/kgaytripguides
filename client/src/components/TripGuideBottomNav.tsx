import React from 'react';
import {
  Map,
  CalendarDays,
  PartyPopper,
  Star,
  Info,
  HelpCircle,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

interface TripGuideBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCruise: boolean;
}

export function TripGuideBottomNav({ activeTab, onTabChange, isCruise }: TripGuideBottomNavProps) {
  const { user } = useSupabaseAuthContext();

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
            aria-label="Itinerary"
          >
            <Map className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'itinerary' && 'inline md:inline'
              )}
            >
              Itinerary
            </span>
          </button>
          <button
            onClick={() => onTabChange('events')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'events' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Events"
          >
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'events' && 'inline md:inline'
              )}
            >
              Events
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
            aria-label="Information"
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
            onClick={() => onTabChange('settings')}
            className={`px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
              activeTab === 'settings' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            }`}
            aria-label="Settings"
          >
            <User
              className={cn(
                'w-4 h-4 flex-shrink-0',
                activeTab === 'settings' && user
                  ? 'fill-black stroke-black'
                  : user
                    ? 'fill-blue-600 stroke-blue-600'
                    : ''
              )}
            />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'settings' && 'inline md:inline'
              )}
            >
              Settings
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
