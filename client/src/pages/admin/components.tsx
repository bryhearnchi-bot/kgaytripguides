import { useState, lazy, Suspense } from 'react';
import { PillDropdown } from '@/components/ui/dropdowns';
import { Ship, Building, MapPin, Users, Palette, Search, Filter } from 'lucide-react';

// Lazy load component pages
const ShipsManagement = lazy(() => import('@/pages/admin/ships'));
const ResortsManagement = lazy(() => import('@/pages/admin/resorts'));
const LocationsManagement = lazy(() => import('@/pages/admin/locations'));
const ArtistsManagement = lazy(() => import('@/pages/admin/artists'));
const ThemesManagement = lazy(() => import('@/pages/admin/themes'));
const AdminLookupTables = lazy(() => import('@/pages/admin/lookup-tables'));

const componentOptions = [
  { label: 'Ships', id: 'ships', icon: Ship, component: ShipsManagement },
  { label: 'Resorts', id: 'resorts', icon: Building, component: ResortsManagement },
  { label: 'Locations', id: 'locations', icon: MapPin, component: LocationsManagement },
  { label: 'Artists', id: 'artists', icon: Users, component: ArtistsManagement },
  { label: 'Party Themes', id: 'themes', icon: Palette, component: ThemesManagement },
  { label: 'Lookup Tables', id: 'lookup-tables', icon: Search, component: AdminLookupTables },
];

export default function ComponentsPage() {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('ships');

  const selectedOption = componentOptions.find(opt => opt.id === selectedComponentId);
  const SelectedComponent = selectedOption?.component;
  const currentComponentLabel = selectedOption?.label || 'Select Component';

  const handleSelect = (id: string) => {
    setSelectedComponentId(id);
  };

  return (
    <div className="w-full" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header and Dropdown on same line */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trip Components</h1>

        {/* Dropdown Menu - matching ScheduleTab pattern */}
        <PillDropdown
          options={componentOptions.map(option => ({
            value: option.id,
            label: option.label,
            icon: option.icon,
          }))}
          value={selectedComponentId}
          onChange={handleSelect}
          placeholder="Select Component"
          triggerClassName=""
        />
      </div>

      {/* Divider line */}
      <div className="border-b border-white/10 mb-6"></div>

      {/* Render selected component inline */}
      {SelectedComponent ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-white/60">Loading...</div>
            </div>
          }
        >
          <SelectedComponent />
        </Suspense>
      ) : (
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <p className="text-white/60 text-center">
            Select a component from the dropdown above to manage it.
          </p>
        </div>
      )}
    </div>
  );
}
