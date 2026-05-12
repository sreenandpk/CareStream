"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
    LayoutDashboard, 
    Users, 
    Activity, 
    Shield, 
    ArrowUpRight, 
    LogOut, 
    Key,
    UserCircle,
    Server,
    Clock,
    ShieldAlert,
    Terminal,
    Settings,
    UserPlus,
    RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
    const { user, _hasHydrated, logout } = useAuthStore();
    const router = useRouter();
    const [logs, setLogs] = useState<string[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [stats, setStats] = useState({
        total_users: 0,
        active_staff: 0,
        security_alerts: 0,
        total_patients: 0,
        occupied_beds: 0,
        total_beds: 0,
        active_crises: 0,
        total_devices: 0,
        active_simulators: 0,
        real_hardware: 0,
        system_health: "100.0"
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (_hasHydrated) {
            if (!user || user.role !== "ADMIN") {
                router.push("/login");
            }
        }
    }, [user, _hasHydrated, router]);

    const fetchRecentLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await api.get("core/logs/audit.log/", {
                params: { page: 1, page_size: 8 }
            });
            setLogs(response.data.lines);
        } catch (err) {
            console.error("Failed to fetch dashboard logs", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const response = await api.get("accounts/dashboard-stats/");
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (_hasHydrated && user && user.role === "ADMIN") {
            fetchStats();
            fetchRecentLogs();
            
            // Refresh stats every 30 seconds for real-time feel
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [user, _hasHydrated]);

    if (!_hasHydrated) return null;

    return (
        <div className="p-10 pt-16 space-y-12 w-full max-w-[1600px] mx-auto min-h-screen bg-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="text-left">
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                            Admin <span className="text-[#5C61F2]">Dashboard</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => { fetchStats(); fetchRecentLogs(); }}
                        disabled={loadingStats || loadingLogs}
                        variant="outline"
                        className="rounded-2xl bg-white border-zinc-200 h-14 px-8 hover:bg-zinc-50 font-black text-[11px] uppercase tracking-widest text-zinc-600 transition-all shadow-sm"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-3", (loadingStats || loadingLogs) && "animate-spin text-[#5C61F2]")} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* 📊 Core Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div 
                    onClick={() => router.push("/dashboard/admin/users")}
                    className="group relative bg-gradient-to-br from-[#5C61F2]/5 to-white p-8 rounded-[2.5rem] border border-[#5C61F2]/20 hover:shadow-2xl hover:shadow-[#5C61F2]/10 transition-all duration-500 cursor-pointer active:scale-[0.98] h-[220px] flex flex-col justify-between overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C61F2]">Staff Members</span>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-[#5C61F2]/10">
                            <Users className="w-5 h-5 text-[#5C61F2]" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-5xl font-black text-zinc-900 tracking-tighter leading-none mb-3">{stats.total_users}</p>
                        <p className="text-[10px] font-black text-[#5C61F2]/60 uppercase tracking-widest">Active Staff</p>
                    </div>
                </div>

                {/* 🏥 Occupancy Card */}
                <div 
                    onClick={() => router.push("/dashboard/admin/patients")}
                    className="group relative bg-gradient-to-br from-emerald-50 to-white p-8 rounded-[2.5rem] border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 cursor-pointer active:scale-[0.98] h-[220px] flex flex-col justify-between overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Hospital Patients</span>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-emerald-50">
                            <Activity className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-5xl font-black text-emerald-950 tracking-tighter leading-none mb-3">
                            {stats.occupied_beds}<span className="text-emerald-300 text-3xl ml-1">/{stats.total_beds}</span>
                        </p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Beds Occupied</p>
                    </div>
                </div>

                {/* 🔌 Infrastructure Card */}
                <div 
                    onClick={() => router.push("/dashboard/admin/devices")}
                    className="group relative bg-gradient-to-br from-amber-50 to-white p-8 rounded-[2.5rem] border border-amber-100 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 cursor-pointer active:scale-[0.98] h-[220px] flex flex-col justify-between overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Medical Devices</span>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-amber-50">
                            <Server className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-5xl font-black text-amber-950 tracking-tighter leading-none mb-3">{stats.total_devices}</p>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Devices in Use</p>
                    </div>
                </div>

                {/* 🛡️ Security Logs Card */}
                <div 
                    onClick={() => router.push("/dashboard/admin/logs")}
                    className="group relative bg-gradient-to-br from-rose-50 to-white p-8 rounded-[2.5rem] border border-rose-100 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-500 cursor-pointer active:scale-[0.98] h-[220px] flex flex-col justify-between overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Security Logs</span>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-rose-50">
                            <Shield className="w-5 h-5 text-rose-600" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-5xl font-black text-rose-950 tracking-tighter leading-none mb-3">{stats.security_alerts}</p>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Audit Events</p>
                    </div>
                </div>
            </div>

            {/* 📋 AUDIT FEED & SYSTEM HEALTH */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white border-none rounded-[3rem] shadow-sm overflow-hidden border border-zinc-100">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between border-b border-zinc-50">
                        <div className="text-left">
                            <CardTitle className="text-2xl font-black tracking-tight text-zinc-900 uppercase">Recent Activity</CardTitle>
                            <CardDescription className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-1">A log of recent system and security events</CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-2xl bg-zinc-50 border-none shadow-sm hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest px-6 h-12 transition-all active:scale-95 text-zinc-500"
                            onClick={fetchRecentLogs}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", loadingLogs && "animate-spin")} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="min-h-[450px]">
                            {loadingLogs ? (
                                <div className="p-10 space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                      <Skeleton key={i} className="h-16 w-full border-none bg-zinc-50 rounded-2xl" />
                                    ))}
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y divide-zinc-50">
                                    {logs.map((line, i) => {
                                        const isCritical = line.toLowerCase().includes('error') || line.toLowerCase().includes('alert');
                                        const isSecurity = line.toLowerCase().includes('auth') || line.toLowerCase().includes('token') || line.toLowerCase().includes('otp');
                                        
                                        return (
                                            <div key={i} className="px-10 py-5 flex items-start gap-6 hover:bg-zinc-50/40 transition-all group border-l-4 border-l-transparent hover:border-l-[#5C61F2]">
                                                <div className="flex flex-col items-center pt-1.5 text-left">
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                                        isCritical ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : 
                                                        isSecurity ? "bg-amber-500" : "bg-[#5C61F2]/20 group-hover:bg-[#5C61F2]"
                                                    }`} />
                                                    <div className="w-px h-full bg-zinc-100 mt-2 group-last:hidden" />
                                                </div>
                                                <div className="flex-1 space-y-1 text-left">
                                                    <p className={`text-sm font-bold transition-colors ${
                                                        isCritical ? "text-rose-900" : "text-zinc-600 group-hover:text-zinc-900"
                                                    }`}>
                                                        {line}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {isSecurity ? "Security" : isCritical ? "Alert" : "Activity"}
                                                        </span>
                                                        {isSecurity && <Shield className="w-3 h-3 text-amber-500" />}
                                                        {isCritical && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Terminal className="w-4 h-4 text-zinc-300" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button 
                                        className="w-full py-6 text-[11px] font-black text-zinc-400 hover:text-[#5C61F2] transition-colors uppercase tracking-[0.3em] bg-zinc-50/20 group border-t border-zinc-50"
                                        onClick={() => router.push("/dashboard/admin/logs")}
                                    >
                                        <span className="group-hover:mr-2 transition-all inline-block">View Full History</span>
                                        <ArrowUpRight className="w-3 h-3 inline-block opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-zinc-300">
                                    <Terminal className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 text-zinc-400">No activity found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="bg-white border-none rounded-[3rem] shadow-sm p-10">
                        <div className="text-left mb-8">
                            <CardTitle className="text-xl font-black tracking-tight text-zinc-900 uppercase">Staff Overview</CardTitle>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Current personnel and simulation status</p>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-[#5C61F2]/5 border border-[#5C61F2]/10">
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-[#5C61F2]/5">
                                    <UserCircle className="w-7 h-7 text-[#5C61F2]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1">{stats.active_staff}</p>
                                    <p className="text-[10px] font-black text-[#5C61F2] uppercase tracking-widest">Active Clinical Staff</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-[#5C61F2]/5 border border-[#5C61F2]/10">
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-[#5C61F2]/5">
                                    <Server className="w-7 h-7 text-[#5C61F2]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1">{stats.active_simulators}</p>
                                    <p className="text-[10px] font-black text-[#5C61F2] uppercase tracking-widest">Simulated Patients</p>
                                </div>
                            </div>

                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#5C61F2] to-[#4A4ED4] border-none rounded-[3rem] shadow-2xl shadow-[#5C61F2]/30 p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10 text-left">
                            <Settings className="w-10 h-10 text-white/40 mb-6 group-hover:rotate-90 transition-transform duration-1000" />
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">System Settings</h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-relaxed">Manage system configurations and users.</p>
                            <Button 
                                onClick={() => router.push("/dashboard/admin/users")}
                                className="w-full mt-8 h-14 bg-white text-[#5C61F2] hover:bg-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 border-none"
                            >
                                Open Settings
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    );
}
