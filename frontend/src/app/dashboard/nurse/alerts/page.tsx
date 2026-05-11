"use client";

import { useAlertStore } from "@/store/alertStore";
import api from "@/lib/axios";
import { 
  BellRing, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Activity, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function NurseAlertCenter() {
  const { user } = useAuthStore();
  const { activeAlerts, removeAlert, setAlerts } = useAlertStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
        try {
            // Nurse specific alerts (shift-scoped)
            const response = await api.get(`alerts/nurse/?status=ACTIVE`);
            if (response.data.success) {
                const historical = response.data.data.map((a: any) => ({
                    id: a.id,
                    patient: a.patient_name || a.patient?.name || "HARDWARE_FAULT",
                    device_serial: a.device_serial || "UNKNOWN",
                    type: a.alert_type,
                    severity: a.severity,
                    message: a.message,
                    timestamp: a.created_at,
                    ward_name: a.ward_name,
                    room_number: a.room_number,
                    bed_number: a.bed_number
                }));
                setAlerts(historical);
            }
        } catch (e) {
            console.error("Nurse Alert Sync Error:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchHistory();
  }, [setAlerts, user]);

  const handleResolve = async (alertId: number) => {
    try {
        const response = await api.post(`alerts/nurse/${alertId}/resolve/`);
        if (response.data.success) {
            removeAlert(alertId);
            toast.success("Alert resolved and documented");
        }
    } catch (err) {
        toast.error("Failed to resolve alert");
    }
  };

  const filteredAlerts = activeAlerts.filter(a => {
    const pName = (typeof a.patient === 'string' ? a.patient : (a.patient as any)?.name || "SIGNAL_FAULT").toLowerCase();
    const aType = (a.type || "").toLowerCase();
    const wName = (a.ward_name || "").toLowerCase();
    const query = search.toLowerCase();

    return pName.includes(query) || aType.includes(query) || wName.includes(query);
  });

  const criticalCount = activeAlerts.filter(a => a.severity === "CRITICAL").length;

  // 🧠 CLINICAL SIGNAL CONSOLIDATION: Grouping alerts by patient to prevent alert fatigue.
  const groupedAlerts = filteredAlerts.reduce((acc: Record<string, any[]>, alert) => {
    const key = alert.patient || "SIGNAL_FAULT";
    if (!acc[key]) acc[key] = [];
    acc[key].push(alert);
    return acc;
  }, {});

  const patientGroups = Object.keys(groupedAlerts); // 📈 CLINICAL PAGINATION: Tracking independent pages for each patient cluster.
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const ALERTS_PER_PAGE = 4;

  const getPage = (pName: string) => pageMap[pName] || 0;
  const setPage = (pName: string, val: number) => setPageMap(prev => ({ ...prev, [pName]: val }));

  return (
    <div className="space-y-8 w-full p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 italic">
                        Shift Response Center
                    </span>
                </div>
                <h1 className="text-5xl font-black text-zinc-100 uppercase tracking-tighter leading-none">
                    Alert <span className="text-rose-500">Board</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium italic max-w-xl">
                    Consolidated clinical monitoring. All incidents are now aggregated by patient to ensure zero-latency crisis response without alert fatigue.
                </p>
            </div>

            <div className="flex gap-4">
                <div className="p-4 px-6 bg-rose-500/10 rounded-3xl border border-rose-500/20 backdrop-blur-md flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">High Acuity</span>
                    <span className="text-2xl font-black text-zinc-100">{criticalCount}</span>
                </div>
                <div className="p-4 px-6 bg-zinc-900/40 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Impacted Patients</span>
                    <span className="text-2xl font-black text-zinc-100">{patientGroups.length}</span>
                </div>
            </div>
        </div>

        {/* Global Warning for Nurses */}
        {criticalCount > 0 && (
            <div className="p-6 bg-rose-600 rounded-[2rem] border border-rose-500 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-6 text-white text-left">
                    <AlertTriangle className="w-10 h-10 animate-bounce" />
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-1">Life-Threatening Event Active</h4>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Immediate intervention required. Consolidated crisis cards are prioritized below.</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className="text-4xl font-black italic opacity-20">STAT</span>
                </div>
            </div>
        )}

        {/* Search */}
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-rose-500 transition-colors" />
            <Input
                placeholder="Search by patient, ward, or crisis type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-zinc-900/20 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-1 focus:ring-rose-500/50 transition-all uppercase font-medium text-xs tracking-tight"
            />
        </div>

        {/* Alerts Grid (Consolidated) */}
        <div className="grid grid-cols-1 gap-8">
            {patientGroups.length > 0 ? (
                patientGroups.map((patientName) => {
                    const group = groupedAlerts[patientName];
                    const hasCritical = group.some(a => a.severity === "CRITICAL");
                    const wardInfo = group[0].ward_name ? `Ward ${group[0].ward_name} • Rm ${group[0].room_number}` : "TELEMETRY LINK";
                    
                    const currentPage = getPage(patientName);
                    const startIndex = currentPage * ALERTS_PER_PAGE;
                    const paginatedAlerts = group.slice(startIndex, startIndex + ALERTS_PER_PAGE);
                    const totalPages = Math.ceil(group.length / ALERTS_PER_PAGE);

                    return (
                        <div 
                            key={patientName}
                            className={cn(
                                "group relative p-8 rounded-[3rem] border transition-all duration-500",
                                hasCritical 
                                    ? "bg-[#100000] border-rose-500/30 shadow-2xl shadow-rose-500/10" 
                                    : "bg-zinc-900/10 border-zinc-800 shadow-xl"
                            )}
                        >
                            {/* Header: Patient Info */}
                            <div className="flex flex-wrap items-center justify-between gap-6 mb-8 border-b border-zinc-800/50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                                        hasCritical ? "bg-rose-500 text-white" : "bg-zinc-800 text-zinc-400"
                                    )}>
                                        <BellRing className={cn("w-8 h-8", hasCritical && "animate-[pulse_1.5s_infinite]")} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2 underline decoration-rose-500/30 underline-offset-8">
                                            {patientName}
                                        </h3>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 px-3 py-1 rounded-full border border-zinc-900">
                                            {wardInfo} • Bed {group[0].bed_number}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-8 items-center">
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Incident Cluster</span>
                                        <span className="text-xl font-bold text-zinc-300">{group.length} Active Events</span>
                                    </div>
                                    
                                    {/* Clinical Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                disabled={currentPage === 0}
                                                onClick={() => setPage(patientName, currentPage - 1)}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-800 disabled:opacity-20"
                                            >
                                                <Activity className="w-4 h-4 rotate-180" />
                                            </Button>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest min-w-[60px] text-center">
                                                Page {currentPage + 1} / {totalPages}
                                            </span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                disabled={currentPage >= totalPages - 1}
                                                onClick={() => setPage(patientName, currentPage + 1)}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-800 disabled:opacity-20"
                                            >
                                                <Activity className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <Button 
                                        onClick={async () => {
                                            const tId = toast.loading(`Stabilizing cluster for ${patientName}...`);
                                            try {
                                                let successCount = 0;
                                                for (const a of group) {
                                                    try {
                                                        const res = await api.post(`alerts/nurse/${a.id}/resolve/`);
                                                        if (res.data.success) {
                                                            removeAlert(a.id);
                                                            successCount++;
                                                        }
                                                    } catch (e) {
                                                        console.error(`Failed to resolve alert ${a.id}`, e);
                                                    }
                                                }
                                                toast.success(`Successfully cleared ${successCount} incidents for ${patientName}`, { id: tId });
                                            } catch (err) {
                                                toast.error("Cluster stabilization encountered errors.", { id: tId });
                                            }
                                        }}
                                        className={cn(
                                            "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            hasCritical ? "bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-500/20 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                        )}
                                    >
                                        Stabilize & Clear All
                                    </Button>
                                </div>
                            </div>

                            {/* Signal Feed: Multi-Alert List (4 Columns) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {paginatedAlerts.map((alert) => (
                                    <div 
                                        key={alert.id}
                                        className="flex flex-col justify-between p-5 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-colors h-full"
                                    >
                                        <div className="flex gap-4 text-left mb-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                alert.severity === "CRITICAL" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                            )}>
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black text-zinc-200 uppercase tracking-tight mb-1">
                                                    {(alert.type || "INCIDENT").replace(/_/g, " ")}
                                                </h5>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide italic line-clamp-2">
                                                    "{alert.message}"
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <span className={cn(
                                                "text-[7px] font-black uppercase px-2 py-0.5 rounded border",
                                                alert.severity === "CRITICAL" ? "border-rose-500/30 text-rose-500" : "border-amber-500/30 text-amber-500"
                                            )}>
                                                {alert.severity}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[7px] font-bold text-zinc-600">
                                                <Clock className="w-2.5 h-2.5" />
                                                {(() => {
                                                    try {
                                                        const d = new Date(alert.timestamp);
                                                        return isNaN(d.getTime()) ? "JUST NOW" : formatDistanceToNow(d, { addSuffix: true });
                                                    } catch {
                                                        return "JUST NOW";
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center p-32 bg-zinc-950/20 rounded-[4rem] border border-zinc-900 backdrop-blur-sm">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mb-10">
                         <ShieldCheck className="w-12 h-12 text-emerald-500/30" />
                    </div>
                    <h3 className="text-3xl font-black text-zinc-600 uppercase tracking-tight">Clinical Homestasis</h3>
                    <p className="text-zinc-700 text-center mt-4 max-w-md font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                        Telemetry router reports all patient v-signals are within shift target parameters. No intervention required.
                    </p>
                </div>
            )}
        </div>
    );
}
