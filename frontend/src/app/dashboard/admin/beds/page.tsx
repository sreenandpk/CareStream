"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Hotel, BarChart3, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import BedTable from "@/components/beds/BedTable";
import BedDialog from "@/components/beds/BedDialog";
import BedDeleteDialog from "@/components/beds/BedDeleteDialog";
import PaginationController from "@/components/ui/PaginationController";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Room {
  id: number;
  room_number: string;
}

interface Bed {
  id: number;
  room: number;
  bed_number: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  is_active: boolean;
  created_at: string;
}

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredBeds, setFilteredBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const fetchData = useCallback(async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const [bedsRes, roomsRes] = await Promise.all([
        api.get(`beds/admin/beds/`, { params: { page, search } }),
        api.get("rooms/admin/rooms/")
      ]);

      if (bedsRes.data.success) {
        setBeds(bedsRes.data.results);
        setTotalPages(bedsRes.data.total_pages);
        setTotalCount(bedsRes.data.count);
        setCurrentPage(bedsRes.data.current_page);
      }
      if (roomsRes.data.success) {
        setRooms(roomsRes.data.results || roomsRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to sync clinical infrastructure");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData(1, searchQuery);
    }, 400); 
    return () => clearTimeout(timer);
  }, [searchQuery, fetchData]);

  // Page Change Effect
  useEffect(() => {
    if (currentPage > 1 || searchQuery === "") {
        fetchData(currentPage, searchQuery);
    }
  }, [currentPage, fetchData]);

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchData(1, searchQuery);
  };

  const getRoomNumber = (roomId: number) => {
    return rooms?.find(r => r.id === roomId)?.room_number || `Rm ${roomId}`;
  };

  const handleEdit = (bed: Bed) => {
    setSelectedBed(bed);
    setIsDialogOpen(true);
  };

  const handleDelete = (bed: Bed) => {
    setSelectedBed(bed);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedBed(null);
    setIsDialogOpen(true);
  };

  const occupiedCount = beds?.filter(b => b.status === "OCCUPIED").length ?? 0;
  const maintenanceCount = beds?.filter(b => b.status === "MAINTENANCE").length ?? 0;
  const occupancyRate = (beds?.length ?? 0) > 0 ? Math.round((occupiedCount / (beds?.length ?? 1)) * 100) : 0;

    return (
        <div className="p-8 pt-10 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Hospital <span className="text-[#5C61F2]">Beds</span>
                    </h1>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New Bed
                </Button>
            </div>

            {/* 📋 TACTICAL METRICS */}
            {!loading && (beds?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                <BarChart3 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{occupancyRate}%</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total Occupancy</p>
                            <div className="mt-6 h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                                <div className="h-full bg-[#5C61F2] transition-all duration-1000" style={{ width: `${occupancyRate}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{occupiedCount}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Beds Occupied</p>
                            <div className="mt-6 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(occupiedCount / (totalCount || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-100/50 transition-colors" />
                        <div className="relative z-10 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Wrench className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">{maintenanceCount}</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Under Maintenance</p>
                            <div className="mt-6 h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${(maintenanceCount / (totalCount || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="SEARCH BY BED NUMBER, ROOM, OR STATUS..."
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

            {/* 📋 BED REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <BedTable
                    beds={beds}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getRoomNumber={getRoomNumber}
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

            {/* 🛠️ DIALOGS */}
            <BedDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                bed={selectedBed}
                onSuccess={handleRefresh}
            />
            <BedDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                bed={selectedBed}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
