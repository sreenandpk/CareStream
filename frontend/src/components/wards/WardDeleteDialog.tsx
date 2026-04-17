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
import { AlertCircle } from "lucide-react";
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
      <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
            <AlertCircle className="h-6 w-6 text-rose-500" />
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            Delete Ward?
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Are you sure you want to delete <span className="text-zinc-100 font-semibold">"{ward?.name}"</span>? 
            This action will soft-delete the ward and it will no longer be visible to staff.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 hover:bg-zinc-900 border border-zinc-800"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
