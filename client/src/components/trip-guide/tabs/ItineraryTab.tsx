import React, { memo } from 'react';
import { Map } from 'lucide-react';
import JobListingComponent, { type Job } from '@/components/smoothui/ui/JobListingComponent';

interface ItineraryTabProps {
  ITINERARY: any[];
  onViewEvents: (dateKey: string, portName: string) => void;
  scheduledDaily?: any[];
  talent?: any[];
}

export const ItineraryTab = memo(function ItineraryTab({
  ITINERARY,
  onViewEvents,
  scheduledDaily,
  talent,
}: ItineraryTabProps) {
  // Transform itinerary data to Job format for the component
  const jobsData: Job[] = ITINERARY.map((stop, index) => {
    // Determine location type based on locationTypeId
    // Location type IDs from database:
    // 1=Embarkation, 2=Disembarkation, 3=Port, 4=Day at Sea
    // 6=Pre-Cruise, 7=Post-Cruise
    // 8=Overnight Port (Arrival), 9=Overnight Port (Depart), 10=Overnight Port (Full-Day)
    // 11=Overnight Arrival, 12=Overnight Departure, 13=Overnight Full Day
    const isEmbarkation = stop.locationTypeId === 1;
    const isDisembarkation = stop.locationTypeId === 2;
    const isOvernightArrival = stop.locationTypeId === 8 || stop.locationTypeId === 11;
    const isOvernightDeparture = stop.locationTypeId === 9 || stop.locationTypeId === 12;
    const isFullDayOvernight = stop.locationTypeId === 10 || stop.locationTypeId === 13;
    const isPreCruise = stop.day < 0;
    const isPostCruise = stop.day >= 100;

    // Build port name with suffix
    let portName = stop.port;
    let arriveDepart = '';
    let allAboard = '';

    if (isPreCruise || isPostCruise) {
      // Pre-cruise and post-cruise: just port name, no times
      portName = stop.port;
      arriveDepart = '';
      allAboard = '';
    } else if (isEmbarkation) {
      // Embarkation: add suffix and show only depart time
      portName = `${stop.port} - Embarkation`;
      arriveDepart = stop.depart && stop.depart !== '—' ? `Depart: ${stop.depart}` : '';
    } else if (isDisembarkation) {
      // Disembarkation: add suffix and show only arrival time
      portName = `${stop.port} - Disembarkation`;
      arriveDepart = stop.arrive && stop.arrive !== '—' ? `Arrive: ${stop.arrive}` : '';
    } else if (isOvernightArrival) {
      // Overnight arrival: add suffix, show only arrival time, no all aboard
      portName = `${stop.port} - Overnight`;
      arriveDepart = stop.arrive && stop.arrive !== '—' ? `Arrive: ${stop.arrive}` : '';
      allAboard = '';
    } else if (isOvernightDeparture) {
      // Overnight departure: NO suffix, show depart time and all aboard
      portName = stop.port;
      arriveDepart = stop.depart && stop.depart !== '—' ? `Depart: ${stop.depart}` : '';
      allAboard = stop.allAboard || '';
    } else if (isFullDayOvernight) {
      // Full day overnight: add suffix, no times shown
      portName = `${stop.port} - Overnight Full Day`;
      arriveDepart = '';
      allAboard = '';
    } else {
      // Regular port: show both arrive and depart
      const hasTimes = (stop.arrive && stop.arrive !== '—') || (stop.depart && stop.depart !== '—');
      if (hasTimes) {
        const arriveText = stop.arrive && stop.arrive !== '—' ? `Arrive: ${stop.arrive}` : '';
        const departText = stop.depart && stop.depart !== '—' ? `Depart: ${stop.depart}` : '';
        arriveDepart = [arriveText, departText].filter(Boolean).join(' • ');
      }
      allAboard = stop.allAboard || '';
    }

    return {
      company: portName,
      title: stop.date,
      logo: (
        <img
          src={
            stop.imageUrl ||
            'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
          }
          alt={stop.port}
          className="w-32 h-20 sm:w-52 sm:h-32 object-cover rounded"
          loading="lazy"
          onError={e => {
            e.currentTarget.src =
              'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
          }}
        />
      ),
      job_description: stop.description || 'Description coming soon',
      salary: arriveDepart,
      location: '', // Not used anymore, arrive/depart combined in salary
      remote: allAboard,
      job_time: stop.key,
      dayNumber: stop.day,
      // Add attractions and LGBT venues data
      attractions: stop.attractions || [],
      lgbtVenues: stop.lgbtVenues || [],
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
      <div className="flex items-center space-x-2 mb-6 -mt-2">
        <Map className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Itinerary</h2>
      </div>
      {ITINERARY.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <Map className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No itinerary available</h3>
          <p className="text-white/70">Itinerary information will be available soon.</p>
        </div>
      ) : (
        <JobListingComponent
          jobs={jobsData}
          onViewEvents={onViewEvents}
          scheduledDaily={scheduledDaily}
          talent={talent}
        />
      )}
    </div>
  );
});
