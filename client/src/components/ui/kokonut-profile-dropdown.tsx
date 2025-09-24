"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileText, LogOut, User, Settings, Shield, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    status?: string;
}

interface MenuItem {
    label: string;
    value?: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
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
}

export default function KokonutProfileDropdown({
    user,
    profile,
    onLogout,
    onNavigate,
    className,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
    const initials = displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const menuItems: MenuItem[] = [
        {
            label: "Profile",
            href: "/profile",
            icon: <User className="w-4 h-4" />,
        },
        {
            label: "Settings",
            href: "/settings",
            icon: <Settings className="w-4 h-4" />,
        },
        {
            label: "Notifications",
            href: "/notifications",
            icon: <Bell className="w-4 h-4" />,
        },
    ];

    // Add admin menu item if user is admin
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        menuItems.push({
            label: "Admin Dashboard",
            href: "/admin",
            icon: <Shield className="w-4 h-4" />,
        });
    }

    const handleMenuClick = (href: string) => {
        onNavigate(href);
    };

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 hover:bg-white/20 hover:shadow-sm transition-all duration-200 focus:outline-none text-white"
                        >
                            <div className="text-left flex-1 hidden sm:block">
                                <div className="text-sm font-medium text-white tracking-tight leading-tight">
                                    {displayName}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-400 via-blue-400 to-cyan-400 p-0.5">
                                    <Avatar className="w-full h-full">
                                        <AvatarImage src={user.avatar_url} alt={displayName} />
                                        <AvatarFallback className="bg-gradient-to-br from-ocean-500 to-blue-500 text-white text-xs font-medium">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Bending line indicator on the right */}
                    <div
                        className={cn(
                            "absolute -right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                            isOpen
                                ? "opacity-100"
                                : "opacity-60 group-hover:opacity-100"
                        )}
                    >
                        <svg
                            width="12"
                            height="24"
                            viewBox="0 0 12 24"
                            fill="none"
                            className={cn(
                                "transition-all duration-200",
                                isOpen
                                    ? "text-ocean-400 scale-110"
                                    : "text-white/40 group-hover:text-white/60"
                            )}
                            aria-hidden="true"
                        >
                            <path
                                d="M2 4C6 8 6 16 2 20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-56 p-2 bg-white/95 backdrop-blur-sm border border-ocean-200/60 rounded-2xl shadow-xl shadow-ocean-900/5
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
                    >
                        {/* Profile Header */}
                        <div className="flex items-center gap-3 p-3 mb-2 bg-gradient-to-r from-ocean-50 to-blue-50 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ocean-400 via-blue-400 to-cyan-400 p-0.5">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={user.avatar_url} alt={displayName} />
                                    <AvatarFallback className="bg-gradient-to-br from-ocean-500 to-blue-500 text-white font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-ocean-900 tracking-tight leading-tight truncate">
                                    {displayName}
                                </div>
                                <div className="text-xs text-ocean-600 tracking-tight leading-tight truncate">
                                    {user.email}
                                </div>
                                {profile?.role && (
                                    <div className="text-xs text-ocean-500 capitalize mt-0.5">
                                        {profile.role.replace('_', ' ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <button
                                        onClick={() => handleMenuClick(item.href)}
                                        className="w-full flex items-center p-3 hover:bg-ocean-50 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-ocean-200/50"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex items-center justify-center w-8 h-8 bg-ocean-100 rounded-lg group-hover:bg-ocean-200 transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 tracking-tight leading-tight whitespace-nowrap group-hover:text-ocean-800 transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.value && (
                                            <div className="flex-shrink-0 ml-auto">
                                                <span className="text-xs font-medium rounded-md py-1 px-2 tracking-tight text-ocean-600 bg-ocean-50 border border-ocean-500/10">
                                                    {item.value}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-ocean-200 to-transparent" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 p-3 duration-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 cursor-pointer border border-transparent hover:border-red-500/30 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                    <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
                                    Sign Out
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}