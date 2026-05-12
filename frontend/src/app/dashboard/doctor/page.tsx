"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import api from "@/lib/axios";
import useVitalsSocket from "@/hooks/useVitalsSocket";
import { useVitalsStore } from "@/store/vitalsStore";
import { 
    Activity, 
    User, 
    Clock, 
    FileText, 
    Search,
    Stethoscope,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Pill,
    Plus,
    Send,
    Heart,
    Bell,
    History,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAlertStore } from "@/store/alertStore";
import HistoricalExplorer from "@/components/vitals/HistoricalExplorer";
import VitalCard from "@/components/vitals/VitalCard";

export default function DoctorDashboard() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const ALERTS_PER_PAGE = 4;
    const [alertPage, setAlertPage] = useState(0);
    
    // 🔔 ALERT ENGINE
    const { activeAlerts } = useAlertStore();
    const [reviewContext, setReviewContext] = useState<{ id: number; serial: string; name: string } | null>(null);
    const { vitalsMap, connected: wsConnected } = useVitalsStore();

    // 🛡️ NUCLEAR GUARD (Cannot be bypassed by re-renders)
    const initRef = useRef(false);

    // 🫀 ACTIVE TELEMETRY LINK
    const activeVitals = useMemo(() => {
        if (!selectedPatient) return null;
        
        // Find by case-insensitive serial (Standard)
        const patientSerial = (selectedPatient.device_serial || '').toLowerCase();
        const node = Object.values(vitalsMap).find((v: any) => (v.device?.serial || '').toLowerCase() === patientSerial);
        
        if (node) return node;
        
        // Fallback: If node has the patient.id (Surgical Priority)
        return Object.values(vitalsMap).find((v: any) => v.patient?.id === selectedPatient.id);
    }, [vitalsMap, selectedPatient]);

    // 🚨 PATIENT-SPECIFIC ALERTS
    const currentPatientAlerts = useMemo(() => {
        if (!selectedPatient) return [];
        return activeAlerts.filter(a => a.patient_id === selectedPatient.id);
    }, [activeAlerts, selectedPatient]);

    // 🔄 PAGINATION RESET
    useEffect(() => {
        setAlertPage(0);
    }, [selectedPatient?.id]);


    // 🔄 STANDALONE FETCH (No dependencies)
    const pullData = async (forcedId?: number) => {
        try {
            setLoading(true);
            const res = await api.get("patients/doctor/patients/");
            if (res.data.success) {
                const data = res.data.data;
                setPatients(data);
                if (data.length > 0) {
                    const p = forcedId ? data.find((x: any) => x.id === forcedId) : data[0];
                    setSelectedPatient(p || data[0]);
                }
            }
        } catch (e) {
            console.error("Fetch failure", e);
        } finally {
            setLoading(false);
        }
    };

    // 🛡️ ONE-TIME MOUNT GATE
    useEffect(() => {
        if (!initRef.current && _hasHydrated) {
            if (user?.role === "DOCTOR") {
                initRef.current = true;
                pullData();
            } else if (user) {
                initRef.current = true;
                router.push("/login");
            }
        }
    }, [_hasHydrated, user?.role, router]);


    const handleLogout = () => {
        useAuthStore.getState().logout();
        router.push("/login");
    };


    const handleUpdateCondition = async (cond: string, reason: string = "AI Suggested Optimization") => {
        const tId = toast.loading(`Updating Clinical Status: ${selectedPatient?.name}...`);
        try {
            await api.post(`patients/${selectedPatient?.id}/update-condition/`, {
                clinical_condition: cond,
                reason: reason
            });
            toast.success("Condition Updated", { id: tId });
            pullData(selectedPatient?.id);
        } catch (err) {
            toast.error("Failed to update status", { id: tId });
        }
    };

    const handleResolve = async (alertId: number) => {
        try {
            const res = await api.post(`alerts/doctor/${alertId}/resolve/`, {
                resolution_notes: "Physician acknowledged and managed incident via dashboard hub."
            });
            if (res.data.success) {
                useAlertStore.getState().removeAlert(alertId);
            }
        } catch (err) {
            console.error("Resolution failed", err);
        }
    };

    if (!_hasHydrated || !user) return null;

    return (
        <>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8F9FB] text-zinc-900 px-2">
                
                {/* 📋 ROUNDS LIST (30%) */}
                <div className="w-[380px] border-r border-zinc-200/60 flex flex-col bg-white">
                    <div className="p-6 border-b border-zinc-100 bg-zinc-50/20">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Stethoscope className="w-5 h-5 text-indigo-500" />
                                Patient Overview
                            </h1>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                wsConnected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 animate-pulse"
                            )} />
                        </div>
                        {!wsConnected && (
                            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Connection Lost</p>
                                    <p className="text-[8px] text-rose-400 font-bold italic">Session likely expired. Please logout and login again.</p>
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text"
                                placeholder="Filter Rounds list..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200/60 rounded-xl py-2 pl-10 pr-4 text-[10px] focus:outline-none focus:border-[#5C61F2]/50 transition-all font-medium text-zinc-600"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse text-zinc-700">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-center">Calibrating Physician rounds...</span>
                            </div>
                        )}
                        
                        {!loading && patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((patient) => (
                            <button
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden",
                                    selectedPatient?.id === patient.id 
                                        ? "bg-zinc-50 border-[#5C61F2]/20 shadow-sm" 
                                        : "bg-transparent border-transparent hover:bg-zinc-50/50 hover:border-zinc-100"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black uppercase tracking-tight text-zinc-900">{patient.name}</span>
                                            {patient.mode === "SIMULATION" && (
                                                <span className="px-1 text-[7px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-[2px] uppercase tracking-tighter">SIM</span>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                                            Bed R{patient.bed_number || "---"} • {patient.age}y {patient.gender}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <ChevronRight className={cn(
                                            "w-4 h-4 transition-transform",
                                            selectedPatient?.id === patient.id ? "text-indigo-500" : "text-zinc-800 group-hover:translate-x-1"
                                        )} />
                                        </div>
                                    </div>
                                </button>
                        ))}
                    </div>
                </div>

                {/* 🏥 CLINICAL OVERVIEW (70%) */}
                <div className="flex-1 bg-white flex flex-col relative border-r border-zinc-200/60 shadow-sm">
                    {!selectedPatient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <Stethoscope className="w-20 h-20 text-zinc-800 mb-6" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-8 border-b border-zinc-100 bg-gradient-to-br from-zinc-50/50 to-transparent">
                                    <div className="flex justify-between items-start gap-8 mb-8">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-4 mb-2">
                                               <h2 className="text-6xl font-black uppercase tracking-[calc(-0.05em)] text-zinc-900 truncate">
                                                   {selectedPatient.name}
                                               </h2>
                                               <div className="flex-shrink-0 px-3 py-1 rounded-full bg-[#5C61F2]/10 border border-[#5C61F2]/20 text-[#5C61F2] text-[10px] font-black uppercase tracking-widest">
                                                   In Hospital
                                               </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] items-center">
                                                <span className="flex items-center gap-2">P-{selectedPatient.id}</span>
                                                <span className="flex items-center gap-2">Device: {selectedPatient.device_serial || "---"}</span>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 flex gap-3 text-nowrap self-start">
                                            {selectedPatient.device_id && (
                                                <button 
                                                    onClick={() => setReviewContext({
                                                        id: selectedPatient.device_id,
                                                        serial: selectedPatient.device_serial,
                                                        name: selectedPatient.name
                                                    })}
                                                    className="w-14 h-14 rounded-3xl bg-white border border-zinc-200/60 text-zinc-400 hover:text-[#5C67F2] hover:border-[#5C67F2]/30 shadow-sm hover:shadow-md transition-all flex items-center justify-center group/hist relative active:scale-95"
                                                    title="Watch History"
                                                >
                                                    <History className="w-6 h-6 group-hover/hist:rotate-[-45deg] transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>



                                 {/* 📟 CLINICAL MONITORING (High Fidelity) */}
                                <div className="px-8 pb-8">
                                    {activeVitals ? (
                                        <div className="rounded-3xl overflow-hidden border border-zinc-200/60 shadow-lg">
                                            <VitalCard data={activeVitals} onReview={() => setReviewContext({
                                                id: selectedPatient.device_id,
                                                serial: selectedPatient.device_serial,
                                                name: selectedPatient.name
                                            })} />
                                        </div>
                                    ) : (
                                        <div className="h-[340px] rounded-3xl border border-dashed border-zinc-200/60 flex flex-col items-center justify-center bg-zinc-50/50">
                                            <div className="w-12 h-12 rounded-full border-2 border-zinc-200/60 flex items-center justify-center mb-4">
                                                <Activity className="w-5 h-5 text-zinc-400 animate-pulse" />
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Scanning...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 📝 SIDEBAR (RIGHT) */}
                {selectedPatient && (
                    <div className="w-[300px] bg-white p-8 space-y-8 border-l border-zinc-100">
                        <div className="space-y-6">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">About Patient</h3>
                             <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl shadow-sm">
                                 <p className="text-zinc-900 font-black text-lg uppercase">{selectedPatient.diagnosis || "..."}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-zinc-50 p-3 rounded-lg text-center font-black text-xl text-zinc-700 border border-zinc-100">{selectedPatient.age}y</div>
                                 <div className="bg-zinc-50 p-3 rounded-lg text-center font-black text-xl text-zinc-700 border border-zinc-100">{selectedPatient.gender?.[0]}</div>
                             </div>
                        </div>

                        <div className="bg-white border border-zinc-100 p-5 rounded-2xl space-y-4">
                             <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Device Monitor</span>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                     <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Connected sensors</span>
                                     <span className="text-[10px] font-black text-indigo-500">{Object.keys(vitalsMap).length}</span>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {Object.keys(vitalsMap).slice(0, 4).map(serial => (
                                        <span key={serial} className="px-2 py-1 rounded bg-white border border-zinc-100 text-[7px] font-black text-zinc-500 uppercase">
                                            {serial}
                                        </span>
                                    ))}
                                    {Object.keys(vitalsMap).length === 0 && <span className="text-[8px] text-rose-500/50 uppercase font-black italic">No signals...</span>}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🕰️ REPLAY MODAL */}
            {reviewContext && (
                <HistoricalExplorer 
                    isOpen={true}
                    deviceId={reviewContext.id}
                    deviceSerial={reviewContext.serial}
                    patientName={reviewContext.name}
                    onClose={() => setReviewContext(null)}
                />
            )}

        </>
    );
}
