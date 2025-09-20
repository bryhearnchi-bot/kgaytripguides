import React from 'react';

interface MobileSkeletonProps {
  variant?: 'card' | 'list' | 'form' | 'profile' | 'navigation' | 'custom';
  count?: number;
  className?: string;
  height?: string;
  width?: string;
  animated?: boolean;
}

export function MobileSkeleton({
  variant = 'card',
  count = 1,
  className = '',
  height,
  width,
  animated = true
}: MobileSkeletonProps) {
  const baseClasses = `bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`;

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`mobile-card ${className}`}>
            <div className="mobile-card-content space-y-3">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
              <div className="flex gap-2">
                <div className={`${baseClasses} h-6 w-16`} />
                <div className={`${baseClasses} h-6 w-20`} />
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`flex items-center space-x-3 p-3 ${className}`}>
            <div className={`${baseClasses} w-10 h-10 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
            <div className={`${baseClasses} h-8 w-8 rounded`} />
          </div>
        );

      case 'form':
        return (
          <div className={`space-y-4 ${className}`}>
            <div className="space-y-2">
              <div className={`${baseClasses} h-4 w-20`} />
              <div className={`${baseClasses} h-12 w-full rounded-lg`} />
            </div>
            <div className="space-y-2">
              <div className={`${baseClasses} h-4 w-24`} />
              <div className={`${baseClasses} h-12 w-full rounded-lg`} />
            </div>
            <div className="space-y-2">
              <div className={`${baseClasses} h-4 w-28`} />
              <div className={`${baseClasses} h-24 w-full rounded-lg`} />
            </div>
            <div className={`${baseClasses} h-12 w-full rounded-lg mt-6`} />
          </div>
        );

      case 'profile':
        return (
          <div className={`text-center space-y-4 ${className}`}>
            <div className={`${baseClasses} w-20 h-20 rounded-full mx-auto`} />
            <div className="space-y-2">
              <div className={`${baseClasses} h-6 w-32 mx-auto`} />
              <div className={`${baseClasses} h-4 w-24 mx-auto`} />
            </div>
            <div className="flex justify-center gap-2">
              <div className={`${baseClasses} h-8 w-20 rounded-full`} />
              <div className={`${baseClasses} h-8 w-20 rounded-full`} />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className={`space-y-1 ${className}`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <div className={`${baseClasses} w-6 h-6 rounded`} />
                <div className={`${baseClasses} h-4 flex-1`} />
              </div>
            ))}
          </div>
        );

      case 'custom':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{
              height: height || '1rem',
              width: width || '100%'
            }}
          />
        );

      default:
        return (
          <div className={`${baseClasses} h-4 w-full ${className}`} />
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="mobile-skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}

// Specialized mobile skeleton components
export function MobileCardSkeleton({ count = 3 }: { count?: number }) {
  return <MobileSkeleton variant="card" count={count} />;
}

export function MobileListSkeleton({ count = 5 }: { count?: number }) {
  return <MobileSkeleton variant="list" count={count} />;
}

export function MobileFormSkeleton() {
  return <MobileSkeleton variant="form" />;
}

export function MobileProfileSkeleton() {
  return <MobileSkeleton variant="profile" />;
}

export function MobileNavigationSkeleton() {
  return <MobileSkeleton variant="navigation" />;
}

// Data table specific skeleton
export function MobileDataTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Search skeleton */}
      <div className="mobile-skeleton animate-pulse bg-gray-200 h-12 w-full rounded-lg" />

      {/* Card skeletons */}
      <MobileCardSkeleton count={5} />

      {/* Results summary skeleton */}
      <div className="text-center">
        <div className="mobile-skeleton animate-pulse bg-gray-200 h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

// Admin dashboard skeleton
export function MobileDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="mobile-grid-responsive">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mobile-card">
            <div className="mobile-card-content space-y-2">
              <div className="mobile-skeleton animate-pulse bg-gray-200 h-8 w-16" />
              <div className="mobile-skeleton animate-pulse bg-gray-200 h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent items */}
      <div className="mobile-card">
        <div className="mobile-card-content">
          <div className="mobile-skeleton animate-pulse bg-gray-200 h-6 w-32 mb-4" />
          <MobileListSkeleton count={3} />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="mobile-card">
        <div className="mobile-card-content">
          <div className="mobile-skeleton animate-pulse bg-gray-200 h-6 w-40 mb-4" />
          <div className="mobile-skeleton animate-pulse bg-gray-200 h-64 w-full rounded" />
        </div>
      </div>
    </div>
  );
}