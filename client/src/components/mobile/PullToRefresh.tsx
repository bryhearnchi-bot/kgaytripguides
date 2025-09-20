import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh'
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setCanPull(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!canPull || disabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) * 0.5);

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!canPull || disabled || isRefreshing) return;

    setCanPull(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  });

  const getRefreshText = () => {
    if (isRefreshing) return refreshingText;
    if (pullDistance >= threshold) return releaseText;
    return pullText;
  };

  const getRotation = () => {
    if (isRefreshing) return 'animate-spin';
    return `rotate(${Math.min(pullDistance * 2, 180)}deg)`;
  };

  const refreshOpacity = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative overflow-auto mobile-scroll-smooth">
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center text-gray-600 transition-all duration-200 z-10"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
          opacity: isRefreshing ? 1 : refreshOpacity,
          transform: `translateY(-${isRefreshing ? 0 : Math.max(60 - pullDistance, 0)}px)`
        }}
      >
        <RefreshCw
          className={`w-6 h-6 transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${Math.min(pullDistance * 2, 180)}deg)`
          }}
        />
        <div className="text-sm font-medium mt-2">
          {getRefreshText()}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}