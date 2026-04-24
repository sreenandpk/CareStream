"use client";

import DashboardShell from "@/components/DashboardShell";
import { useAlertStore } from "@/store/alertStore";
import api from "@/lib/axios";
import { 
  BellRing, 
  Search, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Activity, 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

export default function AlertsAdminPage() {
  const { activeAlerts, removeAlert, clearAlerts, setAlerts } = useAlertStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const response = await api.get("alerts/admin/?status=ACTIVE");
            if (response.data.success) {
                // Map backend to frontend schema
                const historical = response.data.data.map((a: any) => ({
                    id: a.id,
                    patient: a.patient_name || "HARDWARE_FAULT",
                    device_serial: a.device_serial || "UNKNOWN",
                    type: a.alert_type,
                    severity: a.severity,
                    message: a.message,
                    timestamp: a.created_at
                }));
                setAlerts(historical);
            }
        } catch (e) {
            console.error("Alert Sync: Failed to fetch history");
        } finally {
            setLoading(false);
        }
    };
    fetchHistory();
  }, [setAlerts]);

  const filteredAlerts = activeAlerts.filter(a => 
    a.patient.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.device_serial.toLowerCase().includes(search.toLowerCase())
  );

  const criticalCount = activeAlerts.filter(a => a.severity === "CRITICAL").length;

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 italic">
                        Crisis Response Center
                    </span>
                </div>
                <h1 className="text-5xl font-black text-zinc-100 uppercase tracking-tighter leading-none">
                    Alert <span className="text-rose-500">Center</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium italic max-w-xl">
                    Real-time hardware faults and clinical crises. Acknowledging an alert here synchronizes the response across the clinical staff directory.
                </p>
            </div>

            <div className="flex gap-4">
                <div className="p-4 px-6 bg-zinc-900/40 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Critical</span>
                    <span className="text-2xl font-black text-zinc-100">{criticalCount}</span>
                </div>
                <div className="p-4 px-6 bg-zinc-900/40 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Active</span>
                    <span className="text-2xl font-black text-zinc-100">{activeAlerts.length}</span>
                </div>
                <Button 
                    variant="outline" 
                    onClick={clearAlerts}
                    disabled={activeAlerts.length === 0}
                    className="h-auto rounded-3xl px-6 border-zinc-800 bg-zinc-900/40 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Purge All
                </Button>
            </div>
        </div>

        {/* Filters */}
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-rose-500 transition-colors" />
            <Input
                placeholder="Search alerts by patient, type, or hardware ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-zinc-900/20 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-1 focus:ring-rose-500/50 transition-all uppercase font-medium text-xs tracking-tight"
            />
        </div>

        {/* Alerts List */}
        <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                    <div 
                        key={alert.id}
                        className={cn(
                            "group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 backdrop-blur-md",
                            alert.severity === "CRITICAL" 
                                ? "bg-rose-500/5 border-rose-500/20 shadow-rose-500/5" 
                                : "bg-zinc-900/20 border-zinc-800/50"
                        )}
                    >
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "p-4 rounded-2xl",
                                alert.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                                {alert.severity === "CRITICAL" ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6" />}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight">
                                        {alert.type.replace(/_/g, " ")}
                                    </h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        alert.severity === "CRITICAL" ? "bg-rose-500 text-white" : "bg-amber-500/20 text-amber-500"
                                    )}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <p className="text-zinc-500 text-sm font-medium">
                                    {alert.message} for <span className="text-zinc-300">Patient {alert.patient}</span> [Device: {alert.device_serial}]
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">
                                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mt-1">Telemetry Origin: SIMULATION</span>
                            </div>

                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeAlert(alert.id)}
                                    className="h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Resolve
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-32 bg-zinc-950/50 rounded-[3rem] border border-dashed border-zinc-900 backdrop-blur-sm">
                    <ShieldCheck className="w-16 h-16 text-zinc-800 mb-6" />
                    <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-tight">Clinical Stasis</h3>
                    <p className="text-zinc-600 text-center mt-3 max-w-sm font-medium italic">
                        All monitored hardware signals are within normal operating ranges. No active clinical crises detected.
                    </p>
                </div>
            )}
        </div>
      </div>
    </DashboardShell>
  );
}
