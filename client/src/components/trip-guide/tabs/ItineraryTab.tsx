import React, { memo, useMemo } from 'react';
import { Map } from 'lucide-react';
import JobListingComponent, { type Job } from '@/components/smoothui/ui/JobListingComponent';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';

interface ItineraryTabProps {
  ITINERARY: any[];
  onViewEvents: (dateKey: string, portName: string) => void;
  scheduledDaily?: any[];
  talent?: any[];
  tripStatus?: string;
}

export const ItineraryTab = memo(function ItineraryTab({
  ITINERARY,
  onViewEvents,
  scheduledDaily,
  talent,
  tripStatus = 'upcoming',
}: ItineraryTabProps) {
  const { timeFormat } = useTimeFormat();

  // Filter itinerary based on trip status
  const filteredItinerary = useMemo(() => {
    if (tripStatus !== 'current') {
      // For upcoming or past trips, show all days
      return ITINERARY;
    }

    // For current trips, filter to show only today and future days
    const today = new Date().toISOString().split('T')[0];
    return ITINERARY.filter(stop => {
      const stopDate = stop.key || stop.date?.split('T')[0];
      return stopDate >= today;
    });
  }, [ITINERARY, tripStatus]);

  // Transform itinerary data to Job format for the component
  const jobsData: Job[] = filteredItinerary.map((stop, index) => {
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

    // Generate unique key combining date, location ID, and index to handle duplicates (e.g., overnight ports)
    const uniqueKey = `${stop.key}-${stop.locationId || 'loc'}-${index}`;

    // Build port name with country (show country for non-US ports)
    const isUSPort =
      stop.country &&
      (stop.country.toLowerCase() === 'united states' ||
        stop.country.toLowerCase() === 'usa' ||
        stop.country.toLowerCase() === 'us');

    // Build base port name with country if applicable
    const basePortName = stop.country && !isUSPort ? `${stop.port}, ${stop.country}` : stop.port;

    let portName = basePortName;
    let arriveDepart = '';
    let allAboard = '';

    if (isPreCruise || isPostCruise) {
      // Pre-cruise and post-cruise: just port name, no times
      portName = basePortName;
      arriveDepart = '';
      allAboard = '';
    } else if (isEmbarkation) {
      // Embarkation: add suffix and show only depart time and all aboard
      portName = `${basePortName} - Embarkation`;
      arriveDepart =
        stop.depart && stop.depart !== '—' ? `Depart: ${formatTime(stop.depart, timeFormat)}` : '';
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    } else if (isDisembarkation) {
      // Disembarkation: add suffix and show only arrival time
      portName = `${basePortName} - Disembarkation`;
      arriveDepart =
        stop.arrive && stop.arrive !== '—' ? `Arrive: ${formatTime(stop.arrive, timeFormat)}` : '';
    } else if (isOvernightArrival) {
      // Overnight arrival: add suffix, show only arrival time, no all aboard
      portName = `${basePortName} - Overnight`;
      arriveDepart =
        stop.arrive && stop.arrive !== '—' ? `Arrive: ${formatTime(stop.arrive, timeFormat)}` : '';
      allAboard = '';
    } else if (isOvernightDeparture) {
      // Overnight departure: NO suffix, show depart time and all aboard
      portName = basePortName;
      arriveDepart =
        stop.depart && stop.depart !== '—' ? `Depart: ${formatTime(stop.depart, timeFormat)}` : '';
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    } else if (isFullDayOvernight) {
      // Full day overnight: add suffix, no times shown
      portName = `${basePortName} - Overnight Full Day`;
      arriveDepart = '';
      allAboard = '';
    } else {
      // Regular port: show both arrive and depart
      const hasTimes = (stop.arrive && stop.arrive !== '—') || (stop.depart && stop.depart !== '—');
      if (hasTimes) {
        const arriveText =
          stop.arrive && stop.arrive !== '—'
            ? `Arrive: ${formatTime(stop.arrive, timeFormat)}`
            : '';
        const departText =
          stop.depart && stop.depart !== '—'
            ? `Depart: ${formatTime(stop.depart, timeFormat)}`
            : '';
        arriveDepart = [arriveText, departText].filter(Boolean).join(' • ');
      }
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    }

    return {
      company: portName,
      title: stop.date,
      logo: (
        <img
          src={
            stop.imageUrl
              ? `${stop.imageUrl}?t=${Date.now()}`
              : 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
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
      job_time: uniqueKey,
      dayNumber: stop.day,
      // Add attractions and LGBT venues data
      attractions: stop.attractions || [],
      lgbtVenues: stop.lgbtVenues || [],
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
      {filteredItinerary.length === 0 ? (
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
