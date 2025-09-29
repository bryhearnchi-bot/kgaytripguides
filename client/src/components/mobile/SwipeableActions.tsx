import React, { useState, useRef, ReactNode } from 'react';

interface SwipeAction {
  id: string;
  label: string;
  icon: ReactNode;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  onAction: () => void;
}

interface SwipeableActionsProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
}

const colorClasses = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  purple: 'bg-purple-500 text-white'
};

export function SwipeableActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false
}: SwipeableActionsProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0]?.clientX ?? 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0]?.clientX ?? 0;
    const deltaX = currentX - startX;

    // Limit swipe distance
    const maxSwipe = 200;
    const limitedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));

    setSwipeX(limitedDeltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    // Check if threshold is met
    if (Math.abs(swipeX) > threshold) {
      // Trigger action based on swipe direction
      if (swipeX > 0 && leftActions.length > 0) {
        // Swiped right, trigger first left action
        leftActions[0]?.onAction();
      } else if (swipeX < 0 && rightActions.length > 0) {
        // Swiped left, trigger first right action
        rightActions[0]?.onAction();
      }
    }

    // Reset position
    setSwipeX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.clientX;
    const deltaX = currentX - startX;

    const maxSwipe = 200;
    const limitedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));

    setSwipeX(limitedDeltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    if (Math.abs(swipeX) > threshold) {
      if (swipeX > 0 && leftActions.length > 0) {
        leftActions[0]?.onAction();
      } else if (swipeX < 0 && rightActions.length > 0) {
        rightActions[0]?.onAction();
      }
    }

    setSwipeX(0);
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    const isVisible = side === 'left' ? swipeX > 0 : swipeX < 0;
    const opacity = Math.min(1, Math.abs(swipeX) / threshold);

    return (
      <div
        className={`absolute top-0 bottom-0 flex items-center ${
          side === 'left' ? 'left-0' : 'right-0'
        }`}
        style={{
          width: Math.abs(swipeX),
          opacity: isVisible ? opacity : 0,
          transition: isDragging ? 'none' : 'opacity 0.2s ease'
        }}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 px-4 ${
              colorClasses[action.color]
            } transition-colors`}
            onClick={(e) => {
              e.stopPropagation();
              action.onAction();
            }}
          >
            <div className="text-lg">{action.icon}</div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Actions */}
      {renderActions(leftActions, 'left')}

      {/* Right Actions */}
      {renderActions(rightActions, 'right')}

      {/* Main Content */}
      <div
        className="relative z-10 bg-white transition-transform"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
      >
        {children}
      </div>

      {/* Swipe Hint */}
      {!disabled && (leftActions.length > 0 || rightActions.length > 0) && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 pointer-events-none">
          {leftActions.length > 0 && rightActions.length > 0 ? '← → Swipe' :
           leftActions.length > 0 ? '→ Swipe' : '← Swipe'}
        </div>
      )}
    </div>
  );
}