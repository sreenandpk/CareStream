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
  const [initialData, setInitialData] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ZERO-LAG HANDSHAKE: Loading Flow (Snapshot -> History -> WebSocket)
  useEffect(() => {
    async function synchronizeNexus() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.wardId !== "all") params.append("ward", filters.wardId);
        if (filters.roomId !== "all") params.append("room", filters.roomId);
        if (filters.bedId !== "all") params.append("bed", filters.bedId);

        // STEP 1: Fetch Instant Snapshot (Vitals cached in Device)
        const snapshotUrl = `vitals/admin/snapshot/${params.toString() ? `?${params.toString()}` : ""}`;
        const snapshotRes = await api.get(snapshotUrl);
        let baseSnapshot: VitalData[] = [];

        if (snapshotRes.data?.success) {
           baseSnapshot = (snapshotRes.data?.results || []).map((d: any) => ({
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

        // STEP 2: Fetch Recent History (Last 5 Mins) for trend backfill
        try {
          const historyUrl = `vitals/admin/history/?minutes=5${params.toString() ? `&${params.toString()}` : ""}`;
          const historyRes = await api.get(historyUrl);
          if (historyRes.data?.success) {
            // Group history by device to allow per-card backfill
            const historyMap: Record<number, any[]> = {};
            (historyRes.data?.results || []).forEach((h: any) => {
                if (!historyMap[h.device_id]) historyMap[h.device_id] = [];
                historyMap[h.device_id].push(h);
            });

            // Update initial state with historical scalar averages or most recent
            setInitialData(prev => (prev || []).map(v => {
              const deviceHistory = historyMap[v.device.id];
              if (!deviceHistory || deviceHistory.length === 0) return v;
              
              const latest = deviceHistory[deviceHistory.length - 1];
              
              // 🧪 SYNTHETIC CONTINUITY ENGINE
              const ecgWave = generateSyntheticWaveform("ECG", latest.heart_rate || 75, 300);
              const ppgWave = generateSyntheticWaveform("PPG", latest.spo2 || 98, 300);

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
                  ecg: ecgWave,
                  spo2: ppgWave,
                }
              };
            }));
          }
        } catch (he) {
          console.warn("Nexus: History backfill failed", he);
        }

      } catch (e) {
        console.error("Dashboard: Synchronization failure", e);
      } finally {
        setLoading(false);
      }
    }
    synchronizeNexus();
  }, [filters]);

  const { vitals, connected } = useVitalsSocket(initialData);

  // 🔍 HIERARCHICAL FILTERING LOGIC
  const filteredVitals = (vitals || []).filter(v => {
    const matchesWard = filters.wardId === "all" || v.ward_id === Number(filters.wardId);
    const matchesRoom = filters.roomId === "all" || v.room_id === Number(filters.roomId);
    const matchesBed = filters.bedId === "all" || v.bed_id === Number(filters.bedId);
    return matchesWard && matchesRoom && matchesBed;
  });

  // Aggregate Stats (Synced to Hierarchical Selection)
  const criticalFeeds = filteredVitals.filter(v => 
    v.vitals?.heart_rate !== null && (v.vitals?.heart_rate > 120 || (v.vitals?.heart_rate ?? 0) < 50) || 
    (v.vitals?.spo2 !== null && (v.vitals?.spo2 ?? 100) < 90)
  ).length;
  const stableFeeds = (filteredVitals?.length ?? 0) - criticalFeeds;

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full p-8 pt-16">
      {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">
                Real-time <span className="text-[#5C61F2]">Monitoring</span>
            </h1>

        </div>

        {/* Hierarchical Filter Bar */}
        <MonitoringFilters onFilterChange={setFilters} />


        {/* Main Monitoring Grid */}
        <VitalGrid vitals={vitals} connected={connected} filters={filters} filteredVitals={filteredVitals} />
      </div>
  );
}
