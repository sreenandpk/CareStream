"use client";

import { useAuthStore } from "@/store/authStore";
import { usePresenceStore } from "@/store/presenceStore";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { 
    LayoutDashboard, 
    Users, 
    Shield, 
    LogOut, 
    Key,
    Activity,
    FileText,
    History,
    UserCircle,
    User,
    ShieldCheck,
    Fingerprint,
    Power,
    ChevronRight,
    Terminal,
    Building2,
    LayoutGrid,
    BedDouble,
    Server,
    BellRing,
    DoorOpen,
    Contact,
    BriefcaseMedical,
    ShieldAlert,
    Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

import useVitalsSocket from "@/hooks/useVitalsSocket";
import { useVitalsStore } from "@/store/vitalsStore";

interface DashboardShellProps {
    children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
    const { user, accessToken, logout, _hasHydrated } = useAuthStore();
    const { onlineUserIds } = usePresenceStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // 🔬 Start global persistent vitals telemetry (Nexus Strategy)
    const { connect: connectVitals } = useVitalsStore();
    
    useEffect(() => {
        if (_hasHydrated && accessToken) {
            connectVitals(accessToken);
        }
    }, [_hasHydrated, accessToken, connectVitals]);

    // CRITICAL: Wait for hydration before deciding the auth state.
    // If we haven't hydrated yet, we don't know if a user exists or not.
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-[#5C61F2] flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <Shield className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="mt-10 flex flex-col items-center gap-2">
                    <p className="text-zinc-900 text-sm font-black uppercase tracking-[0.4em]">Establishing Secure Node</p>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest opacity-50">Handshaking Clinical Identity Matrix...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const isAdmin = user.role === "ADMIN";
    const isDoctor = user.role === "DOCTOR";
    const isNurse = user.role === "NURSE";

    const navigation = [
        ...(isAdmin ? [
            { name: "Home", href: "/dashboard/admin", icon: Home },
            { name: "Live Monitoring", href: "/dashboard/admin/vitals", icon: Activity },
            { name: "Team Members", href: "/dashboard/admin/users", icon: ShieldCheck },
            { name: "Patient List", href: "/dashboard/admin/patients", icon: Users },
            { name: "Hospital Wards", href: "/dashboard/admin/wards", icon: Building2 },
            { name: "Hospital Rooms", href: "/dashboard/admin/rooms", icon: LayoutGrid },
            { name: "Hospital Beds", href: "/dashboard/admin/beds", icon: BedDouble },
            { name: "Medical Devices", href: "/dashboard/admin/devices", icon: Server },
            { name: "Activity Logs", href: "/dashboard/admin/logs", icon: Terminal },
        ] : []),
        ...(isDoctor ? [
            { name: "My Dashboard", href: "/dashboard/doctor", icon: Home },
            { name: "Live Monitoring", href: "/dashboard/doctor/vitals", icon: Activity },
        ] : []),
        ...(isNurse ? [
            { name: "My Dashboard", href: "/dashboard/nurse", icon: Home },
            { name: "Live Monitoring", href: "/dashboard/nurse/vitals", icon: Activity },
        ] : []),
    ];

    return (
        <div className="flex min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#5C61F2]/10 overflow-hidden relative">
            {/* 🛡️ PREMIUM SIDEBAR */}
            <aside className="w-80 border-r border-zinc-100 bg-white flex flex-col sticky top-0 h-screen z-20 shadow-sm">
                <div className="p-10 pb-8">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push(isAdmin ? "/dashboard/admin" : "/dashboard/nurse")}>
                        <div className="w-12 h-12 rounded-2xl bg-[#5C61F2] flex items-center justify-center shadow-2xl shadow-[#5C61F2]/30 group-hover:scale-110 transition-transform duration-500">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-2xl tracking-tighter leading-none text-zinc-900 uppercase">Care<span className="text-[#5C61F2]">Stream</span></h2>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                                    isActive 
                                    ? "bg-zinc-50 text-[#5C61F2] shadow-sm ring-1 ring-zinc-100" 
                                    : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50/50"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#5C61F2]" : "text-zinc-300 group-hover:text-[#5C61F2]")} />
                                <span className="font-black text-[11px] uppercase tracking-widest leading-none">{item.name}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#5C61F2] rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {isAdmin && (
                    <div className="px-6 py-4">
                        <div className="bg-[#5C61F2] rounded-[1.8rem] p-5 text-white shadow-xl shadow-[#5C61F2]/20 relative overflow-hidden group border-none">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-125 blur-2xl" />
                            <div className="relative z-10">
                                <div className="space-y-1 mb-5 text-left">
                                    <h2 className="text-[11px] font-black leading-snug text-white uppercase tracking-[0.1em] opacity-90">
                                        CareStream Healthcare Systems
                                    </h2>
                                </div>
                                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-[1.2rem] py-3 px-4 flex items-center justify-between border border-white/5">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Staff Online</span>
                                    <span className="text-xs font-black text-white leading-none">{onlineUserIds.size}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* 🖥️ MAIN ENGINE VIEW */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-24 bg-white/70 backdrop-blur-xl px-12 flex items-center justify-between sticky top-0 z-10 border-b border-zinc-50 shadow-sm">
                    <div className="flex items-center gap-6 group cursor-default">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-all duration-500 ring-4 ring-zinc-50">
                                <User className="w-7 h-7 text-zinc-600" />
                            </div>
                            {onlineUserIds.has(Number(user.id)) && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-lg">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <h3 className="font-bold text-base tracking-tight text-zinc-900 uppercase leading-none">{user.username}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {user.role}
                                </span>
                                <span className="text-zinc-200 font-bold">•</span>
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">ID: {String(user?.id || 0).padStart(4, '0')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="h-12 px-6 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 font-medium text-[11px] uppercase tracking-widest transition-all border border-transparent hover:border-zinc-200"
                        >
                            <Key className="w-4 h-4 mr-3" />
                            Settings
                        </Button>

                        <div className="w-[1px] h-8 bg-zinc-100 mx-2" />

                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => logout()}
                            className="h-12 px-6 rounded-2xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-medium text-[11px] uppercase tracking-widest transition-all border border-transparent hover:border-rose-100/50"
                        >
                            <Power className="w-4 h-4 mr-3" />
                            Logout
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-full flex flex-col p-0">
                        {children}
                    </div>
                </div>
            </main>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    );
}
