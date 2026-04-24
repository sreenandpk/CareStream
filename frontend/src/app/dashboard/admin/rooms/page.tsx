"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Home, RefreshCw, LayoutGrid } from "lucide-react";
import RoomTable from "@/components/rooms/RoomTable";
import RoomDialog from "@/components/rooms/RoomDialog";
import RoomDeleteDialog from "@/components/rooms/RoomDeleteDialog";
import PaginationController from "@/components/ui/PaginationController";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Ward {
  id: number;
  name: string;
}

interface Room {
  id: number;
  ward: number;
  room_number: string;
  room_type: "PRIVATE" | "SHARED" | "ISOLATION" | "OBSERVATION";
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchData = useCallback(async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const [roomsRes, wardsRes] = await Promise.all([
        api.get(`rooms/admin/rooms/`, { params: { page, search } }),
        api.get("wards/admin/wards/")
      ]);

      if (roomsRes.data.success) {
        setRooms(roomsRes.data.results);
        setTotalPages(roomsRes.data.total_pages);
        setTotalCount(roomsRes.data.count);
        setCurrentPage(roomsRes.data.current_page);
      }
      if (wardsRes.data.success) {
        setWards(wardsRes.data.results || wardsRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to load clinical data");
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

  const getWardName = (wardId: number) => {
    return wards.find(w => w.id === wardId)?.name || `Ward ${wardId}`;
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsDialogOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRoom(null);
    setIsDialogOpen(true);
  };

  return (
    <DashboardShell>
      <div className="p-8 space-y-8 min-h-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <LayoutGrid className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
                Room Management
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 font-medium italic">
              Manage clinical rooms, bed capacities, and ward assignments.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search by room number, ward, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-zinc-800 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="bg-black/40 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-10 w-10"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Summary */}
        {!loading && (rooms?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Rooms</p>
              <p className="text-2xl font-bold mt-1 text-zinc-200">{rooms?.length ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Capacity</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">
                {rooms?.reduce((acc, r) => acc + (r.capacity ?? 0), 0) ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="mt-6 bg-zinc-900/20 border border-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
          <RoomTable
            rooms={rooms}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getWardName={getWardName}
          />

          <PaginationController 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </div>

        {/* Dialogs */}
        <RoomDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          room={selectedRoom}
          onSuccess={fetchData}
        />
        <RoomDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          room={selectedRoom}
          onSuccess={fetchData}
        />
      </div>
    </DashboardShell>
  );
}
