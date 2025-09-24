import React from "react";

interface StandardizedContentLayoutProps {
  children: React.ReactNode;
}

export function StandardizedContentLayout({ children }: StandardizedContentLayoutProps) {
  return (
    <div className="bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pt-[40px] pb-8">
        {children}
      </div>
    </div>
  );
}