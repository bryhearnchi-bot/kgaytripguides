import TripGuide from '@/components/trip-guide';
import { useHomeMetadata } from '@/hooks/useHomeMetadata';

export default function Home() {
  // Set default metadata for landing page
  useHomeMetadata();

  return <TripGuide />;
}
