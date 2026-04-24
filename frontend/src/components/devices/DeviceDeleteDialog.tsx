"use client";

import { useState } from "react";
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
import { Loader2, AlertCircle, WifiOff } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Device {
  id: number;
  serial_number: string;
}

interface DeviceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSuccess: () => void;
}

export default function DeviceDeleteDialog({
  open,
  onOpenChange,
  device,
  onSuccess,
}: DeviceDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!device) return;
    setLoading(true);

    try {
      await api.delete(`devices/admin/devices/${device.id}/`);
      toast.success("Hardware decommissioned and disconnected");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Fleet integration fault");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <WifiOff className="w-5 h-5 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">
              Decommission Hardware
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 font-medium italic">
            Are you sure you want to decommission device <span className="text-zinc-100 font-bold font-mono px-1.5 py-0.5 bg-zinc-900 rounded">{device?.serial_number}</span>? 
            This action will permanently disconnect the hardware from the vital monitoring stream and release the associated bed bridge.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 border-t border-zinc-800/50">
          <AlertDialogCancel className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 shadow-lg shadow-rose-600/20"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Decommission
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
