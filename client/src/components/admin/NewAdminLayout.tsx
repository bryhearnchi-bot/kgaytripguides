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
  LogOut
} from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

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

export function NewAdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { logout } = useSupabaseAuthContext();

  // Persist sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

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
      title: 'CRUISES',
      items: [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { label: 'Active Cruises', path: '/admin/cruises/active', icon: <Anchor size={20} /> },
        { label: 'Past Cruises', path: '/admin/cruises/past', icon: <Anchor size={20} /> },
      ]
    },
    {
      title: 'CONTENT MANAGEMENT',
      items: [
        { label: 'Ships', path: '/admin/ships', icon: <Ship size={20} /> },
        { label: 'Locations', path: '/admin/locations', icon: <MapPin size={20} /> },
        { label: 'Artists/Talent', path: '/admin/artists', icon: <Users size={20} /> },
        { label: 'Party Themes', path: '/admin/themes', icon: <Palette size={20} /> },
        { label: 'Info Sections', path: '/admin/info-sections', icon: <FileText size={20} /> },
      ]
    }
  ];

  const adminSection: NavSection = {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      { label: 'Profile', path: '/admin/profile', icon: <UserCircle size={20} /> },
    ]
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location === '/admin') return true;
    if (path !== '/admin' && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-[#1e3a5f] to-[#0f2238] flex items-center justify-between px-4 z-50 shadow-lg">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-white hover:bg-white/10 rounded-md transition-colors touch-target"
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center text-lg">
            ⚓
          </div>
          <span className="text-white font-bold">CruiseGuides</span>
        </div>

        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f2238] transition-all duration-300 z-50 shadow-xl ${
        sidebarCollapsed ? 'w-20' : 'w-[280px]'
      } ${
        // Mobile responsiveness
        mobileMenuOpen ? 'lg:relative' : 'max-lg:transform max-lg:-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10 lg:pt-6 pt-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center text-2xl">
              ⚓
            </div>
            {!sidebarCollapsed && (
              <span className="text-white text-xl font-bold">CruiseGuides</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 hover:bg-white/10 rounded-md transition-colors touch-target"
          >
            <Menu size={20} className="text-[#90E0EF]" />
          </button>
        </div>

        <nav className="py-6 h-[calc(100vh-88px)] overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2 text-xs uppercase tracking-wider text-white/40">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center px-6 py-3 mx-3 rounded-lg transition-all touch-target ${
                      isActive(item.path)
                        ? 'bg-[#00B4D8]/15 text-[#00B4D8]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white/95'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="ml-3">{item.label}</span>
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
                  className={`flex items-center px-6 py-3 mx-3 rounded-lg transition-all touch-target ${
                    isActive(item.path)
                      ? 'bg-[#00B4D8]/15 text-[#00B4D8]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white/95'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3">{item.label}</span>
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
              className="flex items-center px-6 py-3 mx-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white/95 transition-all w-[calc(100%-24px)] touch-target"
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'
      } lg:mt-0 mt-14 mobile-content-padding-bottom`}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}