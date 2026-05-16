"use client";
// 🏥 REBUILD TRIGGER: NEXUS SYNC

import { useState, useEffect } from "react";
import useVitalsSocket, { VitalData } from "@/hooks/useVitalsSocket";
import VitalGrid from "@/components/vitals/VitalGrid";
import MonitoringFilters from "@/components/vitals/MonitoringFilters";
import { Activity, ShieldCheck, Cpu, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";
import { cn } from "@/lib/utils";

export default function VitalsAdminPage() {
  const [filters, setFilters] = useState({ wardId: "all", roomId: "all", bedId: "all" });
  const [allWards, setAllWards] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ZERO-LAG HANDSHAKE: Loading Flow (Snapshot -> History -> WebSocket)
  useEffect(() => {
    async function synchronizeNexus() {
      try {
        setLoading(true);

        // STEP 0: Fetch All Wards for Clinical Context (Shared Clinical Endpoint)
        const wardsRes = await api.get("wards/nurse/wards/");
        if (wardsRes.data.success) {
            setAllWards(wardsRes.data.data || []);
        }

        const params = new URLSearchParams();
        if (filters.wardId !== "all") params.append("ward", filters.wardId);
        if (filters.roomId !== "all") params.append("room", filters.roomId);
        if (filters.bedId !== "all") params.append("bed", filters.bedId);

        // STEP 1: Fetch Instant Snapshot (Vitals cached in Device)
        const snapshotRes = await api.get(`vitals/admin/snapshot/${params.toString() ? `?${params.toString()}` : ""}`);
        
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

        // STEP 2: Fetch Recent History (Last 5 Mins)
        try {
          const historyRes = await api.get(`vitals/admin/history/?minutes=5${params.toString() ? `&${params.toString()}` : ""}`);
          if (historyRes.data?.success) {
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
        } catch (he) { console.warn("Nexus Admin: History failed", he); }

      } catch (e) { console.error("Dashboard: Sync failure", e); }
      finally { setLoading(false); }
    }
    synchronizeNexus();
  }, [filters]);

  const { vitals: liveVitals, connected } = useVitalsSocket(initialData);

  // 🏥 CLINICAL MERGE ENGINE: Blend live vitals with all assigned patients
  const allAssignedPatients = allWards.flatMap(w => 
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

  const vitals = allAssignedPatients.length > 0 ? allAssignedPatients.map(patient => {
    // 🛡️ DUAL-STRATEGY MATCHING: Primary (Patient ID), Secondary (Device Serial)
    const live = liveVitals.find(v => 
        (v.patient?.id && String(v.patient.id) === String(patient.id)) ||
        (v.device?.serial && v.device.serial === patient.device_serial)
    );
    
    if (live) return live;
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
  }) : liveVitals;

  // 🔍 HIERARCHICAL FILTERING LOGIC
  const filteredVitals = (vitals || []).filter(v => {
    const v_ward_id = v.ward_id || v.patient?.ward_id;
    const matchesWard = filters.wardId === "all" || String(v_ward_id) === String(filters.wardId);
    const matchesRoom = filters.roomId === "all" || String(v.room_id) === String(filters.roomId);
    const matchesBed = filters.bedId === "all" || String(v.bed_id) === String(filters.bedId);
    return matchesWard && matchesRoom && matchesBed;
  });


  return (
    <div className="p-8 pt-16 space-y-12 w-full min-h-screen bg-[#F8F9FB] relative overflow-hidden">
        {/* Clinical Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tight text-zinc-900">
                    Real-time <span className="text-[#5C61F2]">Monitoring</span>
                </h1>
            </div>

            <div className="flex gap-6">
                <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm flex flex-col items-center min-w-[200px]">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#5C61F2]" />
                        Active Units
                    </span>
                    <span className="text-5xl font-black text-zinc-900 tracking-tighter">{filteredVitals.length}</span>
                </div>
            </div>
        </div>


        {/* Filters */}
        <MonitoringFilters onFilterChange={setFilters} />

        {/* Monitoring Body */}
        {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-zinc-100 shadow-sm relative min-h-[500px] overflow-hidden text-center p-12">
                 <div className="relative mb-6">
                   <Activity className="w-16 h-16 text-zinc-100 animate-pulse" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <Loader2 className="w-8 h-8 text-[#5C61F2] animate-spin" />
                   </div>
                 </div>
                 <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em]">Hardware Synchronization in progress...</span>
                 <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2">Checking signal integrity through telemetry router</p>
            </div>
        ) : (
            <VitalGrid 
                vitals={vitals} 
                connected={connected} 
                filters={filters} 
                filteredVitals={filteredVitals} 
            />
        )}

      </div>
  );
}
