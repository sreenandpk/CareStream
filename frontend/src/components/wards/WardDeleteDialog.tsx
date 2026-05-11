"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Ward {
  id: number;
  name: string;
}

interface WardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward: Ward | null;
  onSuccess: () => void;
}

export default function WardDeleteDialog({
  open,
  onOpenChange,
  ward,
  onSuccess,
}: WardDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!ward) return;
    setLoading(true);

    try {
      await api.delete(`wards/admin/wards/${ward.id}/`);
      toast.success(`Ward "${ward.name}" deleted successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to delete ward. It might have active rooms or beds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden text-zinc-900">
        <DialogHeader className="p-8 pb-4 bg-rose-50/50 border-b border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-black tracking-tight text-left">
                Decommission Unit
              </DialogTitle>
              <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest mt-0.5 text-left">
                Clinical Facility Update
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
            <p className="text-sm font-bold text-zinc-600 leading-relaxed text-left">
              Are you sure you want to terminate the <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black tracking-tight">{ward?.name}</span> clinical unit?
            </p>
            <p className="text-[11px] font-medium text-zinc-400 leading-relaxed uppercase tracking-wide text-left">
              This action will archive the ward profile. Note that active rooms or beds must be reassigned before terminal decommissioning can proceed.
            </p>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:bg-zinc-50 border border-zinc-100 transition-all active:scale-95 m-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 rounded-2xl transition-all active:scale-95 m-0 border-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Removal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
