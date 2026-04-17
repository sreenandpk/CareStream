"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Terminal, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    AlertCircle, 
    ShieldCheck, 
    Activity,
    FileText,
    History,
    LogOut
} from "lucide-react";
import { Label } from "@/components/ui/label";
import DashboardShell from "@/components/DashboardShell";

const LOG_FILES = [
    { id: "app.log", label: "Application", icon: Activity, color: "text-blue-400" },
    { id: "security.log", label: "Security", icon: ShieldCheck, color: "text-rose-400" },
    { id: "audit.log", label: "Audit", icon: History, color: "text-emerald-400" },
    { id: "error.log", label: "Errors", icon: AlertCircle, color: "text-amber-400" },
];

export default function LogsPage() {
    const [activeTab, setActiveTab] = useState("app.log");
    const [lines, setLines] = useState<string[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState("");
    const router = useRouter();
    const { user, accessToken, _hasHydrated, logout } = useAuthStore();

    useEffect(() => {
        if (_hasHydrated) {
            if (!user || user.role !== "ADMIN") {
                router.push("/login");
            }
        }
    }, [user, _hasHydrated, router]);

    const fetchLogs = useCallback(async (pageNum = page) => {
        const targetTab = activeTab;
        setLoading(true);
        setError("");
        try {
            const response = await api.get(`core/logs/${targetTab}/`, {
                params: { page: pageNum, page_size: 50 }
            });
            
            if (targetTab === activeTab) {
                setLines(response.data.lines);
                setTotalPages(response.data.total_pages);
                setPage(response.data.page);
            }
        } catch (err: any) {
            if (targetTab === activeTab) {
                setError(err.response?.data?.error || "Failed to load log files.");
            }
        } finally {
            if (targetTab === activeTab) {
                setLoading(false);
            }
        }
    }, [activeTab, page]);

    useEffect(() => {
        if (_hasHydrated) {
            fetchLogs(1); 
            setPage(1);
        }
    }, [activeTab, _hasHydrated]);

    useEffect(() => {
        if (!autoRefresh || !_hasHydrated || !accessToken || !user || user.role !== "ADMIN") return;

        let socket: WebSocket | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        timeoutId = setTimeout(() => {
            setStatus("connecting");
            const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(/\/$/, "");
            const path = baseUrl.endsWith("/ws") ? "/logs/" : "/ws/logs/";
            const wsUrl = `${baseUrl}${path}?token=${encodeURIComponent(accessToken)}`;

            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setStatus("connected");
                setError("");
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.message && data.message.text && data.message.logger) {
                    const { text, logger } = data.message;
                    const loggerToFileMap: Record<string, string> = {
                        'app': 'app.log',
                        'django': 'app.log',
                        'security': 'security.log',
                        'audit': 'audit.log',
                        'django.request': 'error.log'
                    };
                    const targetFile = loggerToFileMap[logger] || 'app.log';
                    if (targetFile === activeTab && page === 1) {
                        setLines(prev => [text, ...prev.slice(0, 49)]);
                    }
                }
            };

            socket.onclose = () => setStatus("disconnected");
            socket.onerror = () => setStatus("disconnected");
        }, 300);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (socket) socket.close();
        };
    }, [autoRefresh, activeTab, page, accessToken, _hasHydrated, user]);

    if (!_hasHydrated || !user) return null;

    return (
        <DashboardShell>
            <div className="p-8 space-y-8 min-h-full">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.push("/dashboard/admin")}
                                className="p-2 mr-2 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition-all group"
                            >
                                <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">System Logs</h1>
                                <p className="text-zinc-500 mt-1 font-medium italic">High-Fidelity Audit Trail & Infrastructure Diagnostic Feed.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    status === "connected" ? "bg-emerald-500 animate-pulse" : 
                                    status === "connecting" ? "bg-amber-500 animate-bounce" : 
                                    "bg-rose-500"
                                }`} />
                                <input 
                                    type="checkbox"
                                    id="live-stream" 
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-blue-500 focus:ring-blue-500/20"
                                />
                                <Label htmlFor="live-stream" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer">
                                    {status === "connected" ? "Live Real-time" : status === "connecting" ? "Connecting..." : "Stream Paused"}
                                </Label>
                            </div>
                            <div className="w-px h-6 bg-zinc-800" />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    fetchLogs(1);
                                    setPage(1);
                                }}
                                disabled={loading}
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 font-bold text-[10px] uppercase tracking-wider"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Sync History
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                        <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl h-auto">
                            {LOG_FILES.map((log) => {
                                const Icon = log.icon;
                                return (
                                    <TabsTrigger 
                                        key={log.id} 
                                        value={log.id}
                                        className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white px-6 py-2.5 rounded-lg transition-all"
                                    >
                                        <Icon className={`w-4 h-4 mr-2 ${log.color}`} />
                                        <span className="font-bold tracking-tight">{log.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {LOG_FILES.map((log) => (
                            <TabsContent key={log.id} value={log.id} className="mt-0 outline-none">
                                <Card className="bg-black/40 border-zinc-800/50 shadow-2xl backdrop-blur-md overflow-hidden">
                                    <CardHeader className="border-b border-zinc-800/50 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                                                    <FileText className={`w-5 h-5 ${log.color}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg tracking-tight">/{log.id}</CardTitle>
                                                    <CardDescription className="text-zinc-500 font-mono text-[10px]">
                                                        backend/logs/{log.id}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-8 w-8 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                                                    onClick={() => fetchLogs(Math.max(1, page - 1))}
                                                    disabled={page === 1 || loading}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                                    Page <span className="text-white">{page}</span> / {totalPages}
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-8 w-8 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                                                    onClick={() => fetchLogs(Math.min(totalPages, page + 1))}
                                                    disabled={page === totalPages || loading}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="h-[600px] w-full bg-[#050505] overflow-auto custom-scrollbar">
                                            {error ? (
                                                <div className="flex flex-col items-center justify-center h-full p-20 text-zinc-500 gap-4">
                                                    <AlertCircle className="w-12 h-12 text-rose-500/50" />
                                                    <p className="text-sm font-medium">{error}</p>
                                                </div>
                                            ) : lines.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full p-20 text-zinc-500 gap-4">
                                                    <Activity className="w-12 h-12 text-zinc-800 animate-pulse" />
                                                    <p className="text-sm font-medium">No system events in this segment.</p>
                                                </div>
                                            ) : (
                                                <div className="font-mono text-[11px] p-6 space-y-1">
                                                    {lines.map((line, idx) => {
                                                        const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("critical");
                                                        const isWarning = line.toLowerCase().includes("warning");
                                                        const isSuccess = line.toLowerCase().includes("success") || line.toLowerCase().includes("info");
                                                        
                                                        return (
                                                            <div key={idx} className="flex gap-4 group hover:bg-white/5 py-1 px-2 rounded-sm transition-colors cursor-text">
                                                                <span className="text-zinc-700 select-none min-w-[32px] text-right">
                                                                    {(page - 1) * 50 + idx + 1}
                                                                </span>
                                                                <p className={`
                                                                    break-all 
                                                                    ${isError ? "text-rose-400 font-bold" : ""}
                                                                    ${isWarning ? "text-amber-400 font-medium" : ""}
                                                                    ${isSuccess ? "text-emerald-400" : "text-zinc-400"}
                                                                `}>
                                                                    {line}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </DashboardShell>
    );
}
