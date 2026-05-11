"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { 
    Building2, 
    BedDouble, 
    Users, 
    Activity, 
    ChevronRight,
    Loader2,
    MapPin,
    Stethoscope
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WardStats {
    id: number;
    name: string;
    floor: number;
    total_beds: number;
    occupied_beds: number;
    active_monitors: number;
    critical_alerts: number;
}

export default function NurseWardsPage() {
    const [wards, setWards] = useState<WardStats[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchWardSummary() {
            try {
                setLoading(true);
                const res = await api.get("wards/nurse/wards/");
                if (res.data.success) {
                    const data = res.data.data.map((w: any) => {
                        let total = 0;
                        let occupied = 0;
                        w.rooms.forEach((r: any) => {
                            total += r.beds.length;
                            occupied += r.beds.filter((b: any) => b.patient).length;
                        });

                        return {
                            id: w.id,
                            name: w.name,
                            floor: w.floor,
                            total_beds: total,
                            occupied_beds: occupied,
                            active_monitors: occupied, // For now assuming 1:1
                            critical_alerts: 0 // Will be populated by real-time soon
                        };
                    });
                    setWards(data);
                }
            } catch (err) {
                console.error("Ward Summary Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchWardSummary();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-32">
                <Loader2 className="w-12 h-12 text-[#5C61F2] animate-spin mb-6" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 text-center">
                    Synchronizing Ward Matrix...
                </span>
            </div>
        );
    }

    return (
        <div className="p-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tight text-zinc-900 uppercase">
                        Ward <span className="text-[#5C61F2]">Overview</span>
                    </h1>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest leading-loose">
                        Global clinical distribution and unit occupancy status
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {wards.map((ward, idx) => (
                    <motion.div
                        key={ward.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => router.push("/dashboard/nurse")}
                        className="group bg-white rounded-[3rem] border border-zinc-200/60 p-10 shadow-sm hover:shadow-2xl hover:shadow-[#5C61F2]/10 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5C61F2]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-[#5C61F2] group-hover:border-[#5C61F2] transition-colors duration-500">
                                    <Building2 className="w-7 h-7 text-zinc-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Floor</span>
                                    <span className="text-lg font-black text-zinc-900 tracking-tighter italic">{ward.floor}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-black text-zinc-900 tracking-tight uppercase group-hover:text-[#5C61F2] transition-colors">
                                    {ward.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Main Campus / Unit {ward.id}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-100/50 space-y-1">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Occupancy</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-zinc-900 tracking-tight">{ward.occupied_beds}</span>
                                        <span className="text-xs font-bold text-zinc-400">/ {ward.total_beds}</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-100/50 space-y-1">
                                    <span className="text-[9px] font-black text-[#5C61F2] uppercase tracking-widest block">Active Telemetry</span>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#5C61F2] animate-pulse" />
                                        <span className="text-xl font-black text-zinc-900 tracking-tight">{ward.active_monitors}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Acuity Stable</span>
                                </div>
                                <div className="flex items-center gap-1 text-[#5C61F2] group-hover:translate-x-2 transition-transform">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Enter Unit</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {wards.length === 0 && (
                <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[4rem] border-2 border-dashed border-zinc-100 opacity-50">
                    <Stethoscope className="w-16 h-16 text-zinc-200 mb-6" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 text-center">No assigned wards detected for current session</p>
                </div>
            )}
        </div>
    );
}
