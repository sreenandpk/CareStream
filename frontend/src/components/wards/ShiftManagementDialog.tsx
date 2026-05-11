"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Loader2, 
  User as UserIcon,
  Activity,
  UserPlus,
  ArrowRight,
  Edit2,
  Check,
  X,
  Calendar as CalIcon
} from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface NurseDetails {
    id: number;
    username: string;
}

interface Shift {
  id: number;
  nurse: number;
  nurse_username: string;
  ward: number;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Ward {
  id: number;
  name: string;
}

interface ShiftManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward: Ward | null;
}

export default function ShiftManagementDialog({
  open,
  onOpenChange,
  ward,
}: ShiftManagementDialogProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignedNurses, setAssignedNurses] = useState<NurseDetails[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");

  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [shiftType, setShiftType] = useState<string>("DAY");
  
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState<string>(format(new Date(), "HH:mm"));
  
  const [newTime, setNewTime] = useState<string>(format(new Date(Date.now() + 8 * 60 * 60 * 1000), "HH:mm"));

  const handleShiftTypeChange = (type: string) => {
    setShiftType(type);
    if (type === "DAY") {
        setNewTime("20:00");
    } else {
        setNewTime("08:00");
    }
  };

  const handleTimeChange = (time: string) => {
    setNewTime(time);
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 8 && hour < 20) {
        setShiftType("DAY");
    } else {
        setShiftType("NIGHT");
    }
  };

  const fetchMatrix = useCallback(async () => {
    if (!ward) return;
    setFetching(true);
    try {
      const [shiftsRes, wardRes] = await Promise.all([
        api.get("wards/admin/shifts/", { params: { ward: ward.id } }),
        api.get(`wards/admin/wards/${ward.id}/`)
      ]);

      if (shiftsRes.data.success) setShifts(shiftsRes.data.results);
      if (wardRes.data.success) setAssignedNurses(wardRes.data.data?.nurse_details || wardRes.data.nurse_details || []);
    } catch (err) {
      toast.error("Failed to sync shift matrix");
    } finally {
      setFetching(false);
    }
  }, [ward]);

  useEffect(() => {
    if (open && ward) fetchMatrix();
  }, [open, ward, fetchMatrix]);

  const handleCreateShift = async (nurseId: number) => {
    if (!ward) return;
    setActingId(nurseId);
    try {
      const startDT = new Date(`${startDate}T${startTime}:00`);
      let endDT = new Date(`${startDate}T${newTime}:00`);
      
      if (endDT <= startDT) {
        endDT.setDate(endDT.getDate() + 1);
      }
      
      const response = await api.post("wards/admin/shifts/", {
        nurse: nurseId,
        ward: ward.id,
        shift_type: shiftType,
        start_time: startDT.toISOString(),
        end_time: endDT.toISOString(),
        is_active: true
      });

      if (response.data.success) {
        toast.success("Shift active");
        setSelectedNurseId(null);
        fetchMatrix();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Overlap detected");
    } finally {
      setActingId(null);
    }
  };

  const handleUpdateShiftTime = async (shiftId: number, nurseId: number) => {
    setActingId(nurseId);
    try {
      const dateTime = `${editDate}T${editTime}:00`;
      await api.patch(`wards/admin/shifts/${shiftId}/`, {
        end_time: new Date(dateTime).toISOString()
      });
      toast.success("Shift extended");
      setEditingShiftId(null);
      fetchMatrix();
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setActingId(null);
    }
  };

  const handleDeleteShift = async (shiftId: number, nurseId: number) => {
    setActingId(nurseId);
    try {
      await api.delete(`wards/admin/shifts/${shiftId}/`);
      toast.success("Shift terminated");
      setShifts(shifts.filter(s => s.id !== shiftId));
    } catch (error) {
      toast.error("Termination failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden text-zinc-900">
        <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Clock className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-2xl font-black tracking-tight">
                  Clinical Rotations
                </DialogTitle>
                <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mt-0.5">
                  Manage active shifts for <span className="text-indigo-600">"{ward?.name}"</span>
                </p>
              </div>
            </div>
            {fetching && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {fetching ? (
                <div className="py-20 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full border border-zinc-100 rounded-[2rem]" />
                    ))}
                </div>
            ) : assignedNurses.length === 0 ? (
                <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-zinc-200 bg-zinc-50/30">
                    <UserPlus className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
                    <p className="text-lg font-black text-zinc-900 tracking-tight">No Personnel Assigned</p>
                    <p className="text-sm text-zinc-500 mt-2 font-medium max-w-xs mx-auto">
                        Assign nurses to this unit in the Staff Deployment center to manage their shifts.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {assignedNurses.map(nurse => {
                        const nurseShift = shifts.find(s => s.nurse === nurse.id);
                        const isActive = nurseShift && isAfter(new Date(nurseShift.end_time), new Date());
                        const isJoining = selectedNurseId === nurse.id;

                        return (
                            <div key={nurse.id} className={`group relative p-6 rounded-[2.5rem] border transition-all duration-300 ${
                                isActive 
                                ? "bg-white border-indigo-100 shadow-lg shadow-indigo-100/20" 
                                : "bg-zinc-50/50 border-zinc-100"
                            }`}>
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center font-black text-[10px] tracking-widest ${
                                                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-zinc-400 border border-zinc-100 shadow-sm"
                                            }`}>
                                                {nurse.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black tracking-tight text-zinc-900">{nurse.username}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {isActive ? (
                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">On Active Duty</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-zinc-100 text-zinc-400 border border-zinc-200 tracking-widest">
                                                            Off Duty
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isActive ? (
                                                <div className="flex items-center gap-4">
                                                    {editingShiftId === nurseShift!.id ? (
                                                        <div className="flex items-center gap-3 animate-in zoom-in-95 duration-200 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                                                            <input 
                                                                type="date" 
                                                                value={editDate}
                                                                min={format(new Date(), "yyyy-MM-dd")}
                                                                onChange={(e) => setEditDate(e.target.value)}
                                                                className="h-10 w-32 bg-white border border-zinc-100 rounded-xl px-3 text-[10px] font-black text-zinc-600 outline-none"
                                                            />
                                                            <input 
                                                                type="time" 
                                                                value={editTime}
                                                                onChange={(e) => setEditTime(e.target.value)}
                                                                className="h-10 w-28 bg-white border border-zinc-100 rounded-xl px-3 text-[10px] font-black text-zinc-600 outline-none"
                                                            />
                                                            <Button 
                                                                size="icon"
                                                                onClick={() => handleUpdateShiftTime(nurseShift!.id, nurse.id)}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl w-10 h-10 shadow-lg shadow-indigo-200"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                onClick={() => setEditingShiftId(null)}
                                                                className="text-zinc-400 hover:text-rose-500 w-10 h-10 rounded-xl"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shift Lock</span>
                                                                <span className="text-[10px] font-black text-zinc-900">Until {format(new Date(nurseShift!.end_time), "dd MMM, hh:mm aa")}</span>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                onClick={() => {
                                                                    const d = new Date(nurseShift!.end_time);
                                                                    setEditingShiftId(nurseShift!.id);
                                                                    setEditDate(format(d, "yyyy-MM-dd"));
                                                                    setEditTime(format(d, "HH:mm"));
                                                                }}
                                                                className="h-12 w-12 text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                disabled={actingId === nurse.id}
                                                                onClick={() => handleDeleteShift(nurseShift!.id, nurse.id)}
                                                                className="h-12 w-12 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                            >
                                                                {actingId === nurse.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : !isJoining && (
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedNurseId(nurse.id);
                                                        setShiftType("DAY");
                                                    }}
                                                    className="bg-white border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-zinc-500 hover:text-indigo-600 rounded-2xl px-8 h-12 transition-all font-black uppercase text-[10px] tracking-[0.2em] shadow-sm active:scale-95"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Start Rotation
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isJoining && (
                                        <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 animate-in fade-in slide-in-from-top-4 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Rotation Parameters</h4>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => setSelectedNurseId(null)}
                                                    className="text-zinc-300 hover:text-rose-500 h-8 w-8"
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-4 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Protocol</label>
                                                    <Select value={shiftType} onValueChange={handleShiftTypeChange}>
                                                        <SelectTrigger className="h-12 bg-white border-zinc-100 text-[10px] uppercase font-black rounded-xl shadow-sm px-4">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-none shadow-xl rounded-xl">
                                                            <SelectItem value="DAY" className="text-[10px] font-black uppercase rounded-lg">Day Rotation</SelectItem>
                                                            <SelectItem value="NIGHT" className="text-[10px] font-black uppercase rounded-lg">Night Rotation</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Active Date</label>
                                                    <div className="flex bg-white border border-zinc-100 rounded-xl px-4 h-12 items-center shadow-sm">
                                                        <CalIcon className="w-4 h-4 text-zinc-300 mr-3" />
                                                        <input 
                                                            type="date" 
                                                            value={startDate}
                                                            min={format(new Date(), "yyyy-MM-dd")}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="bg-transparent text-[10px] font-black text-zinc-600 outline-none w-full cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Start Time</label>
                                                    <div className="flex bg-white border border-zinc-100 rounded-xl px-4 h-12 items-center shadow-sm">
                                                        <Clock className="w-4 h-4 text-zinc-300 mr-3" />
                                                        <input 
                                                            type="time" 
                                                            value={startTime}
                                                            onChange={(e) => setStartTime(e.target.value)}
                                                            className="bg-transparent text-[10px] font-black text-zinc-600 outline-none w-full cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Rotation Lock</label>
                                                    <div className="flex bg-white border border-zinc-100 rounded-xl px-4 h-12 items-center shadow-sm">
                                                        <Clock className="w-4 h-4 text-zinc-300 mr-3" />
                                                        <input 
                                                            type="time" 
                                                            value={newTime}
                                                            onChange={(e) => handleTimeChange(e.target.value)}
                                                            className="bg-transparent text-[10px] font-black text-zinc-600 outline-none w-full cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button 
                                                onClick={() => handleCreateShift(nurse.id)}
                                                disabled={actingId === nurse.id}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all active:scale-95"
                                            >
                                                {actingId === nurse.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Deployment"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center px-10">
             <div className="flex items-center gap-6 text-zinc-400 uppercase tracking-widest text-[9px] font-black">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" /> Authorized</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-200" /> Pending</span>
             </div>
             <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="text-zinc-500 hover:text-zinc-900 uppercase tracking-[0.2em] font-black text-[10px]"
            >
                Close Console
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
