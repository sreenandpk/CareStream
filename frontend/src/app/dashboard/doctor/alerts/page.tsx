"use client";

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
  Stethoscope
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function DoctorAlertsPage() {
  const { user } = useAuthStore();
  const { activeAlerts, removeAlert, clearAlerts, setAlerts } = useAlertStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
        try {
            // Doctors use the same backend endpoint logic as Admin/Nurse
            const response = await api.get(`alerts/doctor/?status=ACTIVE`);
            if (response.data.success) {
                const historical = response.data.data.map((a: any) => ({
                    id: a.id,
                    patient: a.patient_name || a.patient?.name || "HARDWARE_FAULT",
                    patient_id: a.patient_id,
                    device_serial: a.device_serial || "UNKNOWN",
                    type: a.alert_type,
                    severity: a.severity,
                    message: a.message,
                    timestamp: a.created_at
                }));
                setAlerts(historical);
            }
        } catch (e) {
            console.error("Doctor Alert Sync: Failed to fetch history", e);
        } finally {
            setLoading(false);
        }
    };
    fetchHistory();
  }, [setAlerts, user]);

  const filteredAlerts = activeAlerts.filter(a => {
    const pName = (typeof a.patient === 'string' ? a.patient : (a.patient as any)?.name || "SIGNAL_FAULT").toLowerCase();
    const aType = (a.type || "").toLowerCase();
    const dSerial = (a.device_serial || "").toLowerCase();
    const query = search.toLowerCase();

    return pName.includes(query) || aType.includes(query) || dSerial.includes(query);
  });

  const criticalCount = filteredAlerts.filter(a => a.severity === "CRITICAL").length;

  const handleResolve = async (alertId: number) => {
    try {
        const res = await api.post(`alerts/doctor/${alertId}/resolve/`, {
            resolution_notes: "Physician acknowledged and managed incident."
        });
        if (res.data.success) {
            removeAlert(alertId);
        }
    } catch (err) {
        console.error("Resolution failed", err);
    }
  };

  // 🧠 CLINICAL SIGNAL CONSOLIDATION: Grouping alerts by patient to facilitate unified assessment.
  const groupedAlerts = filteredAlerts.reduce((acc: Record<string, any[]>, alert) => {
    const key = alert.patient || "SIGNAL_FAULT";
    if (!acc[key]) acc[key] = [];
    acc[key].push(alert);
    return acc;
  }, {});

  const patientGroups = Object.keys(groupedAlerts);
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const ALERTS_PER_PAGE = 4;

  const getPage = (pName: string) => pageMap[pName] || 0;
  const setPage = (pName: string, val: number) => setPageMap(prev => ({ ...prev, [pName]: val }));

  return (
    <div className="space-y-10 w-full p-8">
        {/* Physician Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">
                        Physician Incident Command
                    </span>
                </div>
                <h1 className="text-7xl font-black text-zinc-100 uppercase tracking-tighter leading-none">
                    Command <span className="text-indigo-500">Center</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium italic max-w-xl leading-relaxed">
                    Real-time clinical crises needing immediate medical oversight. This matrix groups incidents by patient cluster to ensure a unified high-fidelity response.
                </p>
            </div>

            <div className="flex gap-6">
                <div className="p-5 px-8 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 backdrop-blur-md flex flex-col items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">High Acuity</span>
                    <span className="text-3xl font-black text-zinc-100">{criticalCount}</span>
                </div>
                <div className="p-5 px-8 bg-zinc-900/40 rounded-[2rem] border border-zinc-800 backdrop-blur-md flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Impacted Patients</span>
                    <span className="text-3xl font-black text-zinc-100">{patientGroups.length}</span>
                </div>
            </div>
        </div>

        {/* Search */}
        <div className="relative group mb-12">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
            <Input
                placeholder="Search command stream by patient, type, or station ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-14 bg-zinc-900/20 border-zinc-800 text-zinc-100 h-16 rounded-[1.5rem] focus:ring-1 focus:ring-indigo-500/50 transition-all uppercase font-medium text-xs tracking-tight"
            />
        </div>

        {/* Command Matrix (Grouped by Patient) */}
        <div className="space-y-12">
            {patientGroups.length > 0 ? (
                patientGroups.map((patientName) => {
                    const group = groupedAlerts[patientName];
                    const hasCritical = group.some(a => a.severity === "CRITICAL");
                    const currentPage = getPage(patientName);
                    const totalPages = Math.ceil(group.length / ALERTS_PER_PAGE);
                    const paginatedAlerts = group.slice(currentPage * ALERTS_PER_PAGE, (currentPage + 1) * ALERTS_PER_PAGE);

                    return (
                        <div 
                            key={patientName}
                            className={cn(
                                "group relative p-10 rounded-[4rem] border transition-all duration-500",
                                hasCritical 
                                    ? "bg-[#0a0000] border-rose-500/30 shadow-2xl shadow-rose-500/10" 
                                    : "bg-zinc-900/10 border-zinc-800 shadow-xl"
                            )}
                        >
                            {/* Group Header */}
                            <div className="flex flex-wrap items-center justify-between gap-8 mb-10 border-b border-zinc-800/50 pb-10">
                                <div className="flex items-center gap-8">
                                    <div className={cn(
                                        "w-20 h-20 rounded-3xl flex items-center justify-center",
                                        hasCritical ? "bg-rose-600 text-white shadow-2xl shadow-rose-600/30" : "bg-indigo-600 text-white"
                                    )}>
                                        <BellRing className={cn("w-10 h-10", hasCritical && "animate-pulse")} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                                            {patientName}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-black/40 px-4 py-1.5 rounded-full border border-zinc-800">
                                                Active Incident Cluster
                                            </span>
                                            <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-tighter">
                                                ID: {group[0].patient_id} • Station: {group[0].device_serial}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Cluster Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/5">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                disabled={currentPage === 0}
                                                onClick={() => setPage(patientName, currentPage - 1)}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-800 disabled:opacity-10"
                                            >
                                                <Activity className="w-4 h-4 rotate-180" />
                                            </Button>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest min-w-[80px] text-center">
                                                Cluster {currentPage + 1} / {totalPages}
                                            </span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                disabled={currentPage >= totalPages - 1}
                                                onClick={() => setPage(patientName, currentPage + 1)}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-800 disabled:opacity-10"
                                            >
                                                <Activity className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <Button 
                                        onClick={async () => {
                                            const tId = toast.loading(`Clinical Signing: Cluster for ${patientName}...`);
                                            try {
                                                let successCount = 0;
                                                for (const a of group) {
                                                    try {
                                                        const res = await api.post(`alerts/doctor/${a.id}/resolve/`, {
                                                            resolution_notes: "Physician acknowledged and managed incident cluster."
                                                        });
                                                        if (res.data.success) {
                                                            removeAlert(a.id);
                                                            successCount++;
                                                        }
                                                    } catch (e) {
                                                        console.error(`Failed to resolve alert ${a.id}`, e);
                                                    }
                                                }
                                                toast.success(`Successfully documented ${successCount} incidents for ${patientName}`, { id: tId });
                                            } catch (err) {
                                                toast.error("Cluster signing encountered logic errors.", { id: tId });
                                            }
                                        }}
                                        className={cn(
                                            "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            hasCritical ? "bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-500/20 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                        )}
                                    >
                                        Sign & Resolve All
                                    </Button>
                                    <span className="text-zinc-600 text-sm font-black uppercase tracking-widest mr-4">{group.length} SIGS</span>
                                </div>
                            </div>

                            {/* 4-Column Alert Matrix */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {paginatedAlerts.map((alert) => (
                                    <div 
                                        key={alert.id}
                                        className="p-6 rounded-[2rem] bg-zinc-950/40 border border-zinc-800/50 flex flex-col justify-between h-full hover:border-indigo-500/30 transition-all group/card"
                                    >
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-start">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    alert.severity === "CRITICAL" ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-400"
                                                )}>
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-widest",
                                                    alert.severity === "CRITICAL" ? "border-rose-500/30 text-rose-500" : "border-indigo-500/30 text-indigo-400"
                                                )}>
                                                    {alert.severity}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-zinc-100 uppercase tracking-tight mb-2 leading-none">
                                                    {(alert.type || "INCIDENT").replace(/_/g, " ")}
                                                </h4>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase italic leading-relaxed line-clamp-2">
                                                    "{alert.message}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-zinc-900 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-zinc-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[9px] font-black">
                                                        {(() => {
                                                            try {
                                                                const d = new Date(alert.timestamp);
                                                                return isNaN(d.getTime()) ? "JUST NOW" : formatDistanceToNow(d, { addSuffix: true });
                                                            } catch {
                                                                return "JUST NOW";
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => handleResolve(alert.id)}
                                                className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-indigo-600 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all gap-2"
                                            >
                                                <Stethoscope className="w-3.5 h-3.5" />
                                                Sign & Close
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center p-40 bg-zinc-950/20 rounded-[5rem] border border-zinc-900 backdrop-blur-sm">
                    <div className="w-24 h-24 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-10">
                         <ShieldCheck className="w-12 h-12 text-indigo-500/30" />
                    </div>
                    <h3 className="text-4xl font-black text-zinc-700 uppercase tracking-tight leading-none mb-4">Command Normal</h3>
                    <p className="text-zinc-800 text-center max-w-md font-bold uppercase text-[11px] tracking-[0.2em] leading-relaxed">
                        No active physiological triggers or hardware failures reported across shift terminals. Medical oversight is currently in standby.
                    </p>
                </div>
            )}
        </div>
    );
}
