"use client";

import { useState } from "react";
import { 
    AlertTriangle, 
    X, 
    User,
    Clipboard,
    ChevronRight,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ConditionUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (condition: string, reason: string) => void;
    currentCondition: string;
    newCondition: string;
    patientName: string;
}

export default function ConditionUpdateModal({
    isOpen,
    onClose,
    onConfirm,
    currentCondition,
    newCondition,
    patientName
}: ConditionUpdateModalProps) {
    const [reason, setReason] = useState("");
    const isCritical = newCondition === "CRITICAL";

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn(
                        "relative w-full max-w-lg bg-[#0a0a0a] border overflow-hidden rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                        isCritical ? "border-rose-500/30 shadow-[0_0_80px_rgba(225,29,72,0.1)]" : "border-white/10"
                    )}
                >
                    {/* Header Banner */}
                    <div className={cn(
                        "px-8 py-6 border-b flex items-center justify-between",
                        isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-zinc-900/40 border-white/5"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                isCritical ? "bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]" : "bg-indigo-500"
                            )}>
                                {isCritical ? <AlertTriangle className="w-5 h-5 text-white" /> : <Clipboard className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-white">
                                    Clinical State Change
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Medical Authority Confirmation Required
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all text-zinc-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-8">
                        {/* Summary */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Patient</span>
                                <span className="text-xs font-bold text-white uppercase tracking-widest">{patientName}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Previous Status</p>
                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">{currentCondition}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex-1 p-4 rounded-2xl border text-center shadow-2xl",
                                    newCondition === "STABLE" ? "bg-emerald-500/10 border-emerald-500/30" :
                                    newCondition === "GUARDED" ? "bg-amber-500/10 border-amber-500/30" :
                                    newCondition === "CRITICAL" ? "bg-rose-500/10 border-rose-500/30" :
                                    "bg-zinc-900 border-white/10"
                                )}>
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 text-inherit opacity-70">New Condition</p>
                                    <p className={cn(
                                        "text-[11px] font-black uppercase tracking-tighter",
                                        newCondition === "STABLE" ? "text-emerald-500" :
                                        newCondition === "GUARDED" ? "text-amber-500" :
                                        newCondition === "CRITICAL" ? "text-rose-500" : "text-white"
                                    )}>
                                        {newCondition}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reason Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                Clinical Justification (Required)
                            </label>
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe the clinical rationale for this status change..."
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-medium text-zinc-300 min-h-[120px] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                            />
                            {isCritical && (
                                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex gap-4 items-start">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-rose-400/80 leading-relaxed font-bold italic">
                                        CRITICAL status requires immediate bedside assessment and potential trauma protocol initiation.
                                    </p>
                                </div>
                            )}
                        </div>

                         {/* Authorization Disclaimer */}
                         <div className="flex items-center gap-3 p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                             <User className="w-4 h-4 text-zinc-600" />
                             <p className="text-[9px] text-zinc-500 font-bold leading-none">
                                This action will be logged in the clinical audit trail under your medical credentials.
                             </p>
                         </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-zinc-900/20 border-t border-white/5 flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-[1.25rem] bg-zinc-900 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onConfirm(newCondition, reason)}
                            disabled={!reason.trim()}
                            className={cn(
                                "flex-1 h-14 rounded-[1.25rem] text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                                isCritical ? "bg-rose-600 hover:bg-rose-500 shadow-2xl shadow-rose-500/20" : "bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20"
                            )}
                        >
                            Confirm Change
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
