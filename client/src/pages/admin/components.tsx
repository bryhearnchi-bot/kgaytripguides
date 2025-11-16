import { useState, lazy, Suspense } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ship, Building, MapPin, Users, Palette, Search, ChevronDown, Filter } from 'lucide-react';

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 border border-white/30 hover:border-white/50">
              <Filter className="w-3 h-3" />
              <span>{currentComponentLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#002147] border-white/20 min-w-[280px]">
            {componentOptions.map(option => {
              const Icon = option.icon;
              const isActive = selectedComponentId === option.id;
              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`cursor-pointer text-white hover:bg-white/10 ${
                    isActive ? 'bg-white/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
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
