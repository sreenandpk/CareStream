"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { 
    Activity, 
    Bell, 
    Clock,
    MapPin, 
    Shield,
    FileText,
    CheckCircle2,
    Thermometer,
    Heart,
    Droplets,
    ChevronRight,
    Loader2,
    Save,
    Send,
    LogOut,
    Stethoscope,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import VitalCard from "@/components/vitals/VitalCard";
import HistoricalExplorer from "@/components/vitals/HistoricalExplorer";
import useVitalsSocket, { VitalData } from "@/hooks/useVitalsSocket";
import { useVitalsStore } from "@/store/vitalsStore";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";


interface WardData {
    id: number;
    name: string;
    floor: number;
    rooms: Array<{
        id: number;
        room_number: string;
        beds: Array<{
            id: number;
            bed_number: string;
            status: string;
            patient: {
                id: number;
                name: string;
                diagnosis: string;
            } | null;
            device_serial: string;
        }>;
    }>;
}

interface ShiftContext {
    is_active: boolean;
    active_wards: number[];
    shift_details?: {
        start_time: string;
        end_time: string;
        shift_type: string;
    };
}

export default function NurseClinicalDashboard() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    
    const [wards, setWards] = useState<WardData[]>([]);
    const [shiftStatus, setShiftStatus] = useState<ShiftContext>({ is_active: false, active_wards: [] });
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [initialVitals, setInitialVitals] = useState<VitalData[]>([]);
    
    // Note Management
    const [reviewContext, setReviewContext] = useState<{ id: number; serial: string; name: string } | null>(null);

    const fetchContext = useCallback(async () => {
        try {
            const res = await api.get("wards/nurse/wards/");
            if (res.data.success) {
                setWards(res.data.data);
                setShiftStatus(res.data.shift_status || { is_active: true, active_wards: [] });
                
                // Auto-select first patient if none selected
                const firstPatient = res.data.data[0]?.rooms[0]?.beds.find((b: any) => b.patient)?.patient;
                if (firstPatient && !selectedPatientId) {
                    setSelectedPatientId(firstPatient.id);
                }
            }
        } catch (err) {
            console.error("Clinical Context Error:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedPatientId]);

    useEffect(() => {
        if (_hasHydrated && (!user || user.role !== "NURSE")) {
            router.push("/login");
        }
    }, [user, _hasHydrated, router]);

    useEffect(() => {
        if (user?.role === "NURSE") fetchContext();
    }, [user, fetchContext]);

    // 📡 TELEMETRY HUB (Global Persistence)
    const { vitalsMap, connected, latency } = useVitalsStore();
    const vitals = Object.values(vitalsMap);


    if (!_hasHydrated || !user) return null;

    const allPatients = wards.flatMap(w => w.rooms.flatMap(r => r.beds.filter(b => b.patient)));
    const selectedPatient = allPatients.find(p => String(p.patient?.id) === String(selectedPatientId));
    const activePatientVitals = vitals.find(v => String(v.patient?.id) === String(selectedPatientId));

    const shiftStartTime = shiftStatus.shift_details?.start_time
        ? new Date(shiftStatus.shift_details.start_time)
        : null;

    const shiftEndTime = shiftStatus.shift_details?.end_time 
        ? new Date(shiftStatus.shift_details.end_time) 
        : null;
    
    const totalDuration = shiftStartTime && shiftEndTime
        ? differenceInMinutes(shiftEndTime, shiftStartTime)
        : 0;

    const elapsed = shiftStartTime
        ? differenceInMinutes(new Date(), shiftStartTime)
        : 0;

    const progress = totalDuration > 0 
        ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
        : 0;

    const minutesRemaining = shiftEndTime 
        ? differenceInMinutes(shiftEndTime, new Date()) 
        : 0;

    const isShiftFinished = false;
    const isStandby = false;

    return (
        <>
            {/* 🕰️ NEXUS WAVEFORM REPLAY MODAL (MOVED TO TOP FOR Z-INDEX SAFETY) */}
            <AnimatePresence>
                {reviewContext && (
                    <HistoricalExplorer 
                        isOpen={true}
                        deviceId={reviewContext.id}
                        deviceSerial={reviewContext.serial}
                        patientName={reviewContext.name}
                        onClose={() => {
                            console.log("🔒 NWR: Closing historical explorer.");
                            setReviewContext(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8F9FB] text-zinc-900">
                
                {/* 📋 CLINICAL PANEL (30%) */}
                <div className="w-[420px] border-r border-zinc-200/60 bg-white flex flex-col relative z-20 shadow-sm">
                    <div className="p-10 border-b border-zinc-100 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px]",
                                    shiftStatus.is_active ? "bg-emerald-500 shadow-emerald-500/40" : 
                                    isShiftFinished ? "bg-rose-500 shadow-rose-500/40" : "bg-zinc-300"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                    shiftStatus.is_active ? "text-emerald-600" : 
                                    isShiftFinished ? "text-rose-600" : "text-zinc-400"
                                )}>
                                    {shiftStatus.is_active ? "Active Duty" : isShiftFinished ? "Shift Concluded" : "Standby"}
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {user.username}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight text-zinc-900 leading-none">Wards</h2>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                                <Activity className="w-3.5 h-3.5 text-[#5C67F2]" />
                                <span>Monitoring {allPatients.length} Active Beds</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                        {wards.map(ward => (
                            <div key={ward.id} className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-[#5C67F2]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black uppercase tracking-widest text-zinc-900">{ward.name}</span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Floor {ward.floor} • Critical Response</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    {ward.rooms.map(room => (
                                        <div key={room.id} className="mb-4">
                                            <div className="px-2 mb-3 flex items-center gap-3">
                                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Room {room.room_number}</span>
                                                <div className="h-px flex-1 bg-zinc-100" />
                                            </div>
                                            <div className="space-y-1">
                                                {room.beds.filter(b => b.patient).map(bed => {
                                                    const patientVitals = vitals.find(v => v.patient.id === bed.patient?.id);
                                                    const isSelected = selectedPatientId === bed.patient?.id;
                                                    const isCritical = patientVitals?.vitals.heart_rate && (patientVitals.vitals.heart_rate > 140 || patientVitals.vitals.heart_rate < 45);

                                                    return (
                                                        <button 
                                                            key={bed.id}
                                                            onClick={() => setSelectedPatientId(bed.patient?.id || null)}
                                                            className={cn(
                                                                "w-full p-5 rounded-3xl border transition-all text-left relative overflow-hidden group mb-2 shadow-sm",
                                                                isSelected 
                                                                    ? "bg-white border-[#5C67F2] shadow-blue-600/10" 
                                                                    : "bg-white border-zinc-100 hover:border-zinc-300",
                                                                isCritical && "bg-rose-50 border-rose-200"
                                                            )}
                                                        >
                                                            {isSelected && (
                                                                <motion.div 
                                                                    layoutId="active-pill"
                                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#5C67F2] rounded-r-full"
                                                                />
                                                            )}
                                                            
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bed {bed.bed_number}</span>
                                                                {isCritical && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 rounded-lg">
                                                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight">Critical</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-end justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className={cn(
                                                                        "text-lg font-black tracking-tight text-zinc-900 uppercase",
                                                                        isSelected ? "text-[#5C67F2]" : ""
                                                                    )}>
                                                                        {bed.patient?.name}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                                        {bed.patient?.diagnosis || "Primary Evaluation"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-xl border border-zinc-100">
                                                                        <Heart className={cn(
                                                                            "w-3 h-3",
                                                                            patientVitals ? "text-rose-500" : "text-zinc-200"
                                                                        )} />
                                                                        <span className="text-sm font-black tracking-tight text-zinc-900">
                                                                            {patientVitals?.vitals.heart_rate || "--"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-xl border border-zinc-100">
                                                                        <Droplets className={cn(
                                                                            "w-3 h-3",
                                                                            patientVitals ? "text-blue-500" : "text-zinc-200"
                                                                        )} />
                                                                        <span className="text-[11px] font-black text-zinc-500 tracking-tight">
                                                                            {patientVitals?.vitals.spo2 || "--"}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Duty Context Footer */}
                    {shiftStatus.is_active && (
                        <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Duty Timeline</span>
                                <span className={cn(
                                    "text-[10px] font-black uppercase px-3 py-1 rounded-xl bg-white border border-zinc-200",
                                    minutesRemaining < 30 ? "text-rose-500" : "text-[#5C67F2]"
                                )}>
                                    {minutesRemaining > 0 
                                        ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m Left`
                                        : "Shift Over"}
                                </span>
                            </div>
                            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-[#5C67F2] shadow-[0_0_12px_#5C67F2/30]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-[8px] font-black text-zinc-400 uppercase tracking-tighter">
                                <div className="flex flex-col">
                                    <span>Start {shiftStartTime ? format(shiftStartTime, "hh:mm aa") : "--:--"}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span>End {shiftEndTime ? format(shiftEndTime, "hh:mm aa") : "--:--"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🏥 OBSERVATION HUB (70%) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                    {/* Shift Overlays Removed */}

                    {!selectedPatientId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                             <div className="w-24 h-24 rounded-[2rem] border border-zinc-800 flex items-center justify-center mb-8 rotate-12">
                                 <Stethoscope className="w-12 h-12 text-zinc-700" />
                             </div>
                             <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-4">Board Initialization</h3>
                             <p className="text-[10px] text-zinc-500 max-w-xs font-bold uppercase tracking-widest">
                                 Telemetry handshake active. Select a high-acuity bed to escalate monitoring.
                             </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-12">
                             {/* Patient Identity Header */}
                             <div className="flex justify-between items-end mb-12">
                                 <div className="space-y-4">
                                     <div className="flex items-center gap-3">
                                         {/* Badge and ID Removed */}
                                     </div>
                                     <h1 className="text-6xl font-black tracking-tight uppercase leading-none text-zinc-900">
                                         {selectedPatient?.patient?.name}
                                     </h1>
                                     <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
                                              <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                                                  Dx: {selectedPatient?.patient?.diagnosis || "Primary Evaluation"}
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
                                              <Shield className="w-3.5 h-3.5 text-zinc-400" />
                                              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                                                  Age: {selectedPatient?.patient?.age}y • {selectedPatient?.patient?.gender}
                                              </span>
                                          </div>
                                     </div>
                                 </div>

                                 <div className="flex gap-4">
                                       {activePatientVitals && (
                                               <button 
                                                    onClick={() => setReviewContext({
                                                        id: activePatientVitals.device.id,
                                                        serial: activePatientVitals.device.serial,
                                                        name: selectedPatient?.patient?.name || "Unknown"
                                                    })}
                                                    className="w-14 h-14 rounded-3xl bg-white border border-zinc-200/60 text-zinc-400 hover:text-[#5C67F2] hover:border-[#5C67F2]/30 shadow-sm hover:shadow-md transition-all flex items-center justify-center group/hist relative"
                                               >
                                                   <History className="w-6 h-6 group-hover/hist:rotate-[-45deg] transition-transform" />
                                                   
                                               </button>
                                       )}
                                  </div>
                             </div>

                             {/* Telemetry Core */}
                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                                 <div className="lg:col-span-8 bg-black rounded-[3rem] shadow-2xl relative min-h-[500px] overflow-hidden border-8 border-white">
                                     {activePatientVitals ? (
                                         <VitalCard 
                                            data={activePatientVitals} 
                                            onReview={() => {
                                                console.log("🕰️ NWR: Audit-compliant review requested for", activePatientVitals.device.serial);
                                                setReviewContext({
                                                    id: activePatientVitals.device.id,
                                                    serial: activePatientVitals.device.serial,
                                                    name: selectedPatient?.patient?.name || "Unknown"
                                                });
                                            }}
                                         />
                                     ) : (
                                         <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                              <div className="relative mb-6">
                                                <Activity className="w-16 h-16 text-zinc-900 animate-pulse" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Loader2 className="w-8 h-8 text-zinc-700 animate-spin" />
                                                </div>
                                              </div>
                                              <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Hardware Synchronization in progress...</span>
                                              <p className="text-[9px] text-zinc-800 font-bold uppercase mt-2">Checking signal integrity through telemetry router</p>
                                         </div>
                                     )}
                                 </div>

                                 <div className="lg:col-span-4 flex flex-col gap-8">
                                     <div className={cn(
                                         "flex-1 rounded-[3rem] border p-10 flex flex-col transition-all duration-700 bg-white shadow-sm border-zinc-100",
                                         activePatientVitals?.patient?.clinical_condition === "CRITICAL" && "ring-2 ring-rose-500/20",
                                         activePatientVitals?.patient?.clinical_condition === "GUARDED" && "ring-2 ring-amber-500/20"
                                     )}>
                                         <div className="flex items-center gap-4 mb-8">
                                             <div className={cn(
                                                 "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl",
                                                 activePatientVitals?.patient?.clinical_condition === "CRITICAL" ? "bg-rose-600 text-white" :
                                                 activePatientVitals?.patient?.clinical_condition === "GUARDED" ? "bg-amber-600 text-white" :
                                                 "bg-emerald-600 text-white"
                                             )}>
                                                 <Stethoscope className="w-6 h-6" />
                                             </div>
                                             <div>
                                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 block mb-1">Observation Status</span>
                                                 <h3 className={cn(
                                                     "text-3xl font-black uppercase tracking-tighter",
                                                     activePatientVitals?.patient?.clinical_condition === "CRITICAL" ? "text-rose-500" :
                                                     activePatientVitals?.patient?.clinical_condition === "GUARDED" ? "text-amber-500" :
                                                     "text-emerald-500"
                                                 )}>
                                                     {activePatientVitals?.patient?.clinical_condition || "STABLE"}
                                                 </h3>
                                             </div>
                                         </div>

                                         <div className="flex-1 space-y-6">
                                             <div className="space-y-3">
                                                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clinical Insight</span>
                                                 <p className="text-base font-medium text-zinc-600 leading-relaxed tracking-tight">
                                                     "{activePatientVitals?.ai_condition_summary || "Telemetry patterns indicate stable baseline. Continuing observation protocol."}"
                                                 </p>
                                             </div>

                                             <div className="pt-6 border-t border-white/5 space-y-4">
                                                 <div className="flex justify-between items-center">
                                                     <span className="text-[9px] font-black text-zinc-700 uppercase">Assessment Engine</span>
                                                     <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-tighter">Scikit-Learn v1.4</span>
                                                 </div>
                                                 <div className="flex justify-between items-center">
                                                     <span className="text-[9px] font-black text-zinc-700 uppercase">Last Sync</span>
                                                     <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                                                         {activePatientVitals?.vitals.timestamp ? format(new Date(activePatientVitals.vitals.timestamp), "HH:mm:ss") : "LIVE"}
                                                     </span>
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="mt-8 p-4 bg-black/40 rounded-2xl border border-white/5 flex items-start gap-3">
                                             <Shield className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                             <p className="text-[9px] text-zinc-600 font-bold uppercase leading-relaxed">
                                                 Condition derived from real-time biometric trends. No manual overrides detected in this session.
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                    {/* Extended Clinical Context Removed */}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
