"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Zap,
    Fingerprint,
    ShieldAlert,
    Clock,
    FileText,
    History,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Activity
} from "lucide-react";
import { Label } from "@/components/ui/label";

const LOG_FILES = [
    { id: "app.log", label: "Activity", icon: Zap, color: "text-[#5C61F2]", bg: "bg-[#5C61F2]/5" },
    { id: "security.log", label: "Logins", icon: Fingerprint, color: "text-[#5C61F2]", bg: "bg-[#5C61F2]/5" },
    { id: "audit.log", label: "Changes", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "error.log", label: "Alerts", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
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
    const { user, accessToken, _hasHydrated } = useAuthStore();

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
    }, [activeTab, _hasHydrated, fetchLogs]);

    useEffect(() => {
        if (!autoRefresh || !_hasHydrated || !accessToken || !user || user.role !== "ADMIN") return;

        let socket: WebSocket | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        const connect = () => {
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
        };

        timeoutId = setTimeout(connect, 300);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (socket) socket.close();
        };
    }, [autoRefresh, activeTab, page, accessToken, _hasHydrated, user]);

    if (!_hasHydrated || !user) return null;

    return (
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Activity <span className="text-[#5C61F2]">Logs</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                        <Label htmlFor="auto-refresh" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Auto Refresh</Label>
                        <div 
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={cn(
                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out",
                                autoRefresh ? "bg-[#5C61F2]" : "bg-zinc-200"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm transform",
                                autoRefresh ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>
                    <Button 
                        onClick={() => fetchLogs(page)}
                        disabled={loading}
                        variant="outline"
                        className="h-14 px-8 rounded-2xl border-zinc-200 bg-white hover:bg-zinc-50 font-black text-[11px] uppercase tracking-widest text-zinc-600 transition-all shadow-sm"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-3", loading && "animate-spin text-[#5C61F2]")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* 📋 LOGS INTERFACE */}
            <div className="grid grid-cols-1 gap-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/50 p-2 rounded-[2rem] h-auto border border-zinc-200 shadow-sm flex flex-wrap gap-2 mb-8">
                        {LOG_FILES.map((log) => (
                            <TabsTrigger 
                                key={log.id} 
                                value={log.id}
                                className="data-[state=active]:bg-white data-[state=active]:text-[#5C61F2] data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-[#5C61F2]/10 flex items-center gap-4 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-all border border-transparent hover:border-zinc-200"
                            >
                                <log.icon className={cn("w-4 h-4", activeTab === log.id ? "text-[#5C61F2]" : "text-zinc-300")} />
                                {log.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {LOG_FILES.map((log) => (
                        <TabsContent key={log.id} value={log.id} className="mt-0 outline-none">
                            <Card className="bg-white border-none rounded-[3rem] shadow-sm overflow-hidden border border-zinc-100">
                                <CardHeader className="border-b border-zinc-50 p-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm", log.bg)}>
                                                <FileText className={cn("w-7 h-7", log.color)} />
                                            </div>
                                            <div className="text-left">
                                                <CardTitle className="text-2xl font-black tracking-tight text-zinc-900 uppercase">{log.label}</CardTitle>
                                                <CardDescription className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                                    System activity log
                                                </CardDescription>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 bg-zinc-50/50 p-2 rounded-2xl border border-zinc-100">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 bg-white shadow-sm hover:bg-zinc-50 rounded-xl transition-all border border-zinc-100"
                                                onClick={() => fetchLogs(Math.max(1, page - 1))}
                                                disabled={page === 1 || loading}
                                            >
                                                <ChevronLeft className="w-5 h-5 text-zinc-400" />
                                            </Button>
                                            <div className="text-[11px] font-black text-zinc-500 uppercase tracking-widest px-4">
                                                Page <span className="text-[#5C61F2]">{page}</span> / {totalPages}
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 bg-white shadow-sm hover:bg-zinc-50 rounded-xl transition-all border border-zinc-100"
                                                onClick={() => fetchLogs(Math.min(totalPages, page + 1))}
                                                disabled={page === totalPages || loading}
                                            >
                                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="h-[650px] w-full bg-white overflow-auto custom-scrollbar">
                                        {error ? (
                                            <div className="flex flex-col items-center justify-center h-full p-20 text-zinc-400 gap-6">
                                                <ShieldAlert className="w-16 h-16 text-rose-500/20" />
                                                <p className="text-sm font-black uppercase tracking-[0.2em]">{error}</p>
                                            </div>
                                        ) : lines.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full p-20 text-zinc-300 gap-6">
                                                <Activity className="w-16 h-16 text-zinc-100 animate-pulse" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">No logs found</p>
                                            </div>
                                        ) : (
                                            <div className="text-left p-10 space-y-2">
                                                {lines.map((line, idx) => {
                                                    const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("critical");
                                                    const isWarning = line.toLowerCase().includes("warning");
                                                    const isSuccess = line.toLowerCase().includes("success");
                                                    
                                                    return (
                                                        <div key={idx} className="flex gap-8 group hover:bg-zinc-50/50 p-2.5 rounded-xl transition-all border border-transparent hover:border-zinc-50">
                                                            <span className="text-zinc-300 font-black select-none min-w-[40px] text-right text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                                                                {(page - 1) * 50 + idx + 1}
                                                            </span>
                                                            <p className={cn(
                                                                "break-all font-bold tracking-tight text-[13px] leading-relaxed transition-colors",
                                                                isError ? "text-rose-600" :
                                                                isWarning ? "text-amber-600" :
                                                                isSuccess ? "text-emerald-600" : "text-zinc-500"
                                                            )}>
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
    );
}
