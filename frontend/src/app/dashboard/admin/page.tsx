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
        auth_blocks: 0,
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
                params: { page: 1, page_size: 5 }
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
        }
    }, [user, _hasHydrated]);

    if (!_hasHydrated) return null;

    return (
        <DashboardShell>
            <div className="p-8 space-y-8 min-h-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">System Overview</h1>
                        <p className="text-zinc-500 mt-2 font-medium italic">Unified Command for CareStream Infrastructure & Clinical Safety.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            className="bg-black/40 border-zinc-800 hover:bg-zinc-900"
                            onClick={() => router.push("/dashboard/admin/logs")}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Diagnostic Feed
                        </Button>
                    </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-zinc-700 transition-all cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Staff & Community</CardTitle>
                        <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {loadingStats ? "..." : stats.total_users}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Total registered in CareStream</p>
                    </CardContent>
                </Card>
                
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-zinc-700 transition-all cursor-pointer group" onClick={() => router.push("/dashboard/admin/users")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Caregivers Online</CardTitle>
                        <ShieldAlert className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {loadingStats ? "..." : stats.active_staff}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Active professional staff</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-zinc-700 transition-all cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Active Safeguards</CardTitle>
                        <Terminal className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {loadingStats ? "..." : stats.security_alerts}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Current security lockouts</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:border-zinc-700 transition-all cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider">System Health</CardTitle>
                        <Activity className="text-blue-500 w-4 h-4 group-hover:scale-110 transition-transform animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {loadingStats ? "..." : stats.system_health}%
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Operational integrity</p>
                    </CardContent>
                </Card>
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
