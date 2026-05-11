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
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Bed {
  id: number;
  bed_number: string;
}

interface BedDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: Bed | null;
  onSuccess: () => void;
}

export default function BedDeleteDialog({
  open,
  onOpenChange,
  bed,
  onSuccess,
}: BedDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bed) return;
    setLoading(true);

    try {
      await api.delete(`beds/admin/beds/${bed.id}/`);
      toast.success("Bed removed from clinical inventory");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Critical infrastructure fault");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden text-zinc-900">
        <AlertDialogHeader className="p-8 pb-4 bg-rose-50/50 border-b border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <AlertDialogTitle className="text-2xl font-black tracking-tight">
                Decommission Asset
              </AlertDialogTitle>
              <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest mt-0.5">
                Critical Infrastructure Update
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="p-8 space-y-6">
          <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
            <p className="text-sm font-bold text-zinc-600 leading-relaxed">
              Are you sure you want to decommission bed <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black tracking-tight">{bed?.bed_number}</span>?
            </p>
            <p className="text-[11px] font-medium text-zinc-400 leading-relaxed uppercase tracking-wide">
              This action will disconnect associated monitoring equipment and remove the asset from clinical rotation.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="p-8 pt-0 flex gap-4">
          <AlertDialogCancel className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:bg-zinc-50 border border-zinc-100 transition-all active:scale-95 m-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 rounded-2xl transition-all active:scale-95 m-0 border-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Removal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
