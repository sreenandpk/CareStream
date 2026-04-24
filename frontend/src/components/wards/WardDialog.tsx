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
import { toast } from "sonner";
import api from "@/lib/axios";

interface Ward {
  id?: number;
  name: string;
  floor: number;
  description: string | null;
  is_active: boolean;
}

interface WardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward?: Ward | null;
  onSuccess: () => void;
}

export default function WardDialog({
  open,
  onOpenChange,
  ward,
  onSuccess,
}: WardDialogProps) {
  const [formData, setFormData] = useState<Ward>({
    name: "",
    floor: 0,
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ward) {
      setFormData({
        name: ward.name,
        floor: ward.floor,
        description: ward.description || "",
        is_active: ward.is_active,
      });
    } else {
      setFormData({
        name: "",
        floor: 0,
        description: "",
        is_active: true,
      });
    }
  }, [ward, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (ward?.id) {
        await api.put(`wards/admin/wards/${ward.id}/`, formData);
        toast.success("Ward updated successfully");
      } else {
        await api.post("wards/admin/wards/", formData);
        toast.success("Ward created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to save ward";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {ward ? "Edit Ward" : "Create New Ward"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-400">
              Ward Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. ICU, General Ward A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-black/40 border-zinc-800 focus:border-blue-500/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor" className="text-sm font-medium text-zinc-400">
              Floor Number
            </Label>
            <Input
              id="floor"
              type="number"
              min="0"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              className="bg-black/40 border-zinc-800 focus:border-blue-500/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-zinc-400">
              Description (Optional)
            </Label>
            <textarea
              id="description"
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md bg-black/40 border border-zinc-800 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
              placeholder="Add details about the ward..."
            />
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-800 bg-black/40 text-blue-500 focus:ring-blue-500/20"
            />
            <Label htmlFor="is_active" className="text-sm font-medium text-zinc-300">
              Ward is active and available for patients
            </Label>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {loading ? "Saving..." : ward ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
