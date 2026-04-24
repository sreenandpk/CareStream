"use client";

import { useAlertStore } from "@/store/alertStore";
import { AlertCircle, X, BellRing, User, Cpu, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalAlertOverlay() {
  const { activeAlerts, removeAlert } = useAlertStore();

  // Show only the 3 most recent alerts
  const notifications = activeAlerts.slice(0, 3);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 w-[400px]">
      <AnimatePresence mode="popLayout text-xs">
        {notifications.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 50, transition: { duration: 0.2 } }}
            layout
            className={cn(
              "group relative overflow-hidden rounded-[2.5rem] border p-6 backdrop-blur-2xl shadow-2xl transition-all duration-500",
              alert.severity === "CRITICAL" 
                ? "bg-rose-600/90 border-rose-400 shadow-rose-500/20" 
                : "bg-zinc-900/95 border-zinc-800 shadow-black/50"
            )}
          >
            {/* Header / Meta */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  alert.severity === "CRITICAL" ? "bg-white/20 text-white" : "bg-rose-500/10 text-rose-500"
                )}>
                  <ShieldAlert className={cn("w-5 h-5", alert.severity === "CRITICAL" && "animate-pulse")} />
                </div>
                <div>
                   <span className={cn(
                     "text-[10px] font-black uppercase tracking-[0.2em] block leading-none",
                     alert.severity === "CRITICAL" ? "text-white/60" : "text-zinc-500"
                   )}>
                     System Alert
                   </span>
                   <h4 className={cn(
                     "font-black text-xs uppercase tracking-tight mt-1 leading-none",
                     alert.severity === "CRITICAL" ? "text-white" : "text-zinc-200"
                   )}>
                     {alert.type.replace(/_/g, " ")}
                   </h4>
                </div>
              </div>

              <button 
                onClick={() => removeAlert(alert.id)}
                className={cn(
                    "p-1 rounded-lg transition-colors",
                    alert.severity === "CRITICAL" ? "text-white/30 hover:text-white" : "text-zinc-700 hover:text-zinc-400"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message */}
            <p className={cn(
                 "text-xs font-bold leading-relaxed mb-4",
                 alert.severity === "CRITICAL" ? "text-white" : "text-zinc-400"
            )}>
              {alert.message} for <span className={cn(
                  "underline underline-offset-4 decoration-2",
                  alert.severity === "CRITICAL" ? "decoration-white/30" : "decoration-zinc-800"
              )}>{alert.patient}</span>
            </p>
            
            {/* Context Footer */}
            <div className="flex items-center justify-between mt-auto">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Cpu className={cn("w-3 h-3 italic", alert.severity === "CRITICAL" ? "text-white/40" : "text-zinc-700")} />
                    <span className={cn("text-[9px] font-black uppercase italic", alert.severity === "CRITICAL" ? "text-white/40" : "text-zinc-600")}>
                        Node: {alert.monitor_label || alert.device_serial}
                    </span>
                  </div>
               </div>
               
               <Link href="/dashboard/admin/alerts">
                  <Button 
                    className={cn(
                        "h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95",
                        alert.severity === "CRITICAL" 
                            ? "bg-white text-rose-600 hover:bg-zinc-100 shadow-lg shadow-black/20" 
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    )}
                  >
                    View Alert
                  </Button>
               </Link>
            </div>
            
            {/* Critical Pulse */}
            {alert.severity === "CRITICAL" && (
                <div className="absolute top-0 right-0 w-full h-1 bg-white/20 overflow-hidden">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-1/2 h-full bg-white opacity-50"
                    />
                </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
