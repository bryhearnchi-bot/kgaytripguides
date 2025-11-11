import React from 'react';

interface StandardizedContentLayoutProps {
  children: React.ReactNode;
}

export function StandardizedContentLayout({ children }: StandardizedContentLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pb-24 xl:pb-8">{children}</div>
    </div>
  );
}
