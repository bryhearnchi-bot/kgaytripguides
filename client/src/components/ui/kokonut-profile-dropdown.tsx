"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
            icon: <User className="w-4 h-4" />,
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
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} {...props}>
            <div
                style={{
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                }}
            >
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger
                        style={{
                            outline: 'none',
                            border: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                        }}
                        asChild
                    >
                        <button
                            type="button"
                            style={{
                                outline: 'none !important',
                                border: 'none !important',
                                boxShadow: 'none !important',
                                background: 'transparent !important',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                            }}
                            className={cn(
                                "kokonut-profile-button group flex items-center gap-2 px-2 py-1 rounded-xl",
                                "hover:bg-white/10",
                                "transition-all duration-300 ease-out",
                                isOpen && "bg-white/10"
                            )}
                    >
                        {/* Avatar with enhanced styling */}
                        <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ocean-400 via-blue-400 to-cyan-400 p-0.5 shadow-md">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={user.avatar_url} alt={displayName} />
                                    <AvatarFallback className="bg-gradient-to-br from-ocean-500 to-blue-500 text-white text-xs font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-white/90 rounded-full shadow-sm" />
                        </div>

                        {/* Name only */}
                        <div className="text-left flex-1 hidden sm:block">
                            <div className="text-sm font-semibold text-white tracking-tight leading-tight">
                                {displayName}
                            </div>
                        </div>

                        {/* Chevron indicator */}
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 text-white/60 transition-transform duration-300",
                                isOpen && "rotate-180 text-ocean-400"
                            )}
                        />
                        </button>
                    </PopoverTrigger>

                <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-64 p-0 border-0 bg-transparent shadow-none"
                >
                    <Card className="bg-[#10192f]/98 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
                        {/* Profile header */}
                        <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex flex-col">
                                <p className="text-sm text-white/60 truncate">
                                    {user.email}
                                </p>
                                {profile?.role && (
                                    <span className="text-xs font-medium text-ocean-300 capitalize mt-1">
                                        {profile.role.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Separator className="bg-white/10" />

                            {/* Menu items */}
                            <div className="p-2 space-y-1">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => handleMenuClick(item.href)}
                                        style={{
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none',
                                        }}
                                        className={cn(
                                            "group w-full flex items-center gap-2 p-2 rounded-lg",
                                            "text-left transition-all duration-200",
                                            "hover:bg-white/10 hover:shadow-sm",
                                            "focus:outline-none focus:ring-0 focus:border-0"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-6 h-6 rounded-lg",
                                            "bg-white/10 group-hover:bg-white/20 transition-colors",
                                            "text-white/80 group-hover:text-white"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.value && (
                                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/60 border border-white/20">
                                                {item.value}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <Separator className="bg-white/10" />

                            {/* Logout button */}
                            <div className="p-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onLogout();
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "group w-full flex items-center gap-2 p-2 rounded-lg",
                                        "bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/30",
                                        "transition-all duration-200 hover:shadow-sm",
                                        "focus:outline-none focus:ring-2 focus:ring-red-400/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-lg",
                                        "bg-red-500/20 group-hover:bg-red-500/30 transition-colors"
                                    )}>
                                        <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                                    </div>
                                    <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </PopoverContent>
            </Popover>
            </div>
        </div>
    );
}