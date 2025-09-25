import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import {
  LayoutDashboard,
  Anchor,
  Ship,
  MapPin,
  Users,
  Palette,
  FileText,
  Settings,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import KokonutProfileDropdown from '@/components/ui/kokonut-profile-dropdown';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const managementNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Trips', path: '/admin/trips', icon: <Anchor className="h-4 w-4" /> },
  { label: 'Ships', path: '/admin/ships', icon: <Ship className="h-4 w-4" /> },
  { label: 'Locations', path: '/admin/locations', icon: <MapPin className="h-4 w-4" /> },
  { label: 'Artists', path: '/admin/artists', icon: <Users className="h-4 w-4" /> },
  { label: 'Party Themes', path: '/admin/themes', icon: <Palette className="h-4 w-4" /> },
  { label: 'Info Sections', path: '/admin/info-sections', icon: <FileText className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Profile', path: '/admin/profile', icon: <Shield className="h-4 w-4" /> },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, signOut } = useSupabaseAuthContext();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location === '/admin';
    return location.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    const routeMap: Record<string, string> = {
      '/profile': '/admin/profile',
      '/settings': '/admin/settings',
      '/notifications': '/admin',
      '/help': '/docs',
      '/admin-dashboard': '/admin'
    };

    const target = routeMap[path] || path;
    setLocation(target);
    if (mobileOpen) setMobileOpen(false);
  };

  const renderNavButton = (item: NavItem) => (
    <button
      key={item.path}
      onClick={() => handleNavigate(item.path)}
      className={`flex w-full items-center gap-3 rounded-full border px-4 py-2 text-sm transition ${
        isActive(item.path)
          ? 'border-white/20 bg-white/15 text-white shadow-lg shadow-blue-900/20'
          : 'border-white/10 bg-white/5 text白/70 hover:bg白/10 hover:text白'
      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
      title={sidebarCollapsed ? item.label : undefined}
    >
      {item.icon}
      {!sidebarCollapsed && <span>{item.label}</span>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#0b1222] text-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[#10192f]/95 py-8 backdrop-blur-lg transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarCollapsed ? 'w-20' : 'w-64'} lg:static`}
      >
        <div className={sidebarCollapsed ? 'px-2' : 'px-6'}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mb-6 flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 py-2 text-xs text白/60 hover:bg白/10"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>

        <div className={`space-y-6 ${sidebarCollapsed ? 'px-2' : 'px-6'} overflow-y-auto`}>
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] text白/40 mb-2 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Management</p>
            <div className="space-y-2">{managementNav.map(renderNavButton)}</div>
          </div>

          <div>
            <p className={`text-xs uppercase tracking-[0.3em] text白/40 mb-2 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Administration</p>
            <div className="space-y-2">{adminNav.map(renderNavButton)}</div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col transition-all duration-300">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#10192f]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-full border border-white/10 bg白/5 p-2 text白 hover:bg白/10"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Admin</span>
            {user && profile ? (
              <KokonutProfileDropdown
                user={user}
                profile={profile}
                onLogout={async () => {
                  await signOut();
                  setMobileOpen(false);
                }}
                onNavigate={handleNavigate}
              />
            ) : (
              <ButtonFallback />
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ButtonFallback() {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text白/60">
      Loading…
    </div>
  );
}
