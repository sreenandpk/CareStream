"use client";

import api from "@/lib/axios";
import { 
  Search, 
  Activity, 
  User,
  Zap,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  Stethoscope,
  Shield,
  Clock,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface PatientCondition {
    id: number;
    name: string;
    age: number;
    gender: string;
    diagnosis: string;
    clinical_condition: "STABLE" | "GUARDED" | "CRITICAL" | "RECOVERING";
    ai_condition_summary: string | null;
    last_ai_assessment: string | null;
}

export default function ConditionMatrixPage() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<PatientCondition[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchConditions = async () => {
        try {
            setLoading(true);
            const response = await api.get("patients/admin/patients/");
            if (response.data.success) {
                setPatients(response.data.data);
            }
        } catch (e) {
            console.error("Condition Matrix Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchConditions();
  }, [user]);

  const filteredPatients = patients.filter(p => {
    const searchLower = search.toLowerCase();
    return p.name.toLowerCase().includes(searchLower) || 
           p.diagnosis?.toLowerCase().includes(searchLower) ||
           p.clinical_condition.toLowerCase().includes(searchLower);
  });

  const criticalCount = patients.filter(p => p.clinical_condition === "CRITICAL").length;

    return (
        <div className="p-10 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🏥 CLINICAL HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Patient Status <span className="text-[#5C61F2]">Overview</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-white rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center min-w-[160px]">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Zap className="w-3 h-3 animate-pulse" />
                                Critical
                            </span>
                            <span className="text-3xl font-black text-rose-600 tracking-tighter leading-none">{criticalCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚨 CRITICAL BROADCAST */}
            {criticalCount > 0 && (
                <div className="bg-rose-600 p-8 rounded-[2.5rem] shadow-2xl shadow-rose-600/20 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="flex items-center gap-8 z-10">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce shadow-inner">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Critical Alerts Detected</h2>
                            <p className="text-rose-100 text-[11px] font-black uppercase tracking-widest mt-1 opacity-80">Immediate attention required for {criticalCount} patients.</p>
                        </div>
                    </div>
                    <div className="text-white/10 font-black text-7xl italic select-none uppercase tracking-tighter z-0 hidden lg:block">Emergency</div>
                </div>
            )}

            {/* 🔍 SEARCH */}
            <div className="relative group max-w-4xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                    placeholder="SEARCH BY NAME, DIAGNOSIS, OR STATUS..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-14 bg-white border-zinc-200 text-zinc-900 h-16 rounded-2xl focus:ring-1 focus:ring-[#5C61F2]/10 shadow-sm transition-all uppercase font-black text-[11px] tracking-widest"
                />
            </div>

            {/* 📉 CONDITION GRID */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-zinc-100 shadow-sm">
                    <Loader2 className="w-12 h-12 text-[#5C61F2] animate-spin mb-6" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Loading patient data...</span>
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {filteredPatients.map((patient) => (
                        <div 
                            key={patient.id}
                            className={cn(
                                "group relative p-10 rounded-[3rem] border transition-all duration-500 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col",
                                patient.clinical_condition === "CRITICAL" ? "border-rose-200/60 ring-1 ring-rose-50" : "border-zinc-100"
                            )}
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 border-none",
                                        patient.clinical_condition === "CRITICAL" ? "bg-rose-600 text-white shadow-rose-600/20" :
                                        patient.clinical_condition === "GUARDED" ? "bg-amber-500 text-white shadow-amber-500/20" :
                                        "bg-[#5C61F2] text-white shadow-[#5C61F2]/20"
                                    )}>
                                        <User className="w-10 h-10" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-3">
                                            {patient.name}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                {patient.gender} • {patient.age}y
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-100" />
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                Dx: {patient.diagnosis || "Undetermined"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={cn(
                                    "px-5 py-2 rounded-xl border-none text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                                    patient.clinical_condition === "CRITICAL" ? "bg-rose-50 text-rose-600" :
                                    patient.clinical_condition === "GUARDED" ? "bg-amber-50 text-amber-600" :
                                    "bg-emerald-50 text-emerald-600"
                                )}>
                                    {patient.clinical_condition}
                                </div>
                            </div>

                            <div className="flex-1 space-y-8">
                                <div className="p-8 bg-zinc-50/50 rounded-[2.5rem] border border-zinc-100 relative group-hover:bg-white group-hover:border-indigo-100 transition-all duration-500">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BrainCircuit className="w-4 h-4 text-indigo-400" />
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">AI Summary</span>
                                    </div>
                                    <p className="text-sm font-bold text-zinc-600 leading-relaxed italic text-left">
                                        "{patient.ai_condition_summary || "Stable telemetry handshake. Patterns align with historical baseline for current diagnosis."}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-1 leading-none">Assessment Engine</span>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Scikit-Learn v1.4</span>
                                        </div>
                                        <div className="w-px h-8 bg-zinc-100" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-1 leading-none">Last Timestamp</span>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                                {patient.last_ai_assessment ? formatDistanceToNow(new Date(patient.last_ai_assessment), { addSuffix: true }) : "REAL_TIME"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="h-14 px-8 rounded-2xl bg-[#5C61F2] hover:bg-[#4A4ED4] text-white transition-all shadow-lg shadow-[#5C61F2]/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group/btn active:scale-95 border-none"
                                    >
                                        Clinical Profile
                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border border-zinc-100 shadow-sm">
                    <CheckCircle2 className="w-20 h-20 text-emerald-100 mb-10" />
                    <h3 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">All Patients Stable</h3>
                    <p className="text-zinc-400 text-center mt-4 max-w-md font-black uppercase tracking-widest text-[11px] leading-relaxed">
                        No issues detected. All patient monitors report normal activity across the hospital.
                    </p>
                </div>
            )}
        </div>
    );
}
