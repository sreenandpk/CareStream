"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Hotel, BarChart3, Users, Wrench } from "lucide-react";
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
    <DashboardShell>
      <div className="p-8 space-y-8 min-h-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Hotel className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
                Bed Inventory
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 font-medium italic text-sm">
              Manage individual bed status, occupancy, and technical maintenance.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-8 h-12 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bed
          </Button>
        </div>

        {/* Global Occupancy Metrics */}
        {!loading && (beds?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-24 h-24 text-zinc-100" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Occupancy Rate</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-4xl font-black text-white">{occupancyRate}%</p>
                <div className={`h-1.5 w-full bg-zinc-800 rounded-full mb-2.5 overflow-hidden`}>
                   <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ width: `${occupancyRate}%` }} 
                   />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 text-blue-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Occupied Beds</p>
              <p className="text-4xl font-black mt-2 text-blue-500">{occupiedCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Verified patient assignments</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Wrench className="w-24 h-24 text-amber-500" />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Under Maintenance</p>
              <p className="text-4xl font-black mt-2 text-amber-500">{maintenanceCount}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Requires technical clearance</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Filter by bed number (e.g. B-01), room, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-zinc-800 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 h-11"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="bg-black/40 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-11 w-11 rounded-xl"
            title="Refresh clinical sync"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="mt-2 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          <BedTable
            beds={beds}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getRoomNumber={getRoomNumber}
          />

          <PaginationController 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </div>

        {/* Dialogs */}
        <BedDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          bed={selectedBed}
          onSuccess={fetchData}
        />
        <BedDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          bed={selectedBed}
          onSuccess={fetchData}
        />
      </div>
    </DashboardShell>
  );
}
