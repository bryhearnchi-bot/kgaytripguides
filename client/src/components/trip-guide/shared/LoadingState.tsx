import React, { memo } from "react";

export const LoadingState = memo(function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-xl">Loading trip guide...</p>
      </div>
    </div>
  );
});