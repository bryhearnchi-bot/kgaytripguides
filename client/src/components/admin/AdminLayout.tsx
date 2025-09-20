import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Ship,
  MapPin,
  Users,
  Palette,
  FileText,
  Settings,
  UserCircle,
  Menu,
  ChevronRight,
  Anchor,
  LogOut,
  Shield
} from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { usePersistentSidebar } from '@/hooks/usePersistentSidebar';
import { useLocation as useWouterLocation } from 'wouter';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, isMounted } = usePersistentSidebar(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [, setWouterLocation] = useWouterLocation();
  const { signOut } = useSupabaseAuthContext();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle mobile menu overlay click
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navSections: NavSection[] = [
    {
      title: 'TRIPS',
      items: [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
        { label: 'Trips', path: '/admin/trips', icon: <Anchor size={18} /> },
      ]
    },
    {
      title: 'CONTENT MANAGEMENT',
      items: [
        { label: 'Ships', path: '/admin/ships', icon: <Ship size={18} /> },
        { label: 'Locations', path: '/admin/locations', icon: <MapPin size={18} /> },
        { label: 'Artists/Talent', path: '/admin/artists', icon: <Users size={18} /> },
        { label: 'Party Themes', path: '/admin/themes', icon: <Palette size={18} /> },
        { label: 'Info Sections', path: '/admin/info-sections', icon: <FileText size={18} /> },
      ]
    }
  ];

  const adminSection: NavSection = {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
      { label: 'Profile', path: '/admin/profile', icon: <UserCircle size={18} /> },
    ]
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location === '/admin') return true;
    if (path !== '/admin' && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setWouterLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden fixed top-10 left-0 right-0 h-14 bg-gradient-to-r from-ocean-900 to-ocean-800 flex items-center justify-between px-4 z-50 shadow-lg">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-white hover:bg-white/10 rounded-md transition-colors touch-target"
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Admin Panel</span>
        </div>

        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-10"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - positioned below nav banner */}
      <aside className={`fixed left-0 top-10 h-[calc(100vh-40px)] bg-gradient-to-b from-ocean-900 via-ocean-800 to-ocean-700 z-40 shadow-xl ${
        // Only apply transition after component has mounted to prevent flicker
        isMounted ? 'transition-all duration-300' : ''
      } ${
        sidebarCollapsed ? 'w-20' : 'w-[220px]'
      } ${
        // Mobile responsiveness
        mobileMenuOpen ? 'lg:relative' : 'max-lg:transform max-lg:-translate-x-full'
      }`}>
        <div className="p-4 border-b border-white/10 lg:pt-4 pt-20">
          <div className="flex items-center justify-between gap-2">
            {sidebarCollapsed ? (
              <>
                <div className="w-7 h-7 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4 text-[#90E0EF]" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-bold whitespace-nowrap">Admin Panel</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5 text-[#90E0EF] rotate-180" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="py-6 h-[calc(100%-88px)] overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2 text-[10px] uppercase tracking-wider text-white/40">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center px-6 py-1.5 mx-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white/95'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="ml-3 text-sm">{item.label}</span>
                        {isActive(item.path) && (
                          <ChevronRight className="ml-auto" size={16} />
                        )}
                      </>
                    )}
                  </a>
                </Link>
              ))}
            </div>
          ))}

          <div className="border-t border-white/10 pt-6 mt-auto">
            {!sidebarCollapsed && (
              <div className="px-6 mb-2 text-xs uppercase tracking-wider text-white/40">
                {adminSection.title}
              </div>
            )}
            {adminSection.items.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center px-6 py-1.5 mx-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white/95'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 text-sm">{item.label}</span>
                      {isActive(item.path) && (
                        <ChevronRight className="ml-auto" size={16} />
                      )}
                    </>
                  )}
                </a>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center px-6 py-1.5 mx-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white/95 transition-all w-[calc(100%-24px)]"
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span className="ml-3 text-sm">Logout</span>}
            </button>

          </div>
        </nav>
      </aside>

      {/* Main Content - positioned below nav banner and beside sidebar */}
      <main className={`flex-1 pt-10 ${
        // Only apply transition after component has mounted to prevent flicker
        isMounted ? 'transition-all duration-300' : ''
      } ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[220px]'
      } lg:mt-0 mt-14 mobile-content-padding-bottom`}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}