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
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAlertStore } from "@/store/alertStore";
import HistoricalExplorer from "@/components/vitals/HistoricalExplorer";
import VitalCard from "@/components/vitals/VitalCard";
import ConditionUpdateModal from "@/components/vitals/ConditionUpdateModal";
import PhysicianOrderModal from "@/components/vitals/PhysicianOrderModal";

export default function DoctorDashboard() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [reviewContext, setReviewContext] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"notes" | "meds">("notes");
    const [alertPage, setAlertPage] = useState(0);
    const ALERTS_PER_PAGE = 4;
    
    // 🔔 ALERT ENGINE
    const { activeAlerts } = useAlertStore();
    const { vitalsMap, connected: wsConnected } = useVitalsStore();

    // 🛡️ CLINICAL SAFETY STATE
    const [pendingCondition, setPendingCondition] = useState<string | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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


    const handleUpdateCondition = async (condition: string, notes: string = "") => {
        if (!selectedPatient) return;
        try {
            const res = await api.patch(`patients/doctor/patients/${selectedPatient.id}/condition/`, { 
                condition,
                notes 
            });
            if (res.data.success) {
                setPendingCondition(null);
                await pullData(selectedPatient.id);
            }
        } catch (e: any) {
            console.error("Condition update failure", e);
            alert(e.response?.data?.message || "Failed to update condition");
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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white px-2">
                
                {/* 📋 ROUNDS LIST (30%) */}
                <div className="w-[380px] border-r border-white/5 flex flex-col bg-[#050505]">
                    <div className="p-6 border-b border-white/5 bg-zinc-900/20">
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input 
                                type="text"
                                placeholder="Filter Rounds list..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-zinc-400"
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
                                        ? "bg-zinc-900 border-indigo-500/30 shadow-2xl" 
                                        : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-white/5"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black uppercase tracking-tight text-zinc-200">{patient.name}</span>
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
                                        <div className={cn(
                                            "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border",
                                            patient.clinical_condition === "CRITICAL" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                            patient.clinical_condition === "GUARDED" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        )}>
                                            {patient.clinical_condition}
                                        </div>
                                        </div>
                                    </div>
                                </button>
                        ))}
                    </div>
                </div>

                {/* 🏥 CLINICAL OVERVIEW (70%) */}
                <div className="flex-1 bg-[#050505] flex flex-col relative border-r border-white/5">
                    {!selectedPatient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <Stethoscope className="w-20 h-20 text-zinc-800 mb-6" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-zinc-900/50 to-transparent">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                               <h2 className="text-6xl font-black uppercase tracking-[calc(-0.05em)] text-white">
                                                   {selectedPatient.name}
                                               </h2>
                                               <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                                   Active Admission
                                               </div>
                                            </div>
                                            <div className="flex gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] items-center">
                                                <span className="flex items-center gap-2">P-{selectedPatient.id}</span>
                                                <span className="flex items-center gap-2">Node: {selectedPatient.device_serial || "---"}</span>
                                                <div className="h-4 w-px bg-white/5 mx-2" />
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Clinical Condition</span>
                                                        <select 
                                                            value={selectedPatient.clinical_condition}
                                                            onChange={(e) => setPendingCondition(e.target.value)}
                                                            className={cn(
                                                                "bg-zinc-900 border-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none transition-all",
                                                                selectedPatient.clinical_condition === "CRITICAL" ? "border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]" :
                                                                selectedPatient.clinical_condition === "GUARDED" ? "border-amber-500 text-amber-500" :
                                                                "border-emerald-500 text-emerald-500"
                                                            )}
                                                        >
                                                            <option value="STABLE">STABLE</option>
                                                            <option value="GUARDED">GUARDED</option>
                                                            <option value="CRITICAL">CRITICAL</option>
                                                            <option value="RECOVERING">RECOVERING</option>
                                                        </select>
                                                    </div>
                                                    {selectedPatient.last_condition_update_by_name && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-1 whitespace-nowrap">Last Assessment</span>
                                                            <span className="text-[9px] font-bold text-zinc-500">
                                                                Dr. {selectedPatient.last_condition_update_by_name} • {format(new Date(selectedPatient.last_condition_update_at), "HH:mm")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 text-nowrap">
                                            {selectedPatient.device_id && (
                                                <button 
                                                    onClick={() => setReviewContext({
                                                        id: selectedPatient.device_id,
                                                        serial: selectedPatient.device_serial,
                                                        name: selectedPatient.name
                                                    })}
                                                    className="h-12 px-6 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500/20 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/10"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                    Review Replay
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setIsOrderModalOpen(true)}
                                                className="h-12 px-8 rounded-xl bg-zinc-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Order Meds
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                 {/* 🩺 CLINICAL INTELLIGENCE LAYER (Dual Status) */}
                                 <div className="px-8 py-6 flex gap-4">
                                     <div className={cn(
                                         "flex-1 p-5 rounded-2xl border transition-all duration-700 flex flex-col justify-between relative",
                                         activeVitals?.system_condition === "CRITICAL" ? "bg-rose-500/5 border-rose-500/10" :
                                         activeVitals?.system_condition === "WARNING" ? "bg-amber-500/5 border-amber-500/10" :
                                         "bg-zinc-900/20 border-white/5 opacity-40 grayscale"
                                     )}>
                                         <div className="z-10">
                                             <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">System Risk Engine</p>
                                             <div className="flex items-center gap-3">
                                                 <Activity className={cn(
                                                     "w-4 h-4",
                                                     activeVitals?.system_condition === "CRITICAL" ? "text-rose-500 animate-pulse" :
                                                     activeVitals?.system_condition === "WARNING" ? "text-amber-500" :
                                                     "text-zinc-700"
                                                 )} />
                                                 <p className={cn(
                                                     "text-base font-black uppercase tracking-tighter",
                                                     activeVitals?.system_condition === "CRITICAL" ? "text-rose-500" :
                                                     activeVitals?.system_condition === "WARNING" ? "text-amber-500" :
                                                     "text-zinc-600"
                                                 )}>
                                                     {activeVitals?.system_condition || "NO SIGNAL"}
                                                 </p>
                                             </div>
                                         </div>
                                     </div>

                                     <div className={cn(
                                         "flex-[1.5] p-5 rounded-2xl border transition-all duration-700 flex items-center justify-between shadow-2xl relative overflow-hidden",
                                         selectedPatient.clinical_condition === "CRITICAL" ? "bg-rose-600 border-rose-500 shadow-rose-500/20" :
                                         selectedPatient.clinical_condition === "GUARDED" ? "bg-amber-600 border-amber-500 shadow-amber-500/20" :
                                         "bg-emerald-600 border-emerald-500 shadow-emerald-500/20"
                                     )}>
                                         <div className="absolute top-0 right-0 p-2 opacity-10">
                                             <User className="w-16 h-16 rotate-12" />
                                         </div>
                                         <div className="relative z-10">
                                             <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Physician's Assessment</p>
                                             <div className="flex items-center gap-4">
                                                <p className="text-2xl font-black text-white uppercase tracking-tighter">
                                                    {selectedPatient.clinical_condition}
                                                </p>
                                                <div className="h-6 w-px bg-white/20" />
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-white/80 uppercase">Clinical Authority</span>
                                                    <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest leading-none">Level 4 Certified</span>
                                                </div>
                                             </div>
                                         </div>
                                         {selectedPatient.mode === "SIMULATION" && (
                                             <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                                                 <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                 <span className="text-[8px] font-black text-white uppercase tracking-widest">SIMULATED FEED</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                                 
                                 {/* 🚨 ACTIVE PATIENT ALERTS (4-Column Paginated) */}
                                 {currentPatientAlerts.length > 0 && (
                                     <div className="px-8 pb-6">
                                         <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl shadow-rose-500/5">
                                             <div className="flex justify-between items-center mb-6 border-b border-rose-500/10 pb-6">
                                                 <div className="flex items-center gap-4">
                                                     <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
                                                         <Bell className="w-6 h-6 animate-pulse" />
                                                     </div>
                                                     <div>
                                                         <h4 className="text-xl font-black text-rose-500 uppercase tracking-tighter leading-none mb-1">
                                                             Incident Cluster
                                                         </h4>
                                                         <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest italic opacity-60">
                                                             {currentPatientAlerts.length} Physiological Triggers Detected
                                                         </p>
                                                     </div>
                                                 </div>

                                                 {/* Clinical Pagination */}
                                                 {currentPatientAlerts.length > ALERTS_PER_PAGE && (
                                                     <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
                                                         <button 
                                                             disabled={alertPage === 0}
                                                             onClick={() => setAlertPage(prev => prev - 1)}
                                                             className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-800 disabled:opacity-20 transition-all"
                                                         >
                                                             <Activity className="w-4 h-4 text-zinc-500 rotate-180" />
                                                         </button>
                                                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest min-w-[60px] text-center">
                                                             P. {alertPage + 1} / {Math.ceil(currentPatientAlerts.length / ALERTS_PER_PAGE)}
                                                         </span>
                                                         <button 
                                                             disabled={alertPage >= Math.ceil(currentPatientAlerts.length / ALERTS_PER_PAGE) - 1}
                                                             onClick={() => setAlertPage(prev => prev + 1)}
                                                             className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-800 disabled:opacity-20 transition-all"
                                                         >
                                                             <Activity className="w-4 h-4 text-zinc-500" />
                                                         </button>
                                                     </div>
                                                 )}

                                                 <button 
                                                     onClick={async () => {
                                                         const tId = toast.loading(`Stabilizing Monitor: ${selectedPatient?.name || "Patient"}...`);
                                                         try {
                                                             let successCount = 0;
                                                             for (const a of currentPatientAlerts) {
                                                                 try {
                                                                     const res = await api.post(`alerts/doctor/${a.id}/resolve/`, {
                                                                         resolution_notes: "Physician acknowledged and managed incident via heart monitor hub."
                                                                     });
                                                                     if (res.data.success) {
                                                                         useAlertStore.getState().removeAlert(a.id);
                                                                         successCount++;
                                                                     }
                                                                 } catch (e) {
                                                                     console.error(`Failed to resolve alert ${a.id}`, e);
                                                                 }
                                                             }
                                                             toast.success(`Successfully cleared ${successCount} incidents`, { id: tId });
                                                         } catch (err) {
                                                             toast.error("Monitor stabilization encountered errors.", { id: tId });
                                                         }
                                                     }}
                                                     className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 transition-all ml-4"
                                                 >
                                                     Sign & Resolve All
                                                 </button>
                                             </div>

                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                 {currentPatientAlerts.slice(alertPage * ALERTS_PER_PAGE, (alertPage + 1) * ALERTS_PER_PAGE).map(alert => (
                                                     <div 
                                                         key={alert.id} 
                                                         className="p-4 rounded-3xl bg-black/40 border border-white/5 flex flex-col justify-between h-full group hover:border-rose-500/30 transition-all"
                                                     >
                                                         <div className="flex gap-3 mb-4">
                                                             <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                                                                 <Activity className="w-4 h-4" />
                                                             </div>
                                                             <div>
                                                                 <h5 className="text-[10px] font-black text-zinc-200 uppercase tracking-tight mb-1">
                                                                     {alert.type.replace(/_/g, ' ')}
                                                                 </h5>
                                                                 <p className="text-[9px] text-zinc-500 font-bold uppercase leading-tight italic line-clamp-2">
                                                                     {alert.message}
                                                                 </p>
                                                             </div>
                                                         </div>
                                                         <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                             <span className="text-[7px] font-black text-rose-500 uppercase px-2 py-0.5 rounded border border-rose-500/20">
                                                                 CRITICAL
                                                             </span>
                                                             <span className="text-[7px] font-bold text-zinc-700 uppercase">
                                                                 {format(new Date(alert.timestamp), "HH:mm")}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* 💡 AI SUGGESTION FEED */}
                                 {activeVitals?.ai_suggestion?.reasons?.length > 0 && (
                                     <div className="px-8 pb-6">
                                         <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 flex items-start gap-6">
                                             <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                 <Activity className="w-6 h-6 text-indigo-400" />
                                             </div>
                                             <div className="flex-1">
                                                 <div className="flex justify-between items-center mb-3">
                                                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Diagnostic Suggestion</span>
                                                     <span className="text-[8px] font-bold text-indigo-500/50 uppercase tracking-tighter">Confidence: HIGH</span>
                                                 </div>
                                                 <div className="flex gap-3 mb-4">
                                                     {activeVitals.ai_suggestion.reasons.map((reason: string, i: number) => (
                                                         <div key={i} className="px-3 py-1 rounded-full bg-black/40 border border-indigo-500/20 text-[9px] font-bold text-zinc-300">
                                                             {reason}
                                                         </div>
                                                     ))}
                                                 </div>
                                                 <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic mb-4">
                                                     System triggers suggest upgrading status to <span className="text-white font-black">{activeVitals.ai_suggestion.suggested_condition}</span> based on acute physiological instability.
                                                 </p>
                                                 <button 
                                                    onClick={() => handleUpdateCondition(activeVitals.ai_suggestion.suggested_condition)}
                                                    className="px-6 h-10 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-2xl shadow-indigo-500/20"
                                                 >
                                                     Accept Suggestion
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* 📟 CLINICAL MONITORING (High Fidelity) */}
                                <div className="px-8 pb-8">
                                    {activeVitals ? (
                                        <div className="rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                                            <VitalCard data={activeVitals} onReview={() => setReviewContext({
                                                id: selectedPatient.device_id,
                                                serial: selectedPatient.device_serial,
                                                name: selectedPatient.name
                                            })} />
                                        </div>
                                    ) : (
                                        <div className="h-[340px] rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center bg-zinc-900/10">
                                            <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center mb-4">
                                                <Activity className="w-5 h-5 text-zinc-800 animate-pulse" />
                                            </div>
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Establishing Signal Link...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 pb-20">
                                    <div className="flex gap-8 mb-8 border-b border-white/5">
                                        <button 
                                            onClick={() => setActiveTab("notes")}
                                            className={cn(
                                                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2",
                                                activeTab === "notes" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-zinc-600 hover:text-zinc-400"
                                            )}
                                        >
                                            Nurse Observations
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab("meds")}
                                            className={cn(
                                                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2",
                                                activeTab === "meds" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-zinc-600 hover:text-zinc-400"
                                            )}
                                        >
                                            Medication Timeline
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        {activeTab === "notes" && (
                                            <div className="space-y-6">
                                                {!selectedPatient.clinical_notes || selectedPatient.clinical_notes.length === 0 ? (
                                                    <div className="py-20 text-center space-y-4">
                                                        <FileText className="w-12 h-12 text-zinc-900 mx-auto" />
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest italic">Clinical documentation pending</p>
                                                    </div>
                                                ) : selectedPatient.clinical_notes.map((note: any, idx: number) => (
                                                    <div key={idx} className="relative pl-10 border-l border-white/5 pb-8 last:pb-0">
                                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-4 border-black box-content" />
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                                                                    {format(new Date(note.created_at), "HH:mm")} • {note.nurse_name ? `RN ${note.nurse_name}` : "STAFF"}
                                                                </span>
                                                            </div>
                                                            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
                                                                <p className="text-zinc-400 leading-relaxed font-medium">
                                                                    {note.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "meds" && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {!selectedPatient.medication_orders || selectedPatient.medication_orders.length === 0 ? (
                                                         <div className="py-20 text-center space-y-4">
                                                            <Pill className="w-12 h-12 text-zinc-900 mx-auto" />
                                                            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest italic">No active pharmacological orders</p>
                                                         </div>
                                                    ) : selectedPatient.medication_orders.map((med: any, idx: number) => (
                                                        <div key={idx} className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
                                                            <div className="flex items-center gap-6">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                                                                    med.administered_status ? "bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-indigo-500/20 text-indigo-400"
                                                                )}>
                                                                    <Pill className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black uppercase text-white tracking-tight">{med.medication_name}</h4>
                                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                        {med.dosage} • {med.route} • {med.frequency}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {med.administered_status ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            Administered
                                                                        </span>
                                                                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter mt-1 italic">
                                                                            By RN {med.administered_status.nurse} at {format(new Date(med.administered_status.time), "HH:mm")}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic group-hover:text-indigo-500/50 transition-colors">Awaiting Bedside Execution</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 📝 SIDEBAR (RIGHT) */}
                {selectedPatient && (
                    <div className="w-[300px] bg-zinc-950 p-8 space-y-8">
                        <div className="space-y-6">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Clinical Background</h3>
                             <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
                                 <p className="text-white font-black text-lg uppercase">{selectedPatient.diagnosis || "..."}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-zinc-900/50 p-3 rounded-lg text-center font-black text-xl text-zinc-300">{selectedPatient.age}y</div>
                                 <div className="bg-zinc-900/50 p-3 rounded-lg text-center font-black text-xl text-zinc-300">{selectedPatient.gender?.[0]}</div>
                             </div>
                        </div>

                        <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl space-y-4">
                             <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Telemetry Router</span>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                     <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Active Channels</span>
                                     <span className="text-[10px] font-black text-indigo-500">{Object.keys(vitalsMap).length}</span>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {Object.keys(vitalsMap).slice(0, 4).map(serial => (
                                        <span key={serial} className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[7px] font-black text-zinc-400 uppercase">
                                            {serial}
                                        </span>
                                    ))}
                                    {Object.keys(vitalsMap).length === 0 && <span className="text-[8px] text-rose-500/50 uppercase font-black italic">No signals...</span>}
                                 </div>
                             </div>
                             <p className="text-[9px] text-zinc-600 font-medium leading-relaxed italic border-t border-white/5 pt-2">
                                 Syncing global command stream. Status: {wsConnected ? "CONNECTED" : "OFFLINE"}
                             </p>
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

            {/* 🛡️ CLINICAL SAFETY GATE */}
            <ConditionUpdateModal 
                isOpen={!!pendingCondition}
                onClose={() => setPendingCondition(null)}
                onConfirm={(cond, reason) => handleUpdateCondition(cond, reason)}
                currentCondition={selectedPatient?.clinical_condition || "STABLE"}
                newCondition={pendingCondition || "STABLE"}
                patientName={selectedPatient?.name || "Patient"}
            />

            {/* 💊 PHYSICIAN ORDER PORTAL */}
            <PhysicianOrderModal 
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                patientId={selectedPatient?.id}
                patientName={selectedPatient?.name}
                onSuccess={() => pullData(selectedPatient?.id)}
            />
        </div>
    );
}
