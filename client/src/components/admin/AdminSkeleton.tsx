import { Skeleton } from '@/components/ui/skeleton';

interface AdminSkeletonProps {
  rows?: number;
  showHeader?: boolean;
  showActions?: boolean;
}

export function AdminTableSkeleton({
  rows = 5,
  showHeader = true,
  showActions = true
}: AdminSkeletonProps) {
  return (
    <div className="space-y-8">
      {/* Header Section Skeleton */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-96 bg-white/10" />
          </div>
          <Skeleton className="h-11 w-32 bg-white/10 rounded-full" />
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-11 flex-1 bg-white/10 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 bg-white/10 rounded-full" />
            <Skeleton className="h-9 w-16 bg-white/10 rounded-full" />
            <Skeleton className="h-9 w-16 bg-white/10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Table Section Skeleton */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        {showHeader && (
          <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </header>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header */}
            <div className="bg-white/5 border-b border-white/10 px-6 py-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="h-4 w-16 bg-white/10" />
                {showActions && <Skeleton className="h-4 w-16 bg-white/10 ml-auto" />}
              </div>
            </div>

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 bg-white/10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-white/10" />
                      <Skeleton className="h-3 w-48 bg-white/10" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-6 w-20 bg-white/10 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-6 w-16 bg-white/10 rounded-full" />
                  </div>
                  {showActions && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Skeleton className="h-8 w-8 bg-white/10 rounded-full" />
                      <Skeleton className="h-8 w-8 bg-white/10 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-white/10 px-6 py-4">
          <Skeleton className="h-3 w-32 bg-white/10" />
        </footer>
      </section>
    </div>
  );
}

export function AdminCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-8">
      {/* Header Section Skeleton */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-96 bg-white/10" />
          </div>
          <Skeleton className="h-11 w-32 bg-white/10 rounded-full" />
        </div>
      </section>

      {/* Cards Grid Skeleton */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-[#10192f]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 bg-white/10 rounded-xl flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-full bg-white/10" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-full bg-white/10" />
                  <Skeleton className="h-3 w-5/6 bg-white/10" />
                  <Skeleton className="h-3 w-4/6 bg-white/10" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-6 w-16 bg-white/10 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 bg-white/10 rounded-full" />
                    <Skeleton className="h-8 w-8 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}