"use client";

import { useState, useEffect } from "react";
import useVitalsSocket, { VitalData } from "@/hooks/useVitalsSocket";
import VitalGrid from "@/components/vitals/VitalGrid";
import MonitoringFilters from "@/components/vitals/MonitoringFilters";
import { 
    ShieldCheck, 
    Cpu, 
    Loader2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";
import { useAuthStore } from "@/store/authStore";
import { useVitalsStore } from "@/store/vitalsStore";
import { useRouter } from "next/navigation";
import { format, differenceInMinutes } from "date-fns";

export default function NurseVitalsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [filters, setFilters] = useState({ wardId: "all", roomId: "all", bedId: "all" });
  const [initialData, setInitialData] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftStatus, setShiftStatus] = useState({ is_active: false, shift_details: null as any });

  const [wards, setWards] = useState<any[]>([]);

  // 🚀 CLINICAL HANDSHAKE: Loading multi-patient telemetry grid
  useEffect(() => {
    let active = true;
    const safetyTimer = setTimeout(() => {
        if (active) setLoading(false);
    }, 5000); 

    async function synchronizeNexus() {
      try {
        if (active) setLoading(true);

        // STEP 0: Fetch Clinical Context (All Wards/Beds)
        const wardsRes = await api.get("wards/nurse/wards/");
        if (wardsRes.data.success && active) {
            setWards(wardsRes.data.data || []);
            setShiftStatus({ ...wardsRes.data.shift_status, is_active: true });
        }

        const params = new URLSearchParams();
        if (filters.wardId !== "all") params.append("ward", filters.wardId);
        if (filters.roomId !== "all") params.append("room", filters.roomId);
        if (filters.bedId !== "all") params.append("bed", filters.bedId);

        // STEP 1: Fetch Nurse-Scoped Instant Snapshot
        const snapshotRes = await api.get(`vitals/admin/snapshot/${params.toString() ? `?${params.toString()}` : ""}`);
        
        if (!active) return;

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
           setInitialData(baseSnapshot);
        }

        // STEP 2: Fetch History Backfill
        try {
          const historyRes = await api.get(`vitals/admin/history/?minutes=5${params.toString() ? `&${params.toString()}` : ""}`);
          if (historyRes.data?.success && active) {
            const historyMap: Record<number, any[]> = {};
            (historyRes.data?.results || []).forEach((h: any) => {
                if (!historyMap[h.device_id]) historyMap[h.device_id] = [];
                historyMap[h.device_id].push(h);
            });

            setInitialData(prev => (prev || []).map(v => {
              const deviceHistory = historyMap[v.device.id];
              if (!deviceHistory || deviceHistory.length === 0) return v;
              const latest = deviceHistory[deviceHistory.length - 1];
              return {
                ...v,
                vitals: { ...v.vitals, heart_rate: latest.heart_rate, spo2: latest.spo2, temperature: latest.temperature, bp: latest.bp, timestamp: latest.timestamp },
                waveform: { ecg: generateSyntheticWaveform("ECG", latest.heart_rate || 75, 300), spo2: generateSyntheticWaveform("PPG", latest.spo2 || 98, 300) }
              };
            }));
          }
        } catch (he) { console.warn("Nexus: History failed", he); }

      } catch (e) { console.error("Nurse Monitor: Handshake failure", e); }
      finally { if (active) { setLoading(false); clearTimeout(safetyTimer); } }
    }
    synchronizeNexus();
    return () => { active = false; clearTimeout(safetyTimer); };
  }, [filters]);

  const { vitalsMap, connected: globalConnected, latency: globalLatency } = useVitalsStore();
  const liveVitals = Object.values(vitalsMap);

  // 🏥 CLINICAL MERGE ENGINE: Blend live vitals with all assigned patients
  const allAssignedPatients = wards.flatMap(w => 
    w.rooms.flatMap((r: any) => 
        r.beds.filter((b: any) => b.patient).map((b: any) => ({
            id: b.patient.id,
            name: b.patient.name,
            location: `W${w.id} R${r.room_number} B${b.bed_number}`,
            ward_id: w.id,
            room_id: r.id,
            bed_id: b.id,
            device_serial: b.device_serial
        }))
    )
  );

  const vitals = allAssignedPatients.map(patient => {
    const live = liveVitals.find(v => v.patient.id === patient.id);
    if (live) return live;

    // Create dummy context for offline devices (like ANN)
    return {
        device: { id: 0, serial: patient.device_serial || "UNKNOWN", label: patient.device_serial, mode: "REAL", state: "OFFLINE", last_seen: "" },
        patient: { id: patient.id, name: patient.name, location: patient.location, ward_id: patient.ward_id },
        vitals: { heart_rate: 0, spo2: 0, temperature: 0, bp: "---/---", timestamp: "" },
        waveform: { ecg: [], spo2: [] },
        ward_id: patient.ward_id,
        room_id: patient.room_id,
        bed_id: patient.bed_id,
        system: { signal_state: "LOST" }
    } as VitalData;
  });

  const filteredVitals = (vitals || []).filter(v => {
    const matchesWard = filters.wardId === "all" || v.ward_id === Number(filters.wardId);
    const matchesRoom = filters.room_id === Number(filters.roomId) || filters.roomId === "all";
    const matchesBed = filters.bed_id === Number(filters.bedId) || filters.bedId === "all";
    return matchesWard && matchesRoom && matchesBed;
  });


  return (
    <div className="p-8 pt-16 space-y-12 w-full min-h-screen bg-[#F8F9FB] relative overflow-hidden">
        
        {/* Shift Overlays Removed */}

        {/* Clinical Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tight text-zinc-900 uppercase">
                    Patient <span className="text-[#5C61F2]">Monitoring</span>
                </h1>
            </div>

            <div className="flex gap-6">
                <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm flex flex-col items-center min-w-[200px]">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#5C61F2]" />
                        Monitored Patients
                    </span>
                    <span className="text-5xl font-black text-zinc-900 tracking-tighter">{filteredVitals.length}</span>
                </div>
            </div>
        </div>


        {/* Filters */}
        <MonitoringFilters onFilterChange={setFilters} />

        {/* Monitoring Body */}
        {loading ? (
            <div className="flex flex-col items-center justify-center p-32">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Loading Patient Data...</span>
            </div>
        ) : (
            <VitalGrid 
                vitals={vitals} 
                connected={globalConnected} 
                filters={filters} 
                filteredVitals={filteredVitals} 
            />
        )}

      </div>
  );
}
