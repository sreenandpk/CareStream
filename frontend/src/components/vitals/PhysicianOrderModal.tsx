"use client";

import { useState } from "react";
import { 
    X, 
    Pill, 
    Send, 
    AlertCircle, 
    Loader2,
    Calendar,
    Activity,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

interface PhysicianOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    patientName: string;
    onSuccess: () => void;
}

export default function PhysicianOrderModal({ 
    isOpen, 
    onClose, 
    patientId, 
    patientName,
    onSuccess 
}: PhysicianOrderModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState({
        medication_name: "",
        dosage: "",
        route: "Oral",
        frequency: "Once",
        notes: ""
    });

    const routes = ["Oral", "IV", "IM", "Subcutaneous", "Inhalation", "Topical"];
    const frequencies = ["Once", "Daily", "BID (2x Daily)", "TID (3x Daily)", "QID (4x Daily)", "Stat (Emergency)", "PRN (As Needed)"];

    const handleSubmit = async () => {
        if (!order.medication_name || !order.dosage) return;
        setSubmitting(true);
        try {
            const res = await api.post(`patients/doctor/patients/${patientId}/meds/`, order);
            if (res.data.success) {
                onSuccess();
                setOrder({ medication_name: "", dosage: "", route: "Oral", frequency: "Once", notes: "" });
                onClose();
            }
        } catch (e) {
            console.error("Order failed", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/40 backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white border-none rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* 💊 HEADER */}
                        <div className="p-8 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
                                    <Pill className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Clinical Directive</h2>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                        <Activity className="w-3.5 h-3.5" />
                                        Protocol for: <span className="text-zinc-900">{patientName}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-12 h-12 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-all group"
                            >
                                <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                            </button>
                        </div>

                        {/* 📝 FORM AREA */}
                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            
                            {/* Med & Dose Row */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                        Medication Identity
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="Pharmacological name..."
                                        value={order.medication_name}
                                        onChange={(e) => setOrder({...order, medication_name: e.target.value})}
                                        className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                         Prescribed Dosage
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. 500mg / 12h"
                                        value={order.dosage}
                                        onChange={(e) => setOrder({...order, dosage: e.target.value})}
                                        className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Route & Frequency Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                         Clinical Route
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={order.route}
                                            onChange={(e) => setOrder({...order, route: e.target.value})}
                                            className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-5 text-xs font-black text-zinc-900 uppercase appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            {routes.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                         Protocol Frequency
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={order.frequency}
                                            onChange={(e) => setOrder({...order, frequency: e.target.value})}
                                            className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-5 text-xs font-black text-zinc-900 uppercase appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        >
                                            {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Clinical Notes */}
                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                     Specific Directives
                                </label>
                                <textarea 
                                    rows={3}
                                    placeholder="Clinical reasoning or administration notes..."
                                    value={order.notes}
                                    onChange={(e) => setOrder({...order, notes: e.target.value})}
                                    className="w-full bg-zinc-50 border-none rounded-[2rem] px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                                />
                            </div>

                            {/* 🏥 PRIVACY & SAFETY DISCLAIMER */}
                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-5">
                                <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0 animate-pulse" />
                                <div className="space-y-1 text-left">
                                    <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Clinical Protocol Warning</h4>
                                    <p className="text-[10px] text-rose-500 font-bold leading-relaxed uppercase opacity-70">
                                        By committing this directive, you authorize pharmacological administration for {patientName}. This action is permanently logged in the physician audit trail.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 🚀 ACTION BAR */}
                        <div className="p-8 pt-0 flex gap-4">
                            <button 
                                onClick={onClose}
                                className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
                            >
                                Discard
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting || !order.medication_name || !order.dosage}
                                className="flex-1 h-14 bg-indigo-600 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                {submitting ? "AUTHORIZING..." : "Authorize Pharmacological Order"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
