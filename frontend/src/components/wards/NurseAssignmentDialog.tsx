"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/axios";
import { UserCheck, Check, Search, X, ChevronLeft, ChevronRight, Users, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Nurse {
  id: number;
  username: string;
}

interface Ward {
  id: number;
  name: string;
  nurses?: number[];
}

interface NurseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward: Ward | null;
  onSuccess: () => void;
}

export default function NurseAssignmentDialog({
  open,
  onOpenChange,
  ward,
  onSuccess,
}: NurseAssignmentDialogProps) {
  const [assignedNurses, setAssignedNurses] = useState<number[]>([]);
  const [nursesList, setNursesList] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNurses = useCallback(async () => {
    setFetching(true);
    try {
      const res = await api.get("accounts/users/", { 
        params: { 
          role: "NURSE", 
          active: true,
          search: search || undefined,
          page: currentPage
        } 
      });
      
      if (res.data.results) {
        setNursesList(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
      } else if (res.data.data) {
        setNursesList(res.data.data);
        setTotalPages(1);
      } else {
          setNursesList([]);
          setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch nurses", err);
    } finally {
      setFetching(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        fetchNurses();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, search, currentPage, fetchNurses]);

  useEffect(() => {
    if (ward) {
      setAssignedNurses(ward.nurses || []);
    }
  }, [ward, open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCurrentPage(1);
      setAssignedNurses([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!ward) return;
    setLoading(true);

    try {
      const response = await api.patch(`wards/admin/wards/${ward.id}/`, {
        nurses: assignedNurses
      });
      if (response.data.success) {
        toast.success(`Staffing updated for ${ward.name}`);
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to update clinical staffing";
        toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden text-zinc-900">
        <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <UserCheck className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-black tracking-tight">
                Staff Deployment
              </DialogTitle>
              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mt-0.5">
                Assign clinical staff to <span className="text-indigo-600">"{ward?.name}"</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 pt-6 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search clinical staff by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-50 border-none h-14 pl-12 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/10 font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Available Personnel</span>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {assignedNurses.length} Selected
              </span>
            </div>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
              {fetching ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl bg-zinc-50" />
                ))
              ) : nursesList.length > 0 ? (
                nursesList.map((nurse) => {
                  const isAssigned = assignedNurses.includes(nurse.id);
                  return (
                    <div
                      key={nurse.id}
                      onClick={() => {
                        const newNurses = isAssigned 
                            ? assignedNurses.filter(id => id !== nurse.id)
                            : [...assignedNurses, nurse.id];
                        setAssignedNurses(newNurses);
                      }}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isAssigned 
                        ? "bg-indigo-50 border-indigo-100 shadow-sm" 
                        : "bg-white border-zinc-100 hover:border-indigo-200 hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] transition-colors tracking-widest ${
                          isAssigned ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-400"
                        }`}>
                          {nurse.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isAssigned ? "text-indigo-900" : "text-zinc-700"}`}>
                            {nurse.username}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Registered Nurse
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isAssigned 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                        : "bg-transparent border-zinc-200 text-transparent"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-4">
                  <div className="w-16 h-16 rounded-[2rem] bg-zinc-50 flex items-center justify-center border border-zinc-100 border-dashed">
                    <Users className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No staff members found</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1 || fetching}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-10 h-10 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center px-4">
                <span className="text-[10px] font-black text-zinc-400">PAGE {currentPage} OF {totalPages}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages || fetching}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-10 h-10 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900"
              >
                Cancel
              </Button>
              <Button
                disabled={loading || fetching}
                onClick={handleSubmit}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync Roster"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
