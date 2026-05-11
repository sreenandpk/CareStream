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
  ClipboardCheck,
  Wifi,
  WifiOff,
  AlertTriangle,
  Shield,
  BrainCircuit,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

import VitalWaveform from "./VitalWaveform";
import { Button } from "@/components/ui/button";

interface VitalCardProps {
  data: VitalData;
  onReview?: () => void;
}

export default function VitalCard({ data, onReview }: VitalCardProps) {
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const { user } = useAuthStore();

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

  const isOffline = data.device.state === "OFFLINE" || data.is_stale;
  const isDelayed = data.device.state === "DELAYED";
  const isSimulation = data.device.mode === "SIMULATION";
  const isSyncing = !hasReceivedData && data.device.state === "LIVE";

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
  } else if (data.is_stale) {
    statusLabel = "SIGNAL TIMEOUT";
    statusColor = "text-rose-500/60";
    dotColor = "bg-rose-500/50 animate-pulse";
  } else {
    statusLabel = "Live Feed";
    statusColor = "text-emerald-500";
    dotColor = "bg-emerald-500 shadow-[0_0_8px_#10b981]";
  }

  return (
    <div 
      onClick={() => !isOffline && setIsConditionModalOpen(true)}
      className={cn(
        "relative bg-white transition-all duration-700 overflow-hidden shadow-sm hover:shadow-xl group cursor-pointer rounded-[2.5rem] border border-zinc-200/60",
        isCritical && !isOffline ? "ring-2 ring-rose-500/50" : "",
        isOffline ? "opacity-60 grayscale-[0.8]" : "opacity-100",
        isDelayed && "opacity-90"
      )}
    >
      {/* 🟦 SIMULATION THEME OVERLAY */}
      {isSimulation && !isOffline && (
        <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none z-0" />
      )}
      
      {/* HEADER SECTION */}
      <div className="relative z-10 px-6 py-4 border-b border-zinc-100 bg-white flex items-center justify-between gap-3">
        {/* Left: Patient Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-zinc-900 uppercase tracking-tight truncate leading-none">
              {data.patient.name}
            </span>
            <div className={cn(
                "flex-shrink-0 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border",
                isSimulation ? "bg-blue-50 text-[#5C67F2] border-blue-100" : "bg-zinc-50 text-zinc-400 border-zinc-100"
            )}>
                {isSimulation ? "Sim" : "Tele"}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
             <span className={cn(
                "text-[8px] font-black uppercase tracking-widest",
                isCritical && !isOffline ? "text-rose-500 animate-pulse" : "text-zinc-400"
             )}>
               {data.patient.id ? `ID: ${data.patient.id}` : "Observing"}
             </span>
             <div className="h-1 w-1 rounded-full bg-zinc-200" />
             <span className={cn("text-[8px] font-black uppercase tracking-widest", statusColor)}>
                {statusLabel}
             </span>
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isOffline && !isSimulation && data.system?.rssi && (
            <div className="hidden sm:flex items-center gap-1">
                <Wifi className={cn(
                  "w-2.5 h-2.5",
                  data.system.rssi > -50 ? "text-emerald-500" :
                  data.system.rssi > -70 ? "text-amber-500" : "text-rose-500"
                )} />
                <span className="text-[6px] font-black text-zinc-500">{data.system.rssi}</span>
            </div>
          )}

          <div className={cn(
              "px-2.5 py-1 rounded-xl flex items-center gap-1.5 border transition-colors duration-500",
              data.system_condition === "CRITICAL" ? "bg-rose-50 border-rose-100 text-rose-500" :
              data.system_condition === "WARNING" ? "bg-amber-50 border-amber-100 text-amber-500" :
              "bg-zinc-50 border-zinc-100 text-zinc-400"
          )}>
              <Activity className="w-3 h-3" />
              <span className="text-[7px] font-black uppercase tracking-widest">{data.system_condition || "NORMAL"}</span>
          </div>

          <div className={cn("w-2 h-2 rounded-full shadow-sm animate-pulse flex-shrink-0", dotColor)} />

            {/* 🕒 5 MIN HISTORY BUTTON */}
            {onReview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReview();
                }}
                className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-[#5C67F2] hover:bg-[#5C67F2]/5 hover:border-[#5C67F2]/20 transition-all flex items-center justify-center group/hist relative"
                title="Review 5m History"
              >
                <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-[#5C67F2] rounded-full border border-white shadow-sm opacity-0 group-hover/hist:opacity-100 transition-opacity" />
              </button>
            )}
        </div>
  </div>

      {/* 📡 CONSOLIDATED FAILURE OVERLAY */}
      <AnimatePresence>
        {(isOffline || isDelayed || data.system?.signal_state === "LOST") && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-white/40 backdrop-blur-md flex flex-col items-center justify-center rounded-[2.5rem] pointer-events-none"
          >
              <div className="w-16 h-16 rounded-[2rem] bg-rose-50 flex items-center justify-center mb-6 border border-rose-100 shadow-sm">
                <WifiOff className="w-8 h-8 text-rose-500" />
              </div>
              <div className="bg-rose-500 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase shadow-lg shadow-rose-500/20 animate-pulse mb-6 tracking-[0.15em]">
                 Signal Lost
              </div>
              <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">
                 {data.patient.name}
              </h3>
              <div className="flex flex-col items-center gap-1.5 opacity-60">
                <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest">
                   {data.vitals.timestamp ? (
                      new Date(data.vitals.timestamp).getFullYear() > 1980 
                      ? `Disconnected: ${
                          isToday(new Date(data.vitals.timestamp)) 
                          ? `${format(new Date(data.vitals.timestamp), "hh:mm:ss a")} Today`
                          : isYesterday(new Date(data.vitals.timestamp))
                          ? `${format(new Date(data.vitals.timestamp), "hh:mm:ss a")} Yesterday`
                          : format(new Date(data.vitals.timestamp), "MMM dd | hh:mm:ss a")
                        }` 
                      : "Handshake Pending"
                   ) : "No Data Sync"}
                </span>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧠 AI PREDICTIVE INSIGHT OVERLAY */}
      {!isOffline && data.ai_suggestion?.reasons?.some(r => r.includes("AI RISK")) && (
          <div className="absolute bottom-4 left-4 z-50 flex items-start gap-3 bg-white border border-amber-200 p-4 rounded-2xl shadow-xl max-w-[240px]">
              <div className="mt-1 p-1.5 bg-amber-500/10 rounded-lg animate-pulse">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Clinical Insight</span>
                  </div>
                  {data.ai_suggestion.reasons.filter(r => r.includes("AI RISK")).map((reason, idx) => (
                      <p key={idx} className="text-[10px] font-bold text-zinc-700 leading-tight">
                          {reason.replace("AI RISK: ", "")}
                      </p>
                  ))}
              </div>
          </div>
      )}

      <div className="flex h-[310px]">
        {/* WAVEFORM SECTOR */}
        <div className={cn(
            "flex-1 bg-[#BEADFF]/15 flex flex-col relative border-r border-zinc-200/60 transition-filter duration-700",
            isOffline && "grayscale contrast-[0.8] brightness-[0.7]"
        )}>
          <div className="h-[155px] relative border-b border-black/5 group/wave">
            <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-50 group-hover/wave:opacity-100">
                <span className="text-zinc-900 font-black text-[9px] tracking-tighter uppercase">ECG II</span>
                <span className="text-zinc-600 font-bold text-[7px]">X1.0</span>
            </div>
            <VitalWaveform data={data.waveform?.ecg || []} color="#00FF00" type="ECG" state={data.device.state} isStale={data.is_stale} signalState={data.system?.signal_state} />
          </div>
          <div className="h-[155px] relative group/wave flex-shrink-0">
            <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-50 group-hover/wave:opacity-100">
                <span className="text-zinc-900 font-black text-[9px] tracking-tighter uppercase">Pleth</span>
            </div>
            <VitalWaveform data={data.waveform?.spo2 || []} color="#FFD700" type="PPG" state={data.device.state} isStale={data.is_stale} signalState={data.system?.signal_state} />
          </div>
        </div>

        {/* NUMERIC SECTOR */}
        <div className="w-[120px] flex flex-col bg-zinc-50 px-4 pt-4 pb-4 space-y-4 relative border-l border-zinc-100">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-rose-500 font-black text-[9px] uppercase tracking-widest">HR</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={cn(
                    "text-5xl font-black tracking-tighter leading-none transition-colors duration-700",
                    isOffline ? "text-zinc-300" : 
                    data.system?.signal_state === "LOST" ? "text-zinc-200" :
                    (data.vitals.heart_rate > 120 || data.vitals.heart_rate < 50) ? "text-rose-500" : "text-zinc-900"
                )}>
                {data.system?.signal_state === "LOST" ? "---" : (data.vitals.heart_rate ?? "---")}
                </span>
            </div>
            <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4].map(v => (
                    <div key={v} className={cn(
                        "w-4 h-1.5 rounded-full transition-colors duration-500",
                        (data.system?.signal_state === "LOST" || isOffline) ? "bg-zinc-200" : "bg-rose-500/20"
                    )} />
                ))}
            </div>
          </div>

          <div className="flex flex-col items-end pt-4 border-t border-zinc-200/60">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-amber-500 font-black text-[9px] uppercase tracking-widest">SpO2 %</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={cn(
                    "text-4xl font-black tracking-tighter leading-none transition-colors duration-700",
                    isOffline ? "text-zinc-300" : 
                    data.system?.signal_state === "LOST" ? "text-zinc-200" :
                    data.vitals.spo2 < 90 ? "text-rose-500" : "text-zinc-900"
                )}>
                    {data.system?.signal_state === "LOST" ? "---" : (data.vitals.spo2 ?? "---")}
                </span>
            </div>
            <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4].map(v => (
                    <div key={v} className={cn(
                        "w-4 h-1.5 rounded-full transition-colors duration-500",
                        (data.system?.signal_state === "LOST" || isOffline) ? "bg-zinc-200" : "bg-amber-500/20"
                    )} />
                ))}
            </div>
          </div>
        </div>
      </div>
      
      
      {/* 🧠 AI OBSERVATION SUMMARY MODAL */}
      <AnimatePresence>
        {isConditionModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-24">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setIsConditionModalOpen(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] border border-zinc-100 p-12 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm bg-zinc-50 text-zinc-400 border border-zinc-100">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-2">{data.patient.name}</h2>
                      <span className="text-[11px] font-black text-[#5C67F2] uppercase tracking-widest">Clinical Observation Active</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsConditionModalOpen(false)}
                    className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                  >
                    <span className="text-zinc-400 text-2xl">×</span>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-6">
                      <BrainCircuit className="w-5 h-5 text-[#5C67F2]/50" />
                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Clinical Insight Engine</span>
                    </div>
                    <p className="text-base font-medium text-zinc-700 leading-relaxed tracking-tight">
                      "{data.ai_condition_summary || "Telemetry patterns are normal. Continuing continuous observation."}"
                    </p>
                    <div className="mt-8 flex items-center gap-3 opacity-60">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Autonomous Sync Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                   <Button 
                    onClick={() => setIsConditionModalOpen(false)}
                    className="h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-[#5C67F2] text-white shadow-lg shadow-blue-600/20 hover:scale-[1.02]"
                   >
                     Confirm Observation
                   </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
