import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  Anchor
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

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
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">⚓</div>
            <span className="logo-text">CruiseGuides</span>
          </div>
          <button className="hamburger" onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <nav className="nav-menu">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <div className="nav-label">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                  {!sidebarCollapsed && isActive(item.path) && (
                    <ChevronRight className="nav-arrow" size={16} />
                  )}
                </Link>
              ))}
            </div>
          ))}

          <div className="nav-section">
            <div className="nav-label">{adminSection.title}</div>
            {adminSection.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
                {!sidebarCollapsed && isActive(item.path) && (
                  <ChevronRight className="nav-arrow" size={16} />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
        }

        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 280px;
          background: linear-gradient(180deg, #1e3a5f 0%, #0f2238 100%);
          transition: all 0.3s ease;
          z-index: 1000;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .sidebar.collapsed .sidebar-header {
          padding: 24px 20px;
          justify-content: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #00B4D8;
          font-size: 20px;
          font-weight: 700;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00B4D8 0%, #90E0EF 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 24px;
        }

        .logo-text {
          color: white;
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .logo-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .hamburger {
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 4px;
          border-radius: 6px;
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          transition: background 0.2s ease;
          background: transparent;
          border: none;
        }

        .hamburger:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar.collapsed .hamburger {
          position: relative;
          right: auto;
          top: auto;
          transform: none;
        }

        .hamburger span {
          width: 100%;
          height: 2px;
          background: #90E0EF;
          display: block;
          transition: all 0.3s ease;
        }

        .nav-menu {
          padding: 24px 0;
          height: calc(100vh - 89px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .nav-menu::-webkit-scrollbar {
          width: 6px;
        }

        .nav-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section:last-child {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 24px;
          margin-top: auto;
        }

        .nav-label {
          padding: 0 24px;
          margin-bottom: 8px;
          font-size: 11px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 1px;
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .nav-label {
          opacity: 0;
          height: 0;
          margin: 0;
          overflow: hidden;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          margin: 0 12px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-decoration: none;
          gap: 12px;
        }

        .sidebar.collapsed .nav-item {
          padding: 12px 0;
          margin: 0 8px;
          justify-content: center;
        }

        .nav-item:hover {
          background: rgba(0, 180, 216, 0.1);
          color: rgba(255, 255, 255, 0.95);
        }

        .nav-item.active {
          background: rgba(0, 180, 216, 0.15);
          color: #00B4D8;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #00B4D8;
          border-radius: 0 2px 2px 0;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-text {
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .nav-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .nav-arrow {
          margin-left: auto;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }

        .main-content.sidebar-collapsed {
          margin-left: 80px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0;
          }

          .main-content.sidebar-collapsed {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}