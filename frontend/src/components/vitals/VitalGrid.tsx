"use client";

import { VitalData } from "@/hooks/useVitalsSocket";
import VitalCard from "./VitalCard";
import { Activity, ShieldAlert, Zap, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface VitalGridProps {
  vitals: VitalData[];
  connected: boolean;
  filters: { wardId: string; roomId: string; bedId: string };
  filteredVitals: VitalData[];
}

export default function VitalGrid({ vitals, connected, filters, filteredVitals }: VitalGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = filteredVitals.filter(v => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (v.patient.name || "").toLowerCase().includes(query) ||
      (v.device.label || "").toLowerCase().includes(query) ||
      v.device.serial.toLowerCase().includes(query);
    return matchesSearch;
  });

  const criticalCount = searchResults.filter(data => 
    data.vitals.heart_rate > 120 || 
    data.vitals.heart_rate < 50 || 
    data.vitals.spo2 < 90
  ).length;

  if (vitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-800 backdrop-blur-sm">
        <Activity className="w-16 h-16 text-zinc-800 mb-6 animate-pulse" />
        <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-tight">Telemetry Silent</h3>
        <p className="text-zinc-600 text-center mt-3 max-w-sm font-medium italic">
          No live monitoring feeds detected in the clinical infrastructure. 
          Hardware must be set to 'Simulation' or 'Real' to begin broadcasting vitals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 backdrop-blur-xl">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder="Search active monitor by name or station ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-black/40 border-zinc-800 focus:border-emerald-500/50 h-12 rounded-2xl transition-all"
          />
        </div>
        
        <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{vitals.length} Monitors Active</span>
            </div>
            {criticalCount > 0 && (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">{criticalCount} Critical Units</span>
                </div>
            )}
            <div className="flex items-center gap-2">
                <Zap className={cn("w-4 h-4", connected ? "text-amber-500" : "text-zinc-700")} />
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    {connected ? "Satellite Sync Active" : "Line Interrupted"}
                </span>
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {searchResults.map((data) => (
          <VitalCard key={data.device.serial} data={data} />
        ))}
      </div>
      
      {filteredVitals.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/30 rounded-3xl border border-zinc-900">
            <ShieldAlert className="w-10 h-10 text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-tight">No monitors matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

// Helper for conditional classes if cn is not imported correctly in this scope
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
