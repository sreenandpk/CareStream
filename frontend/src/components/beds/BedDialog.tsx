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
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Hotel className="w-5 h-5 text-emerald-500" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {bed ? "Configure Bed" : "Install New Bed"}
            </DialogTitle>
          </div>
          <p className="text-zinc-500 text-xs font-medium italic">
            Assign beds to specific clinical rooms and manage their maintenance status.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Parent Room
              </Label>
              <Select
                value={formData.room}
                onValueChange={(val) => setFormData({ ...formData, room: val })}
                required
              >
                <SelectTrigger className="bg-black/40 border-zinc-800 focus:ring-emerald-500/20 text-zinc-200 h-11">
                  <SelectValue placeholder="Select a clinical room" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {rooms?.map((room) => (
                    <SelectItem key={`room-opt-${room.id}`} value={room.id.toString()}>
                      Room {room.room_number} {room.ward_name ? `(${room.ward_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Bed Identification Number
              </Label>
              <Input
                placeholder="e.g. B-01"
                value={formData.bed_number}
                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                className="bg-black/40 border-zinc-800 focus:ring-emerald-500/20 text-zinc-200 h-11 font-mono uppercase tracking-widest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                Initial Operational Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="bg-black/40 border-zinc-800 focus:ring-emerald-500/20 text-zinc-200 h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 font-bold">
                  <SelectItem value="AVAILABLE" className="text-emerald-400">Available For Admission</SelectItem>
                  <SelectItem value="OCCUPIED" disabled>Occupied (Managed by Patients)</SelectItem>
                  <SelectItem value="MAINTENANCE" className="text-amber-400">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-2 px-1">
                <Info className="w-3 h-3 text-zinc-600" />
                <p className="text-[9px] text-zinc-600 italic">Occupied status is managed automatically by patient assignments.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 backdrop-blur-md">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-zinc-200">System Visibility</Label>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Active beds are visible to clinical staff</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-emerald-500"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {bed ? "Save Changes" : "Deploy Bed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
