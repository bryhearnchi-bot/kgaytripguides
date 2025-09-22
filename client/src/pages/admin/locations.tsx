import { useMediaQuery } from '@/hooks/use-media-query';
import LocationManagement from '@/components/admin/LocationManagement';
import MobileLocationManagement from '@/components/admin/MobileLocationManagement';

export default function LocationsManagement() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="space-y-6">
      {isMobile ? (
        <MobileLocationManagement />
      ) : (
        <LocationManagement />
      )}
    </div>
  );
}