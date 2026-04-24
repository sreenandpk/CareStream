"use client";

import { useEffect, useState, useRef } from "react";
import { VitalData } from "@/hooks/useVitalsSocket";
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplets, 
  Clock, 
  User, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import VitalWaveform from "./VitalWaveform";

interface VitalCardProps {
  data: VitalData;
}

export default function VitalCard({ data }: VitalCardProps) {
  const [hasReceivedData, setHasReceivedData] = useState(false);

  // 🔥 Track the first actual data pulse
  useEffect(() => {
    if (data.vitals.heart_rate !== null) {
      setHasReceivedData(true);
    }
  }, [data.vitals.heart_rate]);

  const isCritical = 
    data.vitals.heart_rate !== null && (
        data.vitals.heart_rate > 120 || 
        data.vitals.heart_rate < 50 || 
        data.vitals.spo2 < 90
    );

  const isOffline = data.device.state === "OFFLINE" || !hasReceivedData;
  const isDelayed = data.device.state === "DELAYED";
  const isSimulation = data.device.mode === "SIMULATION";

  // 🏥 CLINICAL STATE MAPPING
  let statusColor = "text-rose-500";
  let statusLabel = "No Signal";
  let dotColor = "bg-rose-500";

  if (isOffline) {
    statusLabel = "No Signal";
    statusColor = "text-rose-500";
    dotColor = "bg-rose-500";
  } else if (isDelayed) {
    statusLabel = "Signal Delay";
    statusColor = "text-amber-500";
    dotColor = "bg-amber-500 shadow-[0_0_8px_#f59e0b]";
  } else if (isSimulation) {
    statusLabel = "Simulated Feed";
    statusColor = "text-cyan-400";
    dotColor = "bg-cyan-400 shadow-[0_0_8px_#22d3ee]";
  } else {
    statusLabel = "Live Feed";
    statusColor = "text-emerald-500";
    dotColor = "bg-emerald-500 shadow-[0_0_8px_#10b981]";
  }

  return (
    <div className={cn(
      "relative bg-black transition-all duration-700 overflow-hidden shadow-2xl group",
      isCritical && !isOffline ? "ring-2 ring-red-600/50" : "ring-1 ring-zinc-800",
      isOffline ? "opacity-60 grayscale-[0.8]" : "opacity-100",
      isDelayed && "opacity-90",
      isSimulation && "bg-zinc-950" // Subtle differentiation for simulators
    )}>
      {/* 🟦 SIMULATION THEME OVERLAY */}
      {isSimulation && !isOffline && (
        <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none z-0" />
      )}
      <div className="bg-zinc-900/50 px-4 py-1.5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 font-black text-[9px] uppercase tracking-widest leading-none">
            {data.device.label || data.device.serial}
          </span>
          <span className="text-emerald-500/80 font-bold text-[8px] uppercase tracking-wider">
             {data.patient.name || "UNASSIGNED"}
          </span>
          <div className={cn(
              "px-1.5 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-tighter",
              isSimulation ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-zinc-100/10 text-zinc-300 border border-zinc-100/10"
          )}>
              {isSimulation ? "Simulation Environment" : "Clinical Telemetry"}
          </div>
        </div>
        <div className="flex items-center gap-2 relative group-hover:scale-105 transition-transform">
            <span className={cn(
                "text-[7px] font-black uppercase tracking-tighter transition-colors duration-500",
                statusColor
            )}>
                {statusLabel}
            </span>
            <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                dotColor
            )} />
        </div>
      </div>

      {/* 📡 SIGNAL LOST OVERLAY (Clinical Snapshot Mode) */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-rose-500/30 rounded-lg pointer-events-none"
          >
              <div className="bg-rose-600 text-white text-[10px] font-black px-4 py-1.5 uppercase shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse mb-3">
                 SIGNAL LOST • SHOWING SNAPSHOT
              </div>
              <span className="text-white font-black text-xs uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded border border-white/5">
                 {data.patient.name}
              </span>
              <span className="text-zinc-400 font-bold text-[8px] uppercase tracking-widest mt-2">
                 {data.vitals.timestamp ? (
                    new Date(data.vitals.timestamp).getFullYear() > 1980 
                    ? `DISCONNECTED AT: ${
                        isToday(new Date(data.vitals.timestamp)) 
                        ? `${format(new Date(data.vitals.timestamp), "hh:mm:ss a")} (TODAY)`
                        : isYesterday(new Date(data.vitals.timestamp))
                        ? `${format(new Date(data.vitals.timestamp), "hh:mm:ss a")} (YESTERDAY)`
                        : format(new Date(data.vitals.timestamp), "MMM dd | hh:mm:ss a")
                      }` 
                    : "PROTOCOL INITIALIZING..."
                 ) : "PENDING DATA HANDSHAKE"}
              </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-[340px]">
        {/* 📉 WAVEFORM SECTOR (Left - 72%) */}
        <div className={cn(
            "flex-1 bg-black flex flex-col relative border-r border-zinc-800/80 transition-filter duration-700",
            isOffline && "grayscale contrast-[0.8] brightness-[0.7]"
        )}>
          
          {/* ECG Channel */}
          <div className="flex-1 relative border-b border-white/5 group/wave">
            <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-50 group-hover/wave:opacity-100">
                <span className="text-[#00FF00] font-black text-[9px] tracking-tighter uppercase">ECG II</span>
                <span className="text-[#00FF00]/30 font-bold text-[7px]">X1.0</span>
            </div>
            <VitalWaveform data={data.waveform?.ecg || []} color="#00FF00" type="ECG" state={data.device.state} />
          </div>

          {/* PLETH Channel (SPO2) */}
          <div className="flex-1 relative border-b border-white/5 group/wave">
            <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-50 group-hover/wave:opacity-100">
                <span className="text-[#FFD700] font-black text-[9px] tracking-tighter uppercase">Pleth</span>
            </div>
            <VitalWaveform data={data.waveform?.spo2 || []} color="#FFD700" type="PPG" state={data.device.state} />
          </div>

          {/* RESP Channel */}
          <div className="flex-1 relative group/wave">
            <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-50 group-hover/wave:opacity-100">
                <span className="text-[#00FFFF] font-black text-[9px] tracking-tighter uppercase">Resp</span>
            </div>
            <VitalWaveform data={data.waveform?.resp || []} color="#00FFFF" type="PPG" state={data.device.state} />
          </div>
        </div>

        {/* 🔢 NUMERIC SECTOR (Right - 28%) */}
        <div className="w-[110px] flex flex-col bg-zinc-950 px-2.5 pt-1.5 pb-2 space-y-1 relative">
          
          {/* HR BOX */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
                {isOffline && <span className="text-[7px] text-zinc-600 font-black italic">LKG</span>}
                <span className="text-emerald-500 font-bold text-[8px] uppercase tracking-tighter opacity-70">HR</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={cn(
                    "text-5xl font-black tracking-tighter leading-none pr-1 transition-colors duration-700",
                    isOffline ? "text-zinc-700" : (data.vitals.heart_rate > 120 || data.vitals.heart_rate < 50) ? "text-rose-500" : "text-emerald-500"
                )}>
                {data.vitals.heart_rate ?? "---"}
                </span>
            </div>
          </div>

          {/* SPO2 BOX */}
          <div className="flex flex-col items-end pt-2 border-t border-white/5">
            <div className="flex items-center gap-1">
                {isOffline && <span className="text-[7px] text-zinc-600 font-black italic">LKG</span>}
                <span className="text-yellow-400 font-bold text-[8px] uppercase tracking-tighter opacity-70">SpO2 %</span>
            </div>
            <span className={cn(
                "text-4xl font-black tracking-tighter leading-none pr-1 transition-colors duration-700",
                isOffline ? "text-zinc-700" : data.vitals.spo2 < 90 ? "text-rose-500" : "text-yellow-400"
            )}>
                {data.vitals.spo2 ?? "---"}
            </span>
          </div>

          {/* BP BOX */}
          <div className="flex flex-col items-end pt-3 border-t border-white/5">
            <span className="text-zinc-100 font-bold text-[8px] uppercase tracking-tighter opacity-70">NIBP</span>
            <span className={cn(
                "text-2xl font-black tracking-tighter leading-none pr-1",
                isOffline ? "text-zinc-700" : "text-zinc-100"
            )}>
                {data.vitals.bp ?? "---/---"}
            </span>
            <span className="text-[7px] font-bold text-zinc-600 mt-1 uppercase tracking-widest leading-none text-right">mmHg</span>
          </div>

          <div className="flex-1" />

          {/* RR/TEMP ROW */}
          <div className="flex justify-between items-end border-t border-white/5 pt-2 pb-1">
             <div className="flex flex-col">
                <span className="text-cyan-400 font-bold text-[7px] uppercase leading-none opacity-80">RR</span>
                <span className={cn(
                    "text-2xl font-black tracking-tighter leading-none mt-1",
                    isOffline ? "text-zinc-700" : "text-cyan-400"
                )}>{data.vitals.respiratory_rate ?? "--"}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-zinc-500 font-bold text-[7px] uppercase leading-none opacity-80">TEMP</span>
                <span className={cn(
                    "text-xl font-black tracking-tighter leading-none mt-1",
                    isOffline ? "text-zinc-700" : "text-zinc-400"
                )}>
                    {data.vitals.temperature ? data.vitals.temperature.toFixed(1) : "---"}
                </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
