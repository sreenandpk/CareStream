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
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Home className="w-5 h-5 text-blue-500" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {room ? "Edit Room" : "Add New Room"}
            </DialogTitle>
          </div>
          <p className="text-zinc-500 text-xs font-medium italic">
            {room ? "Modify room details and capacity." : "Configure a new room for a specific ward."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Assigned Ward
              </Label>
              <Select
                value={formData.ward}
                onValueChange={(val) => setFormData({ ...formData, ward: val })}
                required
              >
                <SelectTrigger className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11">
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {(wards || []).map((ward) => (
                    <SelectItem key={`ward-opt-${ward.id}`} value={ward.id.toString()}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Room Number
                </Label>
                <Input
                  placeholder="e.g. R-101"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Capacity (Beds)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Room Type
              </Label>
              <Select
                value={formData.room_type}
                onValueChange={(val) => setFormData({ ...formData, room_type: val })}
              >
                <SelectTrigger className="bg-black/40 border-zinc-800 focus:ring-blue-500/20 text-zinc-200 h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 font-bold">
                  <SelectItem value="PRIVATE">Private Room</SelectItem>
                  <SelectItem value="SHARED">Shared Room</SelectItem>
                  <SelectItem value="ISOLATION">Isolation Room</SelectItem>
                  <SelectItem value="OBSERVATION">Observation Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 backdrop-blur-md">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-zinc-200">Room Active</Label>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Availability for bed assignment</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {room ? "Update Room" : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
