import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  LayoutDashboard,
  Ship,
  Building,
  MapPin,
  Users,
  Palette,
  FileText,
  Settings,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  Mail,
  TreePalm,
  HelpCircle,
} from 'lucide-react';
import { AdminBottomNavigation } from './AdminBottomNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const managementNav: NavItem[] = [
  // { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> }, // Temporarily hidden
  { label: 'Trips', path: '/admin/trips', icon: <TreePalm className="h-4 w-4" /> },
  { label: 'Ships', path: '/admin/ships', icon: <Ship className="h-4 w-4" /> },
  { label: 'Resorts', path: '/admin/resorts', icon: <Building className="h-4 w-4" /> },
  { label: 'Locations', path: '/admin/locations', icon: <MapPin className="h-4 w-4" /> },
  { label: 'Artists', path: '/admin/artists', icon: <Users className="h-4 w-4" /> },
  { label: 'Party Themes', path: '/admin/themes', icon: <Palette className="h-4 w-4" /> },
  // { label: 'Trip Info Sections', path: '/admin/trip-info-sections', icon: <FileText className="h-4 w-4" /> }, // Hidden
  // { label: 'FAQs', path: '/admin/faqs', icon: <HelpCircle className="h-4 w-4" /> }, // Hidden
];

const adminNav: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
  // { label: 'Invitations', path: '/admin/invitations', icon: <Mail className="h-4 w-4" /> }, // Hidden for now
  { label: 'Lookup Tables', path: '/admin/lookup-tables', icon: <Search className="h-4 w-4" /> },
  { label: 'Profile', path: '/admin/profile', icon: <Shield className="h-4 w-4" /> },
];

export function AdminLayout({ children }: AdminLayoutProps) {
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
      '/notifications': '/admin/trips',
      '/help': '/docs',
      '/admin-dashboard': '/admin/trips',
      '/admin': '/admin/trips',
    };

    const target = routeMap[path] || path;
    setLocation(target);
    if (mobileOpen) setMobileOpen(false);
  };

  useEffect(() => {
    const handleAdminNav = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: 'toggle' | 'open' | 'close' }>).detail;
      if (!detail) return;
      if (detail.action === 'toggle') {
        setMobileOpen(prev => !prev);
      } else if (detail.action === 'open') {
        setMobileOpen(true);
      } else if (detail.action === 'close') {
        setMobileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('admin-nav', handleAdminNav as EventListener);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('admin-nav', handleAdminNav as EventListener);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if ('matches' in event && event.matches) {
        setMobileOpen(false);
      }
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange as (event: MediaQueryListEvent) => void);
      return () =>
        mediaQuery.removeEventListener(
          'change',
          handleChange as (event: MediaQueryListEvent) => void
        );
    }

    mediaQuery.addListener(handleChange as (event: MediaQueryListEvent) => void);
    return () => mediaQuery.removeListener(handleChange as (event: MediaQueryListEvent) => void);
  }, []);

  const renderNavButton = (
    item: NavItem,
    options?: { collapsed?: boolean; variant?: 'desktop' | 'mobile' }
  ) => {
    const collapsed = options?.collapsed ?? sidebarCollapsed;
    const variant = options?.variant ?? 'desktop';
    const isActiveNav = isActive(item.path);

    const baseClasses =
      variant === 'desktop'
        ? `flex w-full items-center gap-2.5 rounded-full border px-3 py-1.5 text-xs transition min-h-[36px] touch-manipulation ${
            isActiveNav
              ? 'border-white/20 bg-white/15 text-white shadow-lg shadow-blue-900/20'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          } ${collapsed ? 'justify-center px-0 w-10 h-10 rounded-full' : ''}`
        : `flex w-full items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 ${
            isActiveNav ? 'text-white' : 'text-white/80'
          }`;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className={baseClasses}
        title={collapsed && variant === 'desktop' ? item.label : undefined}
      >
        {item.icon}
        {variant === 'desktop' ? (
          !collapsed && <span>{item.label}</span>
        ) : (
          <span>{item.label}</span>
        )}
      </button>
    );
  };

  const navSections = [
    { title: 'Management', items: managementNav },
    { title: 'Administration', items: adminNav },
  ];

  const BANNER_OFFSET = 64;

  return (
    <div className="flex min-h-screen text-white pt-16">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:bg-white/5 lg:py-6 lg:backdrop-blur-lg lg:transition-all lg:duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-48 xl:w-56'
        }`}
      >
        <div className={sidebarCollapsed ? 'px-2' : 'px-4'}>
          <div
            className={`mb-5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-white/60" />
                <h2 className="text-sm font-semibold text-white/70">Admin Panel</h2>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`space-y-5 ${sidebarCollapsed ? 'px-2' : 'px-4'} overflow-y-auto`}
          aria-label="Admin navigation"
        >
          {navSections.map(section => (
            <div key={section.title}>
              <p
                className={`text-xs uppercase tracking-[0.3em] text-white/40 mb-2 ${sidebarCollapsed ? 'hidden' : 'block'}`}
              >
                {section.title}
              </p>
              <div className="space-y-2">{section.items.map(item => renderNavButton(item))}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile drop-down navigation */}
      {mobileOpen && (
        <>
          <div
            className="fixed left-0 right-0 z-50 border-b border-white/10 bg-white/10 px-4 py-6 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden"
            style={{ top: BANNER_OFFSET }}
          >
            <div className="max-h-[calc(100vh-80px)] space-y-5 overflow-y-auto">
              {navSections.map(section => (
                <div key={section.title}>
                  <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-white/40">
                    {section.title}
                  </p>
                  <div className="space-y-2">
                    {section.items.map(item =>
                      renderNavButton(item, { variant: 'mobile', collapsed: false })
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Close menu
              </button>
            </div>
          </div>
          <div
            className="fixed left-0 right-0 bottom-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            style={{ top: BANNER_OFFSET }}
            onClick={() => setMobileOpen(false)}
          />
        </>
      )}

      <div className="flex flex-1 flex-col transition-all duration-300">
        {/* Bottom padding: pb-20 for mobile/tablet (bottom nav visible), lg:pb-8 for desktop (sidebar, no bottom nav) */}
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8 pb-20 lg:pb-8">
          {/* Max-width container for large screens to prevent tables from being too wide */}
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - only show on mobile */}
      <AdminBottomNavigation />
    </div>
  );
}
