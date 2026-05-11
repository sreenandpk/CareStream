"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  X, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Clock,
  Activity,
  History,
  AlertTriangle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import VitalWaveform from "./VitalWaveform";
import { generateSyntheticWaveform } from "@/lib/waveform-utils";

interface HistoricalExplorerProps {
  deviceId: number;
  deviceSerial: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryPulse {
  heart_rate: number;
  spo2: number;
  temperature: number;
  bp: string;
  timestamp: string;
}

export default function HistoricalExplorer({ 
  deviceId,
  deviceSerial, 
  patientName, 
  isOpen, 
  onClose 
}: HistoricalExplorerProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryPulse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  // 🕒 INITIAL HANDSHAKE: Fetch 5-minute authoritative history
  useEffect(() => {
    if (isOpen) {
      const loadHistory = async () => {
        try {
          setLoading(true);
          const rolePath = user?.role?.toLowerCase() || 'admin';
          const endpoint = `vitals/${rolePath}/history/`;
          
          const res = await api.get(`${endpoint}?device_id=${deviceId}&minutes=5&review=true`);
          if (res.data.success) {
            setHistory(res.data.results || []);
            setCurrentIndex((res.data.results || []).length - 1);
          }
        } catch (err) {
          console.error("Historical Engine: Load failed", err);
        } finally {
          setLoading(false);
        }
      };
      loadHistory();
    } else {
      setHistory([]);
      setIsPlaying(false);
    }
  }, [isOpen, deviceSerial]);

  // ⏯ PLAYBACK ENGINE
  useEffect(() => {
    if (isPlaying && currentIndex < history.length - 1) {
      playerTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= history.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000); 
    } else {
      if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    }
    return () => { if (playerTimerRef.current) clearInterval(playerTimerRef.current); };
  }, [isPlaying, currentIndex, history.length]);

  const currentData = history[currentIndex];

  // 🏥 WAVEFORM RECONSTRUCTION
  const waves = useMemo(() => {
    if (!currentData) return { ecg: [], spo2: [] };
    const baseTime = currentData ? new Date(currentData.timestamp).getTime() : Date.now();
    return {
      ecg: generateSyntheticWaveform("ECG", currentData.heart_rate || 75, 500, baseTime),
      spo2: generateSyntheticWaveform("PPG", currentData.spo2 || 98, 500, baseTime),
    };
  }, [currentData, currentIndex]);

