"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
    X, 
    FileText, 
    Pill, 
    History, 
    Send,
    Loader2,
    ClipboardCheck,
    Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { format } from "date-fns";

interface NurseActionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number | null;
  patientName: string | null;
  bedId: number | null;
}

export default function NurseActionsDrawer({ 
    isOpen, 
    onClose, 
    patientId, 
    patientName,
    bedId
}: NurseActionsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "meds" | "history">("notes");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [meds, setMeds] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const { user } = useAuthStore();
  const rolePath = user?.role?.toLowerCase() || "nurse";

  // 🔥 FETCH CLINICAL DATA
  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory();
      fetchMeds();
    }
  }, [isOpen, patientId]);

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.get(`patients/${rolePath}/patients/${patientId}/`);
      if (res.data?.success) {
        setHistory(res.data.data.clinical_notes || []);
      }
    } catch (e) {
      console.error("Clinical Nexus: History fetch failed", e);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function fetchMeds() {
    setLoadingMeds(true);
    try {
      const res = await api.get(`patients/${rolePath}/patients/${patientId}/meds/`);
      if (res.data?.success) {
        setMeds(res.data.data || []);
      }
    } catch (e) {
      console.error("Clinical Nexus: Meds fetch failed", e);
    } finally {
      setLoadingMeds(false);
    }
  }

  async function handleAdministerMed(orderId: number) {
    if (user?.role === "DOCTOR") return; // Doctors don't administer bedside
    try {
      const res = await api.post(`patients/nurse/meds/${orderId}/administer/`, {
        status: "COMPLETED",
        notes: "Administered at bedside via Monitor Interface"
      });
      if (res.data?.success) {
        fetchMeds();
        fetchHistory();
        setActiveTab("history");
      }
    } catch (e) {
      console.error("Clinical Nexus: Administration failed", e);
    }
  }

  async function handleSubmitNote() {
    if (!note.trim() || !patientId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`patients/${rolePath}/patients/${patientId}/notes/`, {
        content: note
      });
      if (res.data?.success) {
        setNote("");
        fetchHistory();
        setActiveTab("history");
      }
    } catch (e) {
      console.error("Clinical Nexus: Note submission failed", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-[201] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-zinc-900/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-1 block">
                    Clinical Intervention
                  </span>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {patientName || "Anonymous Patient"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                       Bed R{bedId} • Active Monitoring
                    </span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
                {[
                  { id: "notes", icon: FileText, label: "Observe" },
                  { id: "meds", icon: Pill, label: "Treat" },
                  { id: "history", icon: History, label: "Log" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id 
                        ? "bg-zinc-800 text-white shadow-lg" 
                        : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-emerald-500" : "text-zinc-600")} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 📝 TAB: NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-3">
                       Shift Observation Note
                    </span>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Enter clinical findings, patient response, or physical status changes..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-300 text-sm focus:outline-none focus:border-emerald-500/50 min-h-[200px] resize-none transition-all placeholder:text-zinc-700 font-medium"
                    />
                    <div className="flex items-center gap-3 mt-4">
                        <button 
                            disabled={submitting || !note.trim()}
                            onClick={handleSubmitNote}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Commit to Chart
                        </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-900/20 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                     <Stethoscope className="w-5 h-5 text-emerald-500/50 shrink-0 mt-1" />
                     <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                        Notes committed here are immediately visible to the attending physician and synced across the clinical command bridge.
                     </p>
                  </div>
                </div>
              )}

              {/* 💊 TAB: MEDS */}
              {activeTab === "meds" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-4">
                     Active Prescriptions
                  </span>
                  
                  {loadingMeds ? (
                      <div className="flex justify-center py-10">
                          <Loader2 className="w-6 h-6 text-zinc-800 animate-spin" />
                      </div>
                  ) : meds.length === 0 ? (
                      <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No active orders</p>
                      </div>
                  ) : (
                      meds.map((med, idx) => (
                        <div key={idx} className="bg-zinc-900/40 border border-white/10 p-5 rounded-2xl group hover:border-emerald-500/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-white font-black uppercase text-sm tracking-tight">{med.medication_name}</h4>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{med.dosage} • {med.route}</span>
                                </div>
                                <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[7px] font-black text-zinc-400 uppercase">
                                    {med.frequency}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-6">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Ordered By</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Dr. {med.prescribed_by_name}</span>
                                </div>
                                <button 
                                    onClick={() => handleAdministerMed(med.id)}
                                    className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                    Administer
                                </button>
                            </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* 📜 TAB: HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  {loadingHistory ? (
                      <div className="flex flex-col items-center py-20">
                         <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                      </div>
                  ) : history.length === 0 ? (
                      <div className="text-center py-20">
                          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No existing logs</span>
                      </div>
                  ) : (
                    history.map((item, idx) => (
                        <div key={idx} className="relative pl-6 border-l border-zinc-800 pb-8 last:pb-0">
                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                                        {format(new Date(item.created_at), "hh:mm a")}
                                    </span>
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                        Nurse {item.nurse?.username || "SYSTEM"}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">
                        Verified Audit Log Active
                    </span>
                </div>
                <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-tighter">
                    CareStream Clinical v4.2
                </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
