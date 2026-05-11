"use client";

import { useState, useEffect } from "react";
import useVitalsSocket, { VitalData } from "@/hooks/useVitalsSocket";
import VitalGrid from "@/components/vitals/VitalGrid";
import MonitoringFilters from "@/components/vitals/MonitoringFilters";
import { Activity, ShieldCheck, Cpu, BellRing, Database, Loader2 } from "lucide-react";
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

        // STEP 0: Fetch All Wards for Clinical Context
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

  const { vitals: liveVitals, connected, latency } = useVitalsSocket(initialData);

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
    const live = liveVitals.find(v => v.patient.id === patient.id);
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
    const matchesWard = filters.wardId === "all" || v.ward_id === Number(filters.wardId);
    const matchesRoom = filters.roomId === "all" || v.room_id === Number(filters.roomId);
    const matchesBed = filters.bedId === "all" || v.bed_id === Number(filters.bedId);
    return matchesWard && matchesRoom && matchesBed;
  });

  const criticalCount = filteredVitals.filter(v => 
    v.vitals?.heart_rate && (v.vitals.heart_rate > 130 || v.vitals.heart_rate < 45) || 
    (v.vitals?.spo2 && v.vitals.spo2 < 88)
  ).length;

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
                    <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Urgent Alerts
                    </span>
                    <span className="text-5xl font-black text-zinc-900 tracking-tighter">{criticalCount}</span>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-200/60 shadow-sm flex flex-col items-center min-w-[200px]">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#5C61F2]" />
                        Active Units
                    </span>
                    <span className="text-5xl font-black text-zinc-900 tracking-tighter">{filteredVitals.length}</span>
                </div>
            </div>
        </div>

        {/* Global Warnings */}
        {criticalCount > 0 && (
            <div className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2rem] flex items-center gap-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                    <BellRing className="w-5 h-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.1em]">
                    Attention: {criticalCount} high-acuity events detected. Intervention recommended immediately.
                </span>
            </div>
        )}

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

        {/* System Fidelity Footer */}
        <div className="flex items-center justify-between p-10 bg-white rounded-[3rem] border border-zinc-200/60 shadow-sm">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-4">
                    <div className={cn("w-3 h-3 rounded-full", connected ? "bg-emerald-500 shadow-[0_0_12px_#10b981]" : "bg-rose-500")} />
                    <span className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.2em]">
                        {connected ? "System Online" : "Connecting..."}
                    </span>
                </div>
                <div className="w-px h-8 bg-zinc-100" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Signal Strength</span>
                    <span className="text-lg font-black text-emerald-600 tracking-tight">
                        {(() => {
                            if (!connected) return "0%";
                            if (filteredVitals.length === 0) return "100%";
                            
                            const liveDevices = filteredVitals.filter(v => v.device.state === "LIVE");
                            if (liveDevices.length === 0) return "0%";

                            const totalHealth = liveDevices.reduce((acc, v) => {
                                const rssi = v.system?.rssi || -60;
                                if (rssi > -50) return acc + 100;
                                if (rssi > -70) return acc + 80;
                                if (rssi > -85) return acc + 50;
                                return acc + 20;
                            }, 0);
                            return `${Math.round(totalHealth / liveDevices.length)}%`;
                        })()}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-10">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Latency</span>
                    <span className="text-lg font-black text-zinc-400 tracking-tight italic">
                        {latency !== null ? `${latency}ms` : "---"}
                    </span>
                </div>
                <div className="w-px h-10 bg-zinc-100" />
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Observation Pool</span>
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#5C61F2]" />
                        <span className="text-lg font-black text-zinc-900 tracking-tight">Real-Time</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
  );
}
