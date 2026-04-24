"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Cpu, Loader2, Zap, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Bed {
  id: number;
  bed_number: string;
}

interface Device {
  id: number;
  serial_number: string;
  bed: number;
  device_type: string;
  status: string;
  mode: string;
  simulation_mode: string;
  is_active: boolean;
  api_key?: string;
}

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSuccess: () => void;
}

export default function DeviceDialog({
  open,
  onOpenChange,
  device,
  onSuccess,
}: DeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [formData, setFormData] = useState({
    serial_number: "",
    bed: "",
    device_type: "PATIENT_MONITOR",
    mode: "REAL",
    simulation_mode: "GLOBAL",
    status: "ACTIVE",
    is_active: true,
  });
  const [showSafetyConfirm, setShowSafetyConfirm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchBeds();
      if (device) {
        setFormData({
          serial_number: device.serial_number,
          monitor_label: device.monitor_label || "",
          bed: device.bed?.toString() || "",
          device_type: device.device_type,
          mode: device.mode,
          simulation_mode: device.simulation_mode || "GLOBAL",
          status: device.status,
          is_active: device.is_active,
        });
      } else {
        setFormData({
          serial_number: "",
          monitor_label: "",
          bed: "",
          device_type: "PATIENT_MONITOR",
          mode: "REAL",
          simulation_mode: "GLOBAL",
          status: "ACTIVE",
          is_active: true,
        });
      }
    }
  }, [open, device]);

  const fetchBeds = async () => {
    try {
      const response = await api.get("beds/admin/beds/");
      if (response.data.success) {
        setBeds(response.data.data || response.data.results || []);
      }
    } catch (error) {
      toast.error("Failed to load hospital beds");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 🛡️ CLINICAL SAFETY GUARD: Detect REAL -> SIMULATION switch
    if (device?.mode === "REAL" && formData.mode === "SIMULATION" && !showSafetyConfirm) {
      setShowSafetyConfirm(true);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        bed: formData.bed && formData.bed !== "none" ? parseInt(formData.bed) : null,
      };

      if (device) {
        await api.put(`devices/admin/devices/${device.id}/`, payload);
        toast.success("Device configuration updated successfully.");
        onSuccess();
        onOpenChange(false);
      } else {
        const res = await api.post("devices/admin/devices/", payload);
        if (res.data.success) {
          setNewlyCreatedKey(res.data.data.api_key);
          toast.success("New monitoring node deployed to fleet.");
          onSuccess();
          // Don't close immediately if we have a new key to show
        }
      }
      setShowSafetyConfirm(false); // 🏥 Close Safety Dialog
    } catch (error: any) {
      const rawError = error.response?.data?.message || error.response?.data?.error;
      let message = "Safety Check: Deployment failed.";

      if (typeof rawError === "string") {
        message = rawError;
      } else if (typeof rawError === "object" && rawError !== null) {
        const firstKey = Object.keys(rawError)[0];
        const firstError = rawError[firstKey];
        message = Array.isArray(firstError) ? firstError[0] : JSON.stringify(rawError);
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) setNewlyCreatedKey(null);
        onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[440px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <div className="p-8 pb-6 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
              {device ? "Update Node" : "Deploy Node"}
            </DialogTitle>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-2 italic">
              Hardware Layer Assignment
            </p>
          </DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
             <Cpu className="w-6 h-6 text-zinc-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
          <div className="space-y-5">
            {/* Dual Identity Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">
                  Clinician Identity (Label)
                </Label>
                <Input
                  placeholder="e.g. ICU-NORTH-01"
                  value={formData.monitor_label}
                  onChange={(e) => setFormData({ ...formData, monitor_label: e.target.value })}
                  className="bg-black/40 border-zinc-900 text-white h-12 rounded-xl text-sm font-bold placeholder:text-zinc-800 focus:border-rose-500/50 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">
                  System Serial (Immutable)
                </Label>
                <Input
                  placeholder="e.g. SN-9920-X"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="bg-black/40 border-zinc-900 text-zinc-500 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] placeholder:text-zinc-800 focus:border-rose-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">
                  Location / Bed
                </Label>
                <Select
                  value={formData.bed || "none"}
                  onValueChange={(val) => setFormData({ ...formData, bed: val })}
                >
                  <SelectTrigger className="bg-black/40 border-zinc-900 h-14 rounded-2xl font-black text-xs uppercase tracking-tight">
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-white font-black">
                    <SelectItem value="none">None (Storage)</SelectItem>
                    {(beds || []).map((bed) => (
                      <SelectItem key={bed.id} value={bed.id.toString()}>
                        Bed {bed.bed_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">
                  Monitor Type
                </Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(val) => setFormData({ ...formData, device_type: val })}
                >
                  <SelectTrigger className="bg-black/40 border-zinc-900 h-14 rounded-2xl font-black text-[10px] uppercase tracking-tighter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-white font-black">
                    <SelectItem value="ICU_MONITOR">Advanced (ICU)</SelectItem>
                    <SelectItem value="PATIENT_MONITOR">Standard View</SelectItem>
                    <SelectItem value="WEARABLE_SENSOR">Wearable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/20 rounded-[1.8rem] border border-zinc-900 space-y-4 shadow-inner">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Operational Logic</span>
            </div>

            <div className="space-y-3">
              <Select
                value={formData.mode}
                onValueChange={(val) => setFormData({ ...formData, mode: val })}
              >
                <SelectTrigger className="bg-black/60 border-zinc-900 h-12 rounded-xl font-bold text-xs uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                  <SelectItem value="REAL" className="font-black text-rose-500">Live Hardware Feed</SelectItem>
                  <SelectItem value="SIMULATION" className="font-black text-blue-500">Clinical Simulator</SelectItem>
                </SelectContent>
              </Select>

              {formData.mode === "SIMULATION" && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                >
                  <Select
                    value={formData.simulation_mode}
                    onValueChange={(val) => setFormData({ ...formData, simulation_mode: val })}
                  >
                    <SelectTrigger className="bg-black/60 border-zinc-900 h-12 rounded-xl font-black text-[10px] uppercase tracking-tight mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                      <SelectItem value="GLOBAL">Default State</SelectItem>
                      <SelectItem value="NORMAL" className="text-emerald-500 font-bold">Stable Rhythms</SelectItem>
                      <SelectItem value="CRITICAL" className="text-rose-500 font-black italic">Critical Crisis</SelectItem>
                      <SelectItem value="RECOVERY" className="text-blue-400 font-bold">Recovery Curve</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 shadow-inner">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 underline decoration-emerald-500/20 underline-offset-4">Enable Monitoring</span>
             </div>
             <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
          </div>

          <AnimatePresence>
            {newlyCreatedKey && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Hardware Access Token</span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="h-6 px-2 text-[8px] font-black uppercase text-emerald-500 hover:bg-emerald-500/10"
                    onClick={() => {
                        navigator.clipboard.writeText(newlyCreatedKey);
                        toast.success("Key copied to clipboard");
                    }}
                  >
                    Copy Key
                  </Button>
                </div>
                <div className="bg-black/60 p-3 rounded-xl font-mono text-[10px] text-zinc-300 break-all select-all">
                  {newlyCreatedKey}
                </div>
                <p className="text-[8px] text-emerald-500/60 font-medium italic">
                  ⚠ Save this key now. It will be masked in the dashboard for clinical security.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl h-14 border-zinc-900 text-zinc-600 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-2xl h-14 bg-white text-zinc-950 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {device ? "Save Changes" : "Deploy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showSafetyConfirm} onOpenChange={setShowSafetyConfirm}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-[2rem] p-8 shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
            Safety Confirmation Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 font-medium leading-relaxed pt-2">
            ⚠ This will replace <strong className="text-white">real patient data</strong> with simulated values. 
            This action is for testing/training purposes only and will sever the live hardware link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 mt-6">
          <AlertDialogCancel className="rounded-xl h-12 border-zinc-900 bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-white font-bold px-6 transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              // 🛡️ Set safety confirm to true so the guard in handleSubmit is bypassed
              setShowSafetyConfirm(true);
              // Trigger actual submission in next tick
              setTimeout(() => {
                handleSubmit();
              }, 0);
            }}
            className="rounded-xl h-12 bg-amber-500 text-black hover:bg-amber-600 font-black uppercase text-xs tracking-widest px-8 transition-all shadow-lg shadow-amber-500/10"
          >
            Confirm Switch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
