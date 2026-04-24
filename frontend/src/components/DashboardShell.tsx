"use client";

import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import { useRouter, usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import Link from "next/link";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { 
    LayoutDashboard, 
    Users, 
    Shield, 
    LogOut, 
    Key,
    Activity,
    Server,
    Clock,
    UserCircle,
    ChevronRight,
    Users2,
    Terminal,
    Map,
    LayoutGrid,
    Bed,
    Cpu,
    BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";

import GlobalAlertOverlay from "@/components/alerts/GlobalAlertOverlay";
import useAlertsSocket from "@/hooks/useAlertsSocket";

interface DashboardShellProps {
    children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
    const { user, logout, _hasHydrated } = useAuthStore();
    const { onlineUserIds } = usePresenceStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // 🔥 Start global alert telemetry
    useAlertsSocket();

    // CRITICAL: Wait for hydration before deciding the auth state.
    // If we haven't hydrated yet, we don't know if a user exists or not.
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-600/20 flex items-center justify-center animate-pulse">
                    <Shield className="w-8 h-8 text-emerald-500/40" />
                </div>
                <p className="mt-4 text-zinc-600 text-xs font-bold uppercase tracking-widest animate-pulse">Establishing Secure Session...</p>
            </div>
        );
    }

    if (!user) {
        // We've hydrated and still have no user - redirect is handled by pages 
        // but we'll return null here as a fallback.
        return null;
    }

    const isAdmin = user.role === "ADMIN";
    const isDoctor = user.role === "DOCTOR";
    const isNurse = user.role === "NURSE";

    const navigation = [
        ...(isAdmin ? [
            { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
            { name: "Live Vitals", href: "/dashboard/admin/vitals", icon: Activity },
            { name: "Alert Center", href: "/dashboard/admin/alerts", icon: BellRing },
            { name: "User Directory", href: "/dashboard/admin/users", icon: Users },
            { name: "Patient Directory", href: "/dashboard/admin/patients", icon: Users2 },
            { name: "Ward Management", href: "/dashboard/admin/wards", icon: Map },
            { name: "Room Management", href: "/dashboard/admin/rooms", icon: LayoutGrid },
            { name: "Bed Management", href: "/dashboard/admin/beds", icon: Bed },
            { name: "Device Fleet", href: "/dashboard/admin/devices", icon: Cpu },
            { name: "System Logs", href: "/dashboard/admin/logs", icon: Server },
        ] : []),
        ...(isDoctor ? [
            { name: "Dashboard", href: "/dashboard/doctor", icon: Activity },
        ] : []),
        ...(isNurse ? [
            { name: "Dashboard", href: "/dashboard/nurse", icon: Activity },
        ] : []),
    ];

    return (
        <div className="flex min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
            {/* Global Alert System */}
            <GlobalAlertOverlay />
            
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-900 bg-black/20 backdrop-blur-3xl flex flex-col sticky top-0 h-screen">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-xl">
                            <Shield className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl tracking-tight leading-none font-mono uppercase text-white">CareStream</h2>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-black text-zinc-700">_INFRASTRUCTURE</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                    isActive 
                                    ? "bg-zinc-900 text-white shadow-inner" 
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "group-hover:text-emerald-400"}`} />
                                <span className="font-semibold text-sm">{item.name}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-zinc-700" />}
                            </Link>
                        );
                    })}
                </nav>

                {isAdmin && (
                    <div className="p-4 mt-auto border-t border-zinc-900/50">
                        <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-3">
                                <Terminal className="w-3.5 h-3.5 text-zinc-600" />
                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-700">MONITOR_FEED</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-medium text-zinc-600 uppercase tracking-tighter">_STAFF_ONLINE</span>
                                <span className="bg-zinc-900 text-emerald-500/80 text-[11px] font-mono font-black px-2.5 py-1 rounded border border-zinc-800">
                                    {onlineUserIds.size}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-20 border-b border-zinc-900 bg-black/10 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 flex-shrink-0">
                            <img 
                                src="/assets/avatar-placeholder.svg" 
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-mono font-black text-sm tracking-tight text-white">{user.username.replace(/\s+/g, '_')}</h3>
                                {/* WhatsApp-style Online Pulse */}
                                {onlineUserIds.has(Number(user.id)) && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                                        <span className="text-[9px] font-mono font-black text-emerald-500/60 uppercase tracking-widest">Active</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] font-mono font-black tracking-[0.2em] text-zinc-700 uppercase mt-0.5">{user.role}_ACCESS</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full"
                        >
                            <Key className="w-4 h-4 mr-2" />
                            Security
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                logout();
                                router.push("/login");
                            }}
                            className="text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-full"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    );
}
