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
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">
              Decommission Bed
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 font-medium italic">
            Are you sure you want to decommission bed <span className="text-zinc-100 font-bold font-mono px-1.5 py-0.5 bg-zinc-900 rounded">{bed?.bed_number}</span>? 
            This action will disconnect any associated monitoring equipment and remove the bed from active clinical rotation.
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
            Confirm Decommissioning
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
