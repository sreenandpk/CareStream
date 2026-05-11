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

    // 🚀 CLINICAL HANDSHAKE: Loading nurse-scoped telemetry (Snapshot -> History -> Socket)
    useEffect(() => {
        if (!user || user.role !== "NURSE") return;
        
        async function synchronizeNexus() {
            try {
                // STEP 1: Fetch Instant Snapshot
                const snapshotRes = await api.get("vitals/admin/snapshot/");
                if (snapshotRes.data?.success) {
                    const baseSnapshot = (snapshotRes.data?.results || []).map((d: any) => ({
                        device: {
                            id: d.device_id,
                            serial: d.device_serial,
                            label: d.device_label || d.device_serial,
                            mode: d.device_mode,
                            state: d.device_state,
                            last_seen: d.timestamp,
                        },
                        patient: {
                            id: d.patient_id,
                            name: d.patient_name || "ANONYMOUS",
                            location: d.ward_id ? `Ward ${d.ward_id} / Bed R${d.bed_id}` : "CALIBRATION",
                            ward_id: d.ward_id,
                        },
                        vitals: {
                            heart_rate: d.heart_rate,
                            spo2: d.spo2,
                            temperature: d.temperature,
                            bp: d.bp || "---/---",
                            timestamp: d.timestamp,
                        },
                        waveform: {
                            ecg: generateSyntheticWaveform("ECG", d.heart_rate || 75, 400),
                            spo2: generateSyntheticWaveform("PPG", d.spo2 || 98, 400),
                        },
                        ward_id: d.ward_id,
                        room_id: d.room_id,
                        bed_id: d.bed_id,
                    }));
                    setInitialVitals(baseSnapshot);
                }

                // STEP 2: Fetch Recent History (Last 5 Mins)
                try {
                    const historyRes = await api.get("vitals/admin/history/?minutes=5");
                    if (historyRes.data?.success) {
                        const historyMap: Record<number, any[]> = {};
                        (historyRes.data?.results || []).forEach((h: any) => {
                            if (!historyMap[h.device_id]) historyMap[h.device_id] = [];
                            historyMap[h.device_id].push(h);
                        });

                        setInitialVitals(prev => (prev || []).map(v => {
                            const deviceHistory = historyMap[v.device.id];
                            if (!deviceHistory || deviceHistory.length === 0) return v;
                            const latest = deviceHistory[deviceHistory.length - 1];
                            return {
                                ...v,
                                vitals: {
                                    ...v.vitals,
                                    heart_rate: latest.heart_rate,
                                    spo2: latest.spo2,
                                    temperature: latest.temperature,
                                    bp: latest.bp,
                                    timestamp: latest.timestamp,
                                },
                                waveform: {
                                    ecg: generateSyntheticWaveform("ECG", latest.heart_rate || 75, 300),
                                    spo2: generateSyntheticWaveform("PPG", latest.spo2 || 98, 300),
                                }
                            };
                        }));
                    }
                } catch (he) {
                    console.warn("Nexus Dashboard: History backfill failed", he);
                }
            } catch (e) {
                console.error("Nurse Dashboard: Handshake failure", e);
            }
        }
        synchronizeNexus();
    }, [user]);

    // 📡 TELEMETRY HUB (Global Persistence)
    const { vitals, connected, latency } = useVitalsSocket({ initialData: initialVitals, autoConnect: true });


    if (!_hasHydrated || !user) return null;

    const allPatients = wards.flatMap(w => w.rooms.flatMap(r => r.beds.filter(b => b.patient)));
    const selectedPatient = allPatients.find(p => String(p.patient?.id) === String(selectedPatientId));
    let activePatientVitals = vitals.find(v => String(v.patient?.id) === String(selectedPatientId));

    // 🏥 DISCONNECTED DEVICE HANDSHAKE: If patient selected but no live feed, create dummy offline context
    if (selectedPatient && !activePatientVitals) {
        activePatientVitals = {
            device: {
                id: 0,
                serial: selectedPatient.device_serial || "UNKNOWN",
                label: selectedPatient.device_serial || "Station",
                mode: "REAL",
                state: "OFFLINE",
                last_seen: new Date().toISOString(),
            },
            patient: {
                id: selectedPatient.patient?.id || 0,
                name: selectedPatient.patient?.name || "ANONYMOUS",
                location: `Bed ${selectedPatient.bed_number}`,
                ward_id: 0,
            },
            vitals: {
                heart_rate: 0,
                spo2: 0,
                temperature: 0,
                bp: "---/---",
                timestamp: "",
            },
            waveform: {
                ecg: [],
                spo2: [],
            },
            system: {
                signal_state: "LOST",
                signal_quality: "NONE",
                sensor_connected: false,
                device_mode: "REAL",
                rssi: -100,
                uptime: 0
            }
        } as any;
    }

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
                                    {shiftStatus.is_active ? "On Shift" : isShiftFinished ? "Shift Ended" : "Off Duty"}
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {user.username}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight text-zinc-900 leading-none">Units</h2>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                                <Activity className="w-3.5 h-3.5 text-[#5C67F2]" />
                                <span>Monitoring {allPatients.length} Patients</span>
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
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Floor {ward.floor} • Patient Care Unit</span>
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
                                                                        {bed.patient?.diagnosis || "Initial Check"}
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

                    {/* Sidebar Footer Removed */}
                </div>

                {/* 🏥 OBSERVATION HUB (70%) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                    {/* Shift Overlays Removed */}

                    {!selectedPatientId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                             <div className="w-24 h-24 rounded-[2rem] border border-zinc-800 flex items-center justify-center mb-8 rotate-12">
                                 <Stethoscope className="w-12 h-12 text-zinc-700" />
                             </div>
                             <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-4">Select a Bed</h3>
                             <p className="text-[10px] text-zinc-500 max-w-xs font-bold uppercase tracking-widest">
                                 Choose a patient from the list on the left to start monitoring.
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
                                                  Diagnosis: {selectedPatient?.patient?.diagnosis || "Initial Check"}
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
                                 <div className="lg:col-span-12 relative min-h-[500px]">
                                     {activePatientVitals && (
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
                                     )}
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
