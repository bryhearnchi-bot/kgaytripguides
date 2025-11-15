import React, { useRef } from 'react';
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
  const navRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10001] xl:hidden">
      <nav
        ref={navRef}
        className="bg-white/30 backdrop-blur-lg border-t border-white/30"
        style={{
          paddingBottom: 'var(--nav-bottom-padding, 0px)',
        }}
      >
        <div className="flex items-center max-w-2xl mx-auto pt-1.5 px-3">
          <button
            onClick={() => onTabChange('overview')}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
              activeTab === 'overview'
                ? 'text-blue-900 bg-white/40'
                : 'text-black opacity-60 hover:opacity-100'
            )}
          >
            <LayoutDashboard className="w-[24px] h-[24px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Overview</span>
          </button>
          <button
            onClick={() => onTabChange('itinerary')}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
              activeTab === 'itinerary'
                ? 'text-blue-900 bg-white/40'
                : 'text-black opacity-60 hover:opacity-100'
            )}
          >
            <Map className="w-[24px] h-[24px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Itinerary</span>
          </button>

          <button
            onClick={() => onTabChange('events')}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
              activeTab === 'events'
                ? 'text-blue-900 bg-white/40'
                : 'text-black opacity-60 hover:opacity-100'
            )}
          >
            <CalendarDays className="w-[24px] h-[24px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Events</span>
          </button>

          <button
            onClick={() => onTabChange('talent')}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
              activeTab === 'talent'
                ? 'text-blue-900 bg-white/40'
                : 'text-black opacity-60 hover:opacity-100'
            )}
          >
            <Star className="w-[24px] h-[24px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Talent</span>
          </button>

          <button
            onClick={() => onTabChange('info')}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
              activeTab === 'info'
                ? 'text-blue-900 bg-white/40'
                : 'text-black opacity-60 hover:opacity-100'
            )}
          >
            <Info className="w-[24px] h-[24px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Info</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
