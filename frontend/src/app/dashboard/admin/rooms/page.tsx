"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Home, RefreshCw, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="p-10 pt-16 space-y-12 min-h-screen bg-zinc-50/30 w-full max-w-[1600px] mx-auto text-left">
            {/* 🛡️ PREMIUM HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col text-left">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-none uppercase">
                        Hospital <span className="text-[#5C61F2]">Rooms</span>
                    </h1>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-[#5C61F2] hover:bg-[#4A4ED4] text-white shadow-xl shadow-[#5C61F2]/20 h-16 px-10 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border-none"
                >
                    Add New Room
                </Button>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="SEARCH BY ROOM NUMBER, WARD, OR TYPE..."
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

            {/* 📋 ROOM REGISTRY TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                <RoomTable
                    rooms={rooms}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getWardName={getWardName}
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
            {!loading && (rooms?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Active Rooms</p>
                            <p className="text-4xl font-black text-zinc-900 tracking-tighter">{totalCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#5C61F2]/5 flex items-center justify-center border border-[#5C61F2]/10">
                            <Home className="w-6 h-6 text-[#5C61F2]" />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Beds</p>
                            <p className="text-4xl font-black text-emerald-500 tracking-tighter">
                                {rooms?.reduce((acc, r) => acc + (r.capacity ?? 0), 0) ?? 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* 🛠️ DIALOGS */}
            <RoomDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                room={selectedRoom}
                onSuccess={handleRefresh}
            />
            <RoomDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                room={selectedRoom}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
