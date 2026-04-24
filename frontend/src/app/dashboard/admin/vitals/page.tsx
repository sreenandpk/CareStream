"use client";

import { useState, useEffect } from "react";
import useVitalsSocket, { VitalData } from "@/hooks/useVitalsSocket";
import VitalGrid from "@/components/vitals/VitalGrid";
import MonitoringFilters from "@/components/vitals/MonitoringFilters";
import DashboardShell from "@/components/DashboardShell";
import { Activity, ShieldCheck, Cpu, BellRing, Database, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";

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
                label: d.device_label,
                mode: d.device_mode,
                state: d.device_state,
                last_seen: d.timestamp,
              },
              patient: {
                id: d.patient_id,
                name: d.patient_name,
                location: d.ward_id ? `Ward ${d.ward_id} / Bed R${d.bed_id}` : "CALIBRATION",
                ward_id: d.ward_id,
              },
              vitals: {
                heart_rate: d.heart_rate,
                spo2: d.spo2,
                respiratory_rate: 0, 
                temperature: d.temperature,
                bp: d.bp || "---/---",
                timestamp: d.timestamp,
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
              const respWave = generateSyntheticWaveform("PPG", latest.respiratory_rate || 18, 300);

              return {
                ...v,
                vitals: {
                   ...v.vitals,
                   heart_rate: latest.heart_rate,
                   spo2: latest.spo2,
                   respiratory_rate: latest.respiratory_rate,
                   temperature: latest.temperature,
                   bp: latest.bp,
                   timestamp: latest.timestamp,
                },
                waveform: {
                  ecg: ecgWave,
                  spo2: ppgWave,
                  resp: respWave
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
    <DashboardShell>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <div className="flex -space-x-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse delay-75" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 italic">
                    Live Telemetry Stream
                </span>
            </div>
            <h1 className="text-5xl font-black text-zinc-100 uppercase tracking-tighter leading-none">
              Command <span className="text-emerald-500">Center</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium italic max-w-xl">
              Global clinical monitoring nexus. Synchronized hardware telemetry and patient observation with zero-latency pulse protocols.
            </p>
          </div>

          {/* Connected Sources Hub */}
          <div className="flex gap-4 p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800 shadow-xl backdrop-blur-md">
            <div className="px-5 border-r border-zinc-800/50">
              <span className="block text-[9px] font-black text-zinc-600 uppercase mb-1">Total Monitored</span>
              <span className="text-2xl font-black text-zinc-100 tracking-tighter">{filteredVitals.length}</span>
            </div>
            <div className="px-5 border-r border-zinc-800/50">
              <span className="block text-[9px] font-black text-rose-600 uppercase mb-1">Critical Units</span>
              <span className="text-2xl font-black text-rose-500 tracking-tighter">{criticalFeeds}</span>
            </div>
            <div className="px-5">
              <span className="block text-[9px] font-black text-emerald-600 uppercase mb-1">System Health</span>
              <span className="text-2xl font-black text-emerald-500 tracking-tighter">
                {connected ? "100%" : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Hierarchical Filter Bar */}
        <MonitoringFilters onFilterChange={setFilters} />

        {/* Global Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-[2rem] bg-zinc-900/20 border border-zinc-800/50 flex items-center gap-5 group hover:bg-emerald-500/5 transition-all">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xl font-black text-zinc-200">{stableFeeds}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Healthy Signals</span>
                </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-zinc-900/20 border border-zinc-800/50 flex items-center gap-5 group hover:bg-rose-500/5 transition-all">
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                    <BellRing className="w-6 h-6 animate-swing" />
                </div>
                <div>
                    <span className="block text-xl font-black text-zinc-200">{criticalFeeds}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Active Alerts</span>
                </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-zinc-900/20 border border-zinc-800/50 flex items-center gap-5 group hover:bg-blue-500/5 transition-all">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xl font-black text-zinc-200">{filteredVitals.length}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Fleet Interface</span>
                </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-zinc-900/20 border border-zinc-800/50 flex items-center gap-5 group hover:bg-amber-500/5 transition-all">
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xl font-black text-zinc-200">{connected ? "ACTIVE" : "ERROR"}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Data Pipeline</span>
                </div>
            </div>
        </div>

        {/* Main Monitoring Grid */}
        <VitalGrid vitals={vitals} connected={connected} filters={filters} filteredVitals={filteredVitals} />
      </div>
    </DashboardShell>
  );
}
