import React, { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';

interface GlobalNotificationBellProps {
  updatesCount: number;
  hasUnread: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function GlobalNotificationBell({
  updatesCount,
  hasUnread,
  onClick,
}: GlobalNotificationBellProps) {
  const haptics = useHaptics();

  const handleClick = (e: React.MouseEvent) => {
    haptics.light();
    onClick(e);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative h-10 w-10 rounded-full text-white hover:bg-white/10"
      aria-label={`Notifications${hasUnread ? ' - unread' : ''}`}
    >
      <Bell className="w-6 h-6 text-white fill-white" />
      {hasUnread && updatesCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-slate-900">
          {updatesCount > 99 ? '99+' : updatesCount}
        </span>
      )}
    </Button>
  );
}
