"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import WardTable from "@/components/wards/WardTable";
import WardDialog from "@/components/wards/WardDialog";
import NurseAssignmentDialog from "@/components/wards/NurseAssignmentDialog";
import WardDeleteDialog from "@/components/wards/WardDeleteDialog";
import PaginationController from "@/components/ui/PaginationController";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Ward {
  id: number;
  name: string;
  floor: number;
  description: string | null;
  nurses?: number[];
  is_active: boolean;
  created_at: string;
}

export default function WardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredWards, setFilteredWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWards = useCallback(async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const response = await api.get(`wards/admin/wards/`, {
        params: { page, search }
      });
      if (response.data.success) {
        setWards(response.data.results);
        setTotalPages(response.data.total_pages);
        setTotalCount(response.data.count);
        setCurrentPage(response.data.current_page);
      }
    } catch (error) {
      toast.error("Failed to load wards");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchWards(1, searchQuery);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, fetchWards]);

  // Page Change Effect
  useEffect(() => {
    if (currentPage > 1 || searchQuery === "") {
        fetchWards(currentPage, searchQuery);
    }
  }, [currentPage, fetchWards]);

  // Handle manual refresh
  const handleRefresh = () => {
    setCurrentPage(1);
    fetchWards(1, searchQuery);
  };

  const handleEdit = (ward: Ward) => {
    setSelectedWard(ward);
    setIsDialogOpen(true);
  };

  const handleAssign = (ward: Ward) => {
    setSelectedWard(ward);
    setIsAssignDialogOpen(true);
  };


  const handleDelete = (ward: Ward) => {
    setSelectedWard(ward);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWard(null);
    setIsDialogOpen(true);
  };

    return (
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Hospital <span className="text-[#5C61F2]">Wards</span>
                    </h1>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New Ward
                </Button>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="SEARCH BY WARD NAME, FLOOR, OR DESCRIPTION..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 bg-zinc-50 border-none focus-visible:ring-0 focus:bg-white focus:ring-2 focus:ring-[#5C61F2]/10 h-16 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest text-zinc-900 placeholder:text-zinc-400"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="bg-zinc-50 border border-zinc-100 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 h-16 w-16 rounded-2xl transition-all active:scale-95 shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </Button>
            </div>

            {/* 📋 WARD REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <WardTable
                    wards={wards}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onAssign={handleAssign}
                    onDelete={handleDelete}
                />
                
                <div className="p-10 border-t border-zinc-50 bg-zinc-50/20">
                    <PaginationController 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        isLoading={loading}
                    />
                </div>
            </div>

            {/* 📊 SUMMARY METRICS */}
            {!loading && (wards?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Wards</p>
                            <p className="text-4xl font-black text-zinc-900 tracking-tighter">{totalCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/5 flex items-center justify-center border border-[#5C61F2]/10">
                            <Map className="w-6 h-6 text-[#5C61F2]" />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Active Wards</p>
                            <p className="text-4xl font-black text-emerald-500 tracking-tighter">
                                {wards?.filter(w => w.is_active).length ?? 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* 🛠️ DIALOGS */}
            <WardDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                ward={selectedWard}
                onSuccess={handleRefresh}
            />
            <WardDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                ward={selectedWard}
                onSuccess={handleRefresh}
            />
            <NurseAssignmentDialog
                open={isAssignDialogOpen}
                onOpenChange={setIsAssignDialogOpen}
                ward={selectedWard}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
