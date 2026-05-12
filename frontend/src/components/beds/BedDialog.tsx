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
import { Hotel, Loader2, Info } from "lucide-react";

interface Room {
  id: number;
  room_number: string;
  ward_name?: string;
}

interface Bed {
  id: number;
  room: number;
  bed_number: string;
  status: string;
  is_active: boolean;
}

interface BedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: Bed | null;
  onSuccess: () => void;
}

export default function BedDialog({
  open,
  onOpenChange,
  bed,
  onSuccess,
}: BedDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    room: "",
    bed_number: "",
    status: "AVAILABLE",
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchRooms();
      if (bed) {
        setFormData({
          room: bed.room.toString(),
          bed_number: bed.bed_number,
          status: bed.status,
          is_active: bed.is_active,
        });
      } else {
        setFormData({
          room: "",
          bed_number: "",
          status: "AVAILABLE",
          is_active: true,
        });
      }
    }
  }, [open, bed]);

  const fetchRooms = async () => {
    try {
      const response = await api.get("rooms/admin/rooms/");
      if (response.data.success) {
        // Handle both paginated and non-paginated formats
        setRooms(response.data.results || response.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load clinical rooms");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        room: parseInt(formData.room),
      };

      if (bed) {
        await api.put(`beds/admin/beds/${bed.id}/`, payload);
        toast.success("Bed configuration updated");
      } else {
        await api.post("beds/admin/beds/", payload);
        toast.success("New bed added to inventory");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Internal infrastructure error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] !bg-white border-none !text-zinc-800 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-[#5C61F2]/5 border-b border-[#5C61F2]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/10 flex items-center justify-center border border-[#5C61F2]/20">
              <Hotel className="w-6 h-6 text-[#5C61F2]" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                {bed ? "Edit Bed Details" : "Add New Bed"}
              </DialogTitle>
              <p className="text-[#5C61F2] text-[11px] font-black uppercase tracking-widest mt-0.5">
                Bed Information & Room Assignment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">
                Select Room
              </Label>
              <Select
                value={formData.room}
                onValueChange={(val) => setFormData({ ...formData, room: val })}
                required
              >
                <SelectTrigger className="!bg-white border border-zinc-100 focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-6 transition-all">
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                  {rooms?.map((room) => (
                    <SelectItem key={`room-opt-${room.id}`} value={room.id.toString()} className="rounded-xl font-bold text-zinc-800 focus:bg-[#5C61F2]/10 focus:text-[#5C61F2]">
                      Room {room.room_number} {room.ward_name ? `(${room.ward_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">
                Bed Number
              </Label>
              <Input
                placeholder="e.g. B-102"
                value={formData.bed_number}
                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                className="!bg-white border border-zinc-100 focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 h-14 rounded-2xl font-black !text-zinc-800 uppercase tracking-widest transition-all"
                required
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">
                Bed Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="!bg-white border border-zinc-100 focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold !text-zinc-800 [&>span]:!text-zinc-800 px-6 transition-all">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2">
                  <SelectItem value="AVAILABLE" className="rounded-xl font-black text-emerald-600 focus:bg-emerald-50">Available</SelectItem>
                  <SelectItem value="OCCUPIED" disabled className="rounded-xl font-black text-zinc-300">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE" className="rounded-xl font-black text-amber-500 focus:bg-amber-50">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#F8F9FB] rounded-[2.5rem] border border-zinc-100">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black !text-zinc-800 uppercase tracking-widest">Enable Bed</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Display this bed in the monitoring dashboard.</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-[#5C61F2] data-[state=unchecked]:bg-zinc-200 scale-110 [&>span]:!bg-white dark:[&>span]:!bg-white border-none shadow-inner"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-10 bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : bed ? (
                "Save Changes"
              ) : (
                "Add Bed"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
