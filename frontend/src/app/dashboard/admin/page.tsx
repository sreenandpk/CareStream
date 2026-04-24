"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import DashboardShell from "@/components/DashboardShell";
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
        <DashboardShell>
            <div className="p-8 space-y-10 min-h-full max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80 italic">Unified Command Active</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-zinc-100 italic">
                            System <span className="text-rose-500">Overview</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-medium italic opacity-80">Infrastructure & clinical safety monitoring for CareStream Core.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            className="rounded-2xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest px-6 h-12 transition-all"
                            onClick={() => router.push("/dashboard/admin/logs")}
                        >
                            <Terminal className="w-4 h-4 mr-2 text-rose-500" />
                            Diagnostic Feed
                        </Button>
                    </div>
                </div>

            {/* 🔥 SECTION 1: CLINICAL STABILITY */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600 italic">Clinical Stability Pulse</span>
                    <div className="h-px flex-1 bg-zinc-900 border-b border-zinc-800/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-rose-500/5 border-rose-500/10 backdrop-blur-3xl hover:border-rose-500/30 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/alerts")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Active Crises</CardTitle>
                            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.active_crises ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">Active Critical Alerts</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-500/5 border-emerald-500/10 backdrop-blur-3xl hover:border-emerald-500/30 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/patients")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Bed Occupancy</CardTitle>
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.occupied_beds ?? 0)}<span className="text-zinc-700 text-lg">/{(stats.total_beds ?? 0)}</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">Current Patient Density</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-3xl hover:border-zinc-700 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/patients")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Historical Cases</CardTitle>
                            <Users className="w-4 h-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.total_patients ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">Total Admitted (Lifetime)</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5 border-blue-500/10 backdrop-blur-3xl hover:border-blue-500/30 transition-all cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Security Mask</CardTitle>
                            <Shield className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.security_alerts ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">Safeguard Lockouts</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 🔥 SECTION 2: INFRASTRUCTURE INTEGRITY */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600 italic">Hardware & Staff Integrity</span>
                    <div className="h-px flex-1 bg-zinc-900 border-b border-zinc-800/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-emerald-500/20 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/users")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Clinical Staff</CardTitle>
                            <UserCircle className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.active_staff ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-tight italic">Authenticated & Online</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-rose-500/20 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/devices")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Live Simulators</CardTitle>
                            <Server className="w-4 h-4 text-rose-400/50 group-hover:text-rose-500 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.active_simulators ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-tight italic">Synthetic Engine Units</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-blue-500/20 transition-all cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Fleet Integrity</CardTitle>
                            <RefreshCw className="w-4 h-4 text-blue-400/50 group-hover:text-blue-500 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-zinc-100">
                                {loadingStats ? "..." : (stats.total_devices ?? 0)}
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-tight italic">Total Registered Hardware</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-500/[0.02] border-emerald-500/10 backdrop-blur-xl border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest leading-none">System Health</CardTitle>
                            <Activity className="text-emerald-500/30 w-4 h-4 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-zinc-100 tracking-tighter italic">
                                {loadingStats ? "..." : (stats.system_health ?? "100.0")}%
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-tight italic">Operational Normality</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-10">
                <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 pb-6 bg-zinc-900/10">
                        <div>
                            <CardTitle className="text-lg">System Integrity Logs</CardTitle>
                            <CardDescription>Real-time audit trail of administrative actions.</CardDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-500 hover:text-white"
                            onClick={() => router.push("/dashboard/admin/logs")}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Live Feed
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="min-h-[250px] bg-black/20 font-mono text-xs">
                            {loadingLogs ? (
                                <div className="py-20 flex flex-col items-center justify-center text-zinc-700">
                                    <RefreshCw className="w-8 h-8 mb-4 animate-spin opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Synchronizing...</p>
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y divide-zinc-900/50">
                                    {logs.map((line, i) => (
                                        <div key={i} className="flex gap-4 p-4 hover:bg-white/[0.02] transition-colors group">
                                            <span className="text-zinc-800 select-none w-4 text-right">{i + 1}</span>
                                            <span className="text-zinc-400 group-hover:text-zinc-200 leading-relaxed">{line}</span>
                                        </div>
                                    ))}
                                    <div 
                                        className="p-4 text-center text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors bg-zinc-900/5 mt-2"
                                        onClick={() => router.push("/dashboard/admin/logs")}
                                    >
                                        View full log history →
                                    </div>
                                </div>
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center text-zinc-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 to-transparent">
                                    <LayoutDashboard className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-sm font-medium italic">No recent system events detected.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
            </div>
        </DashboardShell>
    );
}
