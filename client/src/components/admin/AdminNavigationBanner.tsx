import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseAuthContext } from "@/contexts/SupabaseAuthContext";
import {
  Shield,
  LogOut,
  User,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminNavigationBanner() {
  const { profile, signOut } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    signOut();
    setLocation('/admin/login');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'destructive';
      case 'trip_admin': return 'default';
      case 'content_editor': return 'secondary';
      case 'media_manager': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role?.replace('_', ' ').toUpperCase() || 'USER';
  };

  return (
    <div className="bg-ocean-900 text-white shadow-lg fixed z-50 w-full top-0 left-0 right-0">
      <div className="px-3 sm:px-4 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Logos */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <img
                src="https://res.cloudinary.com/dfqoebbyj/image/upload/v1757807911/cruise-app/logos/atlantis-logo.png"
                alt="Atlantis Events"
                className="h-5 sm:h-6 w-auto brightness-0 invert hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
            <a href="https://kgaytravel.com/" target="_blank" rel="noopener noreferrer">
              <img
                src="https://res.cloudinary.com/dfqoebbyj/image/upload/v1757807911/cruise-app/logos/kgay-logo.jpg"
                alt="KGay Travel"
                className="h-6 sm:h-8 w-auto hover:opacity-80 transition-opacity"
              />
            </a>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-3">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-white hover:bg-white/10 p-2 touch-manipulation"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <User className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs sm:text-sm font-medium">{profile?.full_name || profile?.email?.split('@')[0] || 'Admin'}</p>
                      <Badge
                        variant={getRoleBadgeVariant(profile?.role || '')}
                        className="text-[9px] sm:text-[10px] px-1 py-0"
                      >
                        {getRoleDisplayName(profile?.role || '')}
                      </Badge>
                    </div>
                    <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 opacity-70" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || 'Admin User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}