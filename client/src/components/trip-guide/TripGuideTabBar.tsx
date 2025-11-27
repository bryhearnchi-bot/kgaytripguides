import React from 'react';
import { Map, CalendarDays, Star, Info, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

export type TripGuideTab = 'overview' | 'itinerary' | 'events' | 'talent' | 'info' | 'settings';

interface TripGuideTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  updateAvailable: boolean;
}

interface TabButtonProps {
  tab: TripGuideTab;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  showUpdateBadge?: boolean;
}

const TabButton = React.memo(function TabButton({
  icon,
  label,
  isActive,
  onClick,
  showUpdateBadge,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
        isActive ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
      }`}
      aria-label={label}
    >
      <div className="relative">
        {icon}
        {showUpdateBadge && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      <span className="hidden sm:inline">{label}</span>
      {isActive && <span className="sm:hidden">{label}</span>}
    </button>
  );
});

export const TripGuideTabBar = React.memo(function TripGuideTabBar({
  activeTab,
  onTabChange,
  isLoggedIn,
  updateAvailable,
}: TripGuideTabBarProps) {
  const haptics = useHaptics();

  const handleTabClick = (tab: TripGuideTab) => {
    haptics.light();
    onTabChange(tab);
  };

  const tabs: { tab: TripGuideTab; icon: React.ReactNode; label: string }[] = [
    {
      tab: 'overview',
      icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" />,
      label: 'Overview',
    },
    { tab: 'itinerary', icon: <Map className="w-4 h-4 flex-shrink-0" />, label: 'Itinerary' },
    { tab: 'events', icon: <CalendarDays className="w-4 h-4 flex-shrink-0" />, label: 'Events' },
    { tab: 'talent', icon: <Star className="w-4 h-4 flex-shrink-0" />, label: 'Talent' },
    { tab: 'info', icon: <Info className="w-4 h-4 flex-shrink-0" />, label: 'Information' },
  ];

  return (
    <div className="flex justify-center items-center mb-8 pt-8 sm:pt-16 lg:pt-16">
      <div className="bg-white/10 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20">
        {tabs.map(({ tab, icon, label }) => (
          <TabButton
            key={tab}
            tab={tab}
            icon={icon}
            label={label}
            isActive={activeTab === tab}
            onClick={() => handleTabClick(tab)}
          />
        ))}
        <button
          onClick={() => handleTabClick('settings')}
          className="px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] text-white/70 hover:text-white relative"
          aria-label="Settings"
        >
          <div className="relative">
            <UserIcon
              className={cn(
                'w-4 h-4 flex-shrink-0',
                isLoggedIn ? 'fill-blue-600 stroke-blue-600' : ''
              )}
            />
            {updateAvailable && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
});
