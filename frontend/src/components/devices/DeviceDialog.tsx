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
      toast.error("Failed to load beds");
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
        toast.success("Device updated successfully.");
        onSuccess();
        onOpenChange(false);
      } else {
        const res = await api.post("devices/admin/devices/", payload);
        if (res.data.success) {
          setNewlyCreatedKey(res.data.data.api_key);
          toast.success("New device added.");
          onSuccess();
          // Don't close immediately if we have a new key to show
        }
      }
      setShowSafetyConfirm(false); // 🏥 Close Safety Dialog
    } catch (error: any) {
      const rawError = error.response?.data?.message || error.response?.data?.error;
      let message = "Failed to save device.";

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
      <DialogContent className="sm:max-w-[500px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-indigo-50/50 border-b border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/10 flex items-center justify-center border border-[#5C61F2]/20">
              <Cpu className="w-6 h-6 text-[#5C61F2]" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">
                {device ? "Edit Device" : "Add New Device"}
              </DialogTitle>
              <p className="text-[#5C61F2] text-[11px] font-black uppercase tracking-widest mt-0.5">
                Device Details & Deployment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Display Name
                </Label>
                <Input
                  placeholder="e.g. ICU-NORTH-01"
                  value={formData.monitor_label}
                  onChange={(e) => setFormData({ ...formData, monitor_label: e.target.value })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 h-14 rounded-2xl font-black text-zinc-900 placeholder:text-zinc-300 transition-all uppercase tracking-wider"
                />
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Serial Number
                </Label>
                <Input
                  placeholder="e.g. SN-9920-X"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 h-14 rounded-2xl font-black text-zinc-900 uppercase tracking-[0.2em] text-xs transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Assigned Bed
                </Label>
                <Select
                  value={formData.bed || "none"}
                  onValueChange={(val) => setFormData({ ...formData, bed: val })}
                >
                  <SelectTrigger className="bg-zinc-50 border-none focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold text-zinc-900 px-6 transition-all">
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    <SelectItem value="none" className="rounded-xl font-bold text-zinc-500">Inventory / Storage</SelectItem>
                    {(beds || []).map((bed) => (
                      <SelectItem key={bed.id} value={bed.id.toString()} className="rounded-xl font-bold text-zinc-900">
                        Bed {bed.bed_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Device Type
                </Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(val) => setFormData({ ...formData, device_type: val })}
                >
                  <SelectTrigger className="bg-zinc-50 border-none focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold text-zinc-900 px-6 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    <SelectItem value="ICU_MONITOR" className="rounded-xl font-bold text-zinc-900">Advanced (ICU)</SelectItem>
                    <SelectItem value="PATIENT_MONITOR" className="rounded-xl font-bold text-zinc-900">Standard Monitor</SelectItem>
                    <SelectItem value="WEARABLE_SENSOR" className="rounded-xl font-bold text-zinc-900">Mobile Sensor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#5C61F2]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Mode & Data Source</span>
              </div>

              <div className="space-y-3">
                <Select
                  value={formData.mode}
                  onValueChange={(val) => setFormData({ ...formData, mode: val })}
                >
                  <SelectTrigger className="bg-white border-zinc-200 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                    <SelectItem value="REAL" className="rounded-xl font-black text-rose-600">Live Hardware</SelectItem>
                    <SelectItem value="SIMULATION" className="rounded-xl font-black text-[#5C61F2]">Simulated Data</SelectItem>
                  </SelectContent>
                </Select>

                <AnimatePresence>
                  {formData.mode === "SIMULATION" && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                      <Select
                        value={formData.simulation_mode}
                        onValueChange={(val) => setFormData({ ...formData, simulation_mode: val })}
                      >
                        <SelectTrigger className="bg-white border-zinc-200 h-12 rounded-xl font-black text-[10px] uppercase tracking-tight mt-2 border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                          <SelectItem value="GLOBAL" className="rounded-xl font-bold">Normal</SelectItem>
                          <SelectItem value="NORMAL" className="rounded-xl text-emerald-600 font-bold">Healthy</SelectItem>
                          <SelectItem value="CRITICAL" className="rounded-xl text-rose-600 font-black italic tracking-tight">Emergency</SelectItem>
                          <SelectItem value="RECOVERY" className="rounded-xl text-[#5C61F2] font-bold">Recovery</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {newlyCreatedKey && (
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Device Key</span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-100 transition-all"
                    onClick={() => {
                        navigator.clipboard.writeText(newlyCreatedKey);
                        toast.success("Key copied.");
                    }}
                  >
                    Copy Key
                  </Button>
                </div>
                <div className="bg-white border border-emerald-100 p-4 rounded-xl font-mono text-[11px] text-emerald-900 break-all select-all shadow-sm">
                  {newlyCreatedKey}
                </div>
                <p className="text-[9px] text-emerald-600/60 font-black uppercase tracking-widest leading-tight">
                  ⚠ Safeguard this token. It will be permanently masked after initialization.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-[2.5rem] border border-dashed border-zinc-200">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Active Status</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">Allow device to send data.</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-[#5C61F2] scale-110"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-zinc-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : device ? (
                "Save Changes"
              ) : (
                "Create Device"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showSafetyConfirm} onOpenChange={setShowSafetyConfirm}>
      <AlertDialogContent className="bg-white border-none rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-w-[500px]">
        <AlertDialogHeader>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 border border-amber-100">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">
            Switch to <br/>Simulation?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-500 font-bold text-sm leading-relaxed pt-2">
            Warning: Switching from <span className="text-rose-500 underline decoration-2 underline-offset-4">Live Hardware</span> to <span className="text-[#5C61F2] underline decoration-2 underline-offset-4">Simulation</span> will stop real patient data.
            <br/><br/>
            This action is for testing or training only.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 mt-8 pt-6 border-t border-zinc-100">
          <AlertDialogCancel className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 border-none bg-transparent hover:bg-zinc-50 hover:text-zinc-900 transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setShowSafetyConfirm(false);
              setTimeout(() => { handleSubmit(); }, 0);
            }}
            className="h-14 px-10 bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
          >
            Switch Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
