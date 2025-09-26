"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LogOut, User, Shield } from "lucide-react";
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

    const fullDisplayName = profile?.full_name || user.email?.split('@')[0] || 'User';
    const displayName = fullDisplayName.split(' ')[0]; // Only show first name
    const initials = fullDisplayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const menuItems: MenuItem[] = [
        {
            label: "Profile",
            href: "/admin/profile",
            icon: <User className="w-3 h-3" />,
        },
    ];

    // Add admin menu item if user is admin
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        menuItems.push({
            label: "Admin Dashboard",
            href: "/admin",
            icon: <Shield className="w-3 h-3" />,
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
                            <div className="text-left flex-1 hidden sm:block">
                                <div className="text-sm font-medium text-white tracking-tight leading-tight">
                                    {displayName}
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
                        className="w-48 p-2 bg-[#10192f]/95 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
                    >
                        {/* Profile Header */}
                        {profile?.role && (
                            <div className="p-2 mb-1 bg-white/5 border border-white/10 rounded-xl">
                                <div className="text-sm font-medium text-white/70 capitalize">
                                    {profile.role.replace('_', ' ')}
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <button
                                        onClick={() => handleMenuClick(item.href)}
                                        className="w-full flex items-center p-2 hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-white/20"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="flex items-center justify-center w-6 h-6 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-medium text-white tracking-tight leading-tight whitespace-nowrap group-hover:text-white/90 transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.value && (
                                            <div className="flex-shrink-0 ml-auto">
                                                <span className="text-xs font-medium rounded-md py-1 px-2 tracking-tight text-white/60 bg-white/10 border border-white/20">
                                                    {item.value}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 p-2 duration-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 cursor-pointer border border-transparent hover:border-red-500/30 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                                    <LogOut className="w-3 h-3 text-red-400 group-hover:text-red-300" />
                                </div>
                                <span className="text-sm font-medium text-red-400 group-hover:text-red-300">
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