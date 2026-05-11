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
import { Home, Loader2 } from "lucide-react";

interface Ward {
  id: number;
  name: string;
}

interface Room {
  id: number;
  ward: number;
  room_number: string;
  room_type: string;
  capacity: number;
  is_active: boolean;
}

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSuccess: () => void;
}

export default function RoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: RoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [formData, setFormData] = useState({
    ward: "",
    room_number: "",
    room_type: "SHARED",
    capacity: 2,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchWards();
      if (room) {
        setFormData({
          ward: room.ward.toString(),
          room_number: room.room_number,
          room_type: room.room_type,
          capacity: room.capacity,
          is_active: room.is_active,
        });
      } else {
        setFormData({
          ward: "",
          room_number: "",
          room_type: "SHARED",
          capacity: 2,
          is_active: true,
        });
      }
    }
  }, [open, room]);

  const fetchWards = async () => {
    try {
      const response = await api.get("wards/admin/wards/");
      if (response.data.success) {
        // Handle both paginated and legacy formats
        setWards(response.data.results || response.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load wards for selection");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        ward: parseInt(formData.ward),
        capacity: parseInt(formData.capacity.toString()),
      };

      if (room) {
        await api.put(`rooms/admin/rooms/${room.id}/`, payload);
        toast.success("Room updated successfully");
      } else {
        await api.post("rooms/admin/rooms/", payload);
        toast.success("Room created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save room";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-indigo-50/50 border-b border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Home className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {room ? "Edit Room" : "Add New Room"}
              </DialogTitle>
              <p className="text-[#5C61F2] text-[11px] font-black uppercase tracking-widest mt-0.5">
                Room Details & Ward Assignment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                Select Ward
              </Label>
              <Select
                value={formData.ward}
                onValueChange={(val) => setFormData({ ...formData, ward: val })}
                required
              >
                <SelectTrigger className="bg-zinc-50 border-none focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold text-zinc-900 px-6 transition-all">
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                  {(wards || []).map((ward) => (
                    <SelectItem key={`ward-opt-${ward.id}`} value={ward.id.toString()} className="rounded-xl font-bold text-zinc-900">
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Room Number
                </Label>
                <Input
                  placeholder="e.g. R-101"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 h-14 rounded-2xl font-black text-zinc-900 placeholder:text-zinc-300 transition-all uppercase tracking-wider"
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Bed Capacity
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-[#5C61F2]/10 h-14 rounded-2xl font-black text-zinc-900 text-lg transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                Room Type
              </Label>
              <Select
                value={formData.room_type}
                onValueChange={(val) => setFormData({ ...formData, room_type: val })}
              >
                <SelectTrigger className="bg-zinc-50 border-none focus:ring-2 focus:ring-[#5C61F2]/10 h-14 rounded-2xl font-bold text-zinc-900 px-6 transition-all">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                  <SelectItem value="PRIVATE" className="rounded-xl font-bold text-[#5C61F2]">Private Room</SelectItem>
                  <SelectItem value="SHARED" className="rounded-xl font-bold text-zinc-900">Shared Room</SelectItem>
                  <SelectItem value="ISOLATION" className="rounded-xl font-bold text-rose-600">Isolation Room</SelectItem>
                  <SelectItem value="OBSERVATION" className="rounded-xl font-bold text-zinc-900">Observation Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-[2.5rem] border border-dashed border-zinc-200">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Active Status</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">Allow bed assignments in this room.</p>
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
              ) : room ? (
                "Save Changes"
              ) : (
                "Create Room"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
