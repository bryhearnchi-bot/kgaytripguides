import React from "react";

interface StandardizedTabContainerProps {
  children: React.ReactNode;
}

export function StandardizedTabContainer({ children }: StandardizedTabContainerProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
      {children}
    </div>
  );
}