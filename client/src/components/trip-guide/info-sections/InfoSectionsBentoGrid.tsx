import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { InfoSectionCard } from './InfoSectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InfoSection {
  id: number;
  title: string;
  content: string | null;
  section_type: 'trip_specific' | 'general' | 'always';
  updated_by: string | null;
  updated_at: string;
  assignment_id: number | null;
  order_index: number;
  is_always: boolean;
  is_assigned: boolean;
}

interface InfoSectionsBentoGridProps {
  tripId: number;
}

export function InfoSectionsBentoGrid({ tripId }: InfoSectionsBentoGridProps) {
  const {
    data: sections,
    isLoading,
    error,
  } = useQuery<InfoSection[]>({
    queryKey: ['trip-info-sections-comprehensive', tripId],
    queryFn: async () => {
      const response = await fetch(`/api/trip-info-sections/trip/${tripId}/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip info sections');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading trip information</AlertTitle>
        <AlertDescription>
          Unable to load trip information sections. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No information available</AlertTitle>
        <AlertDescription>There are no information sections for this trip yet.</AlertDescription>
      </Alert>
    );
  }

  // Sort sections: always first, then by order_index, then by title
  const sortedSections = [...sections].sort((a, b) => {
    // Always sections first
    if (a.is_always && !b.is_always) return -1;
    if (!a.is_always && b.is_always) return 1;

    // Then by order_index
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }

    // Then alphabetically by title
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedSections.map(section => (
        <InfoSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}
