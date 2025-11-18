import { useLocation } from 'wouter';
import { TreePalm, Package, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminBottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      id: 'trips',
      label: 'Trips',
      path: '/admin/trips',
      icon: TreePalm,
    },
    {
      id: 'components',
      label: 'Components',
      path: '/admin/components',
      icon: Package,
    },
    {
      id: 'users',
      label: 'Users',
      path: '/admin/users',
      icon: Users,
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/admin/profile',
      icon: User,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location === '/admin';
    return location.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10001] xl:hidden">
      <nav
        className="bg-white/30 backdrop-blur-lg border-t border-white/30"
        style={{
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          paddingBottom: 'var(--nav-bottom-padding, 0px)',
        }}
      >
        <div className="flex items-center max-w-2xl mx-auto pt-1.5 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 flex-1 -mt-1.5 pt-2.5 rounded-b-md',
                  active ? 'text-blue-900 bg-white/40' : 'text-black opacity-60 hover:opacity-100'
                )}
              >
                <Icon className="w-[24px] h-[24px]" strokeWidth={2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
