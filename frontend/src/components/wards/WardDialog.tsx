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
import { Building2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";

interface Ward {
  id?: number;
  name: string;
  floor: number;
  description: string | null;
  nurses?: number[];
  is_active: boolean;
}

interface Nurse {
  id: number;
  username: string;
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
    nurses: [],
    is_active: true,
  });
  const [nursesList, setNursesList] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingNurses, setFetchingNurses] = useState(false);

  useEffect(() => {
    async function fetchNurses() {
      setFetchingNurses(true);
      try {
        const res = await api.get("accounts/users/", { params: { role: "NURSE", active: true } });
        if (res.data.success) {
          setNursesList(res.data.data || res.data.results || []);
        }
      } catch (err) {
        console.error("Failed to fetch nurses", err);
      } finally {
        setFetchingNurses(false);
      }
    }
    if (open) fetchNurses();
  }, [open]);

  useEffect(() => {
    if (ward) {
      setFormData({
        name: ward.name,
        floor: ward.floor,
        description: ward.description || "",
        nurses: ward.nurses || [],
        is_active: ward.is_active,
      });
    } else {
      setFormData({
        name: "",
        floor: 0,
        description: "",
        nurses: [],
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
      <DialogContent className="sm:max-w-[550px] bg-white border-none text-zinc-900 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-indigo-50/50 border-b border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {ward ? "Edit Ward" : "Add New Ward"}
              </DialogTitle>
              <p className="text-[#5C61F2] text-[11px] font-black uppercase tracking-widest mt-0.5">
                Ward Details & Staffing
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-2 text-left">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Ward Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Intensive Care Unit"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/10 h-14 rounded-2xl font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="floor" className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                  Floor
                </Label>
                <Input
                  id="floor"
                  type="number"
                  min="0"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/10 h-14 rounded-2xl font-black text-zinc-900 text-lg transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                Assign Nurses
              </Label>
              <div className="max-h-[220px] overflow-y-auto border border-zinc-100 rounded-[2rem] p-4 bg-zinc-50/50 space-y-2 custom-scrollbar">
                {fetchingNurses ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-6 h-6 text-[#5C61F2] animate-spin" />
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest text-center">Loading Nurses...</p>
                  </div>
                ) : nursesList.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic p-4 text-center">No active nurses found.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {nursesList.map(nurse => (
                      <label key={nurse.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group cursor-pointer border border-transparent hover:border-zinc-100">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={formData.nurses?.includes(nurse.id)}
                            onChange={(e) => {
                              const newNurses = e.target.checked 
                                ? [...(formData.nurses || []), nurse.id]
                                : (formData.nurses || []).filter(id => id !== nurse.id);
                              setFormData({ ...formData, nurses: newNurses });
                            }}
                            className="w-5 h-5 rounded-lg border-2 border-zinc-200 bg-white checked:bg-[#5C61F2] checked:border-[#5C61F2] transition-all cursor-pointer appearance-none"
                          />
                          {formData.nurses?.includes(nurse.id) && (
                            <div className="absolute pointer-events-none text-white font-bold text-[10px]">✓</div>
                          )}
                        </div>
                        <span className="text-[12px] font-black text-zinc-500 group-hover:text-zinc-900 uppercase tracking-tight">
                          {nurse.username}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-[2.5rem] border border-dashed border-zinc-200">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Active Status</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">Allow patient admissions to this ward.</p>
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
              ) : ward ? (
                "Save Changes"
              ) : (
                "Create Ward"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