  const formatReviewTime = (ts: string) => {
    try {
        return format(new Date(ts), "HH:mm:ss");
    } catch {
        return "00:00:00";
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[550px] bg-white border border-zinc-200 p-0 overflow-hidden text-zinc-900 shadow-2xl rounded-[2.5rem] ring-1 ring-zinc-100 [&>button]:hidden">

        <DialogHeader className="px-8 py-6 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0 bg-white">
          <div className="flex flex-col">
            <DialogTitle className="text-2xl font-black tracking-tight uppercase text-zinc-900 leading-none mb-1">
              {patientName}
            </DialogTitle>
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Clinical History Replay</span>
          </div>
          <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-zinc-50 rounded-xl border border-zinc-100">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Unit: {deviceSerial}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 transition-all"
              >
                <X className="w-5 h-5" />
              </Button>
          </div>
        </DialogHeader>

        <div className="p-0 space-y-0">
          {loading ? (
             <div className="h-[250px] flex flex-col items-center justify-center space-y-4 bg-zinc-50/50">
                 <div className="w-10 h-10 border-4 border-[#5C67F2]/10 border-t-[#5C67F2] rounded-full animate-spin" />
                 <span className="text-[10px] font-black text-[#5C67F2] uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</span>
             </div>
          ) : history.length === 0 ? (
            <div className="h-[250px] flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                    <AlertTriangle className="w-8 h-8 text-zinc-200" />
                </div>
                <span className="text-zinc-400 font-black text-[11px] uppercase tracking-widest">No Authoritative Records Found</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* 📊 TELEMETRY RECONSTRUCTION GRID (MATCHES VITALCARD) */}
              <div className="flex h-[240px] border-b border-zinc-100">
                 {/* WAVEFORM SECTOR */}
                 <div className="flex-1 bg-[#BEADFF]/10 flex flex-col relative border-r border-zinc-100">
                    <div className="h-[120px] relative border-b border-black/5 group/wave">
                        <div className="absolute top-2 left-4 z-20 flex items-center gap-1.5 opacity-50">
                            <span className="text-zinc-900 font-black text-[9px] uppercase tracking-tighter">ECG II</span>
                        </div>
                        <VitalWaveform data={waves.ecg} color="#00FF00" type="ECG" state="LIVE" isReview={true} />
                    </div>
                    <div className="h-[120px] relative group/wave">
                        <div className="absolute top-2 left-4 z-20 flex items-center gap-1.5 opacity-50">
                            <span className="text-zinc-900 font-black text-[9px] uppercase tracking-tighter">PLETH</span>
                        </div>
                        <VitalWaveform data={waves.spo2} color="#FFD700" type="PPG" state="LIVE" isReview={true} />
                    </div>
                 </div>

                 {/* NUMERIC SECTOR (MATCHES VITALCARD) */}
                 <div className="w-[140px] flex flex-col bg-zinc-50 px-5 py-5 space-y-6 relative">
                    <div className="flex flex-col items-end">
                        <span className="text-rose-500 font-black text-[9px] uppercase tracking-widest mb-1">HR</span>
                        <span className="text-5xl font-black tracking-tighter leading-none text-zinc-900">
                            {currentData?.heart_rate ?? "--"}
                        </span>
                    </div>

                    <div className="flex flex-col items-end pt-5 border-t border-zinc-200/60">
                        <span className="text-amber-500 font-black text-[9px] uppercase tracking-widest mb-1">SpO2 %</span>
                        <span className="text-4xl font-black tracking-tighter leading-none text-zinc-900">
                            {currentData?.spo2 ?? "--"}
                        </span>
                    </div>

                    <div className="flex-1" />

                 </div>
              </div>

              <div className="bg-white p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "w-10 h-10 rounded-full border transition-all duration-300",
                            isPlaying 
                            ? "bg-[#5C67F2]/10 border-[#5C67F2]/30 text-[#5C67F2] shadow-[0_0_15px_rgba(92,103,242,0.1)]" 
                            : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        )}
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                    </Button>

                    <div className="flex items-center gap-1.5">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                setCurrentIndex(Math.max(0, currentIndex - 1));
                                setIsPlaying(false);
                            }}
                            className="w-10 h-10 text-zinc-400 hover:text-[#5C67F2] hover:bg-[#5C67F2]/5 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                setCurrentIndex(Math.min(history.length - 1, currentIndex + 1));
                                setIsPlaying(false);
                            }}
                            className="w-10 h-10 text-zinc-400 hover:text-[#5C67F2] hover:bg-[#5C67F2]/5 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Timeline Scrub */}
                    <div className="flex-1 px-4 flex flex-col gap-2 group">
                        <input 
                            type="range"
                            min={0}
                            max={history.length - 1}
                            value={currentIndex}
                            onChange={(e) => {
                                setCurrentIndex(parseInt(e.target.value));
                                setIsPlaying(false);
                            }}
                            className="flex-1 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#5C67F2] hover:accent-[#5C67F2]/80 transition-all"
                        />
                        <div className="flex justify-between items-center px-0.5">
                             <div className="flex items-center gap-4">
                                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                                    -5M
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">At:</span>
                                    <span className="text-[10px] font-black text-[#5C67F2] font-mono">
                                        {currentData ? formatReviewTime(currentData.timestamp) : "--:--:--"}
                                    </span>
                                </div>
                             </div>
                             <span className="text-[8px] font-black text-[#5C67F2]/40 uppercase tracking-widest">
                                LIVE REPLAY
                             </span>
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                            setCurrentIndex(history.length - 1);
                            setIsPlaying(false);
                        }}
                        className="w-10 h-10 text-zinc-300 hover:text-[#5C67F2] hover:bg-[#5C67F2]/5 rounded-full transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
