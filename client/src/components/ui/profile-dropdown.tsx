import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

interface ProfileDropdownProps {
  user: {
    id: string;
    email?: string;
    avatar_url?: string;
  };
  profile?: {
    full_name?: string;
    role?: string;
    status?: string;
  };
  onLogout: () => void;
  onNavigate: (path: string) => void;
  className?: string;
}

export default function ProfileDropdown({
  user,
  profile,
  onLogout,
  onNavigate,
  className = "",
}: ProfileDropdownProps) {
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 text-white hover:bg-white/10 px-2 py-1.5 h-auto transition-all duration-200 ${className}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            {profile?.role && (
              <p className="text-xs text-white/70 capitalize">{profile.role.replace('_', ' ')}</p>
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
        {/* Profile Header */}
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-ocean-400 to-blue-400 text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem
          onClick={() => onNavigate('/profile')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-50">
            <User className="h-4 w-4 text-ocean-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Profile</p>
            <p className="text-sm text-muted-foreground">Manage your profile</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate('/settings')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <Settings className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Settings</p>
            <p className="text-sm text-muted-foreground">Configure your preferences</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate('/notifications')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-muted-foreground">Manage notifications</p>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
            <span className="text-xs font-medium text-blue-600">3</span>
          </div>
        </DropdownMenuItem>

        {/* Admin Section */}
        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onNavigate('/admin')}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Admin Dashboard</p>
                <p className="text-sm text-muted-foreground">Manage system settings</p>
              </div>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onNavigate('/help')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <HelpCircle className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Help & Support</p>
            <p className="text-sm text-muted-foreground">Get help and documentation</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-3 p-3 cursor-pointer text-red-600 focus:text-red-600"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
            <LogOut className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Sign out</p>
            <p className="text-sm text-red-500">Sign out of your account</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}