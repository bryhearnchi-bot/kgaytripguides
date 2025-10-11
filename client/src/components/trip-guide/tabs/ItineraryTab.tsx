import React, { memo } from 'react';
import { Map } from 'lucide-react';
import JobListingComponent, { type Job } from '@/components/smoothui/ui/JobListingComponent';

interface ItineraryTabProps {
  ITINERARY: any[];
  onViewEvents: (dateKey: string, portName: string) => void;
}

export const ItineraryTab = memo(function ItineraryTab({
  ITINERARY,
  onViewEvents,
}: ItineraryTabProps) {
  // Transform itinerary data to Job format for the component
  const jobsData: Job[] = ITINERARY.map(stop => {
    // Check if this is a pre-trip or post-trip day
    const isPreOrPostTrip = stop.day < 0 || stop.day >= 100;

    return {
      company: stop.port,
      title: stop.date,
      logo: (
        <img
          src={
            stop.imageUrl ||
            'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
          }
          alt={stop.port}
          className="w-52 h-32 object-cover rounded"
          loading="lazy"
          onError={e => {
            e.currentTarget.src =
              'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
          }}
        />
      ),
      job_description: stop.description || 'Description coming soon',
      salary: isPreOrPostTrip ? '' : `Arrive: ${stop.arrive}`,
      location: `Depart: ${stop.depart}`,
      remote: stop.allAboard ? `All Aboard: ${stop.allAboard}` : '',
      job_time: stop.key,
      dayNumber: stop.day,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
      <div className="flex items-center space-x-2 mb-6 -mt-2">
        <Map className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Itinerary</h2>
      </div>
      {ITINERARY.length === 0 ? (
        <div className="bg-white/85 backdrop-blur-sm rounded-md p-6 shadow-sm text-center py-8 border border-white/30">
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary available</h3>
          <p className="text-gray-500">Itinerary information will be available soon.</p>
        </div>
      ) : (
        <JobListingComponent jobs={jobsData} />
      )}
    </div>
  );
});
