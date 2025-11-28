import React from 'react';

interface StandardizedContentLayoutProps {
  children: React.ReactNode;
}

export function StandardizedContentLayout({ children }: StandardizedContentLayoutProps) {
  return (
    <div className="min-h-screen page-overflow-hidden">
      {/* Bottom padding: pb-32 for mobile/tablet (bottom nav), xl:pb-8 for desktop (top nav only) */}
      <div className="max-w-7xl mx-auto px-4 pb-32 xl:pb-8">{children}</div>
    </div>
  );
}
