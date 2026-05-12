"use client";

import { VitalData } from "@/hooks/useVitalsSocket";
import VitalCard from "./VitalCard";
import { Activity, ShieldAlert, Zap, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import HistoricalExplorer from "./HistoricalExplorer";

interface VitalGridProps {
  vitals: VitalData[];
  connected: boolean;
  filters: { wardId: string; roomId: string; bedId: string };
  filteredVitals: VitalData[];
}

export default function VitalGrid({ vitals, connected, filters, filteredVitals }: VitalGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewContext, setReviewContext] = useState<{ id: number; serial: string; name: string } | null>(null);

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
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[3rem] border border-zinc-100 shadow-sm text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 flex items-center justify-center mb-8 border border-zinc-100">
            <Activity className="w-10 h-10 text-zinc-300 animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">Telemetry Silent</h3>
        <p className="text-zinc-500 max-w-sm font-medium leading-relaxed">
          No live monitoring feeds detected in the clinical infrastructure. 
          Configure hardware to begin broadcasting patient vitals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-4 rounded-[2.5rem] border border-zinc-200/60 shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#5C67F2] transition-colors" />
          <Input
            placeholder="Search active monitor by name or station ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 bg-zinc-50 border-zinc-100 focus:border-[#5C67F2]/30 h-14 rounded-[1.5rem] transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {searchResults.map((data) => (
          <VitalCard 
            key={data.device.serial} 
            data={data} 
            onReview={() => setReviewContext({ id: data.device.id, serial: data.device.serial, name: data.patient.name || "Unknown" })}
          />
        ))}
      </div>

      {/* HISTORICAL REVIEW LAYER */}
      {reviewContext && (
        <HistoricalExplorer
            isOpen={!!reviewContext}
            onClose={() => setReviewContext(null)}
            deviceId={reviewContext.id}
            deviceSerial={reviewContext.serial}
            patientName={reviewContext.name}
        />
      )}
      
      {filteredVitals.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/30 rounded-3xl border border-zinc-900">
            <ShieldAlert className="w-10 h-10 text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-tight">No monitors matching <span>&quot;</span>{searchQuery}<span>&quot;</span></p>
        </div>
      )}
    </div>
  );
}

// Helper for conditional classes if cn is not imported correctly in this scope
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
