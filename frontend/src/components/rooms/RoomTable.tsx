"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Home, Users, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Room {
  id: number;
  ward: number;
  ward_name?: string; 
  room_number: string;
  room_type: "PRIVATE" | "SHARED" | "ISOLATION" | "OBSERVATION";
  capacity: number;
  is_active: boolean;
  created_at: string;
}

interface RoomTableProps {
  rooms: Room[];
  isLoading: boolean;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  getWardName: (wardId: number) => string;
}

export default function RoomTable({
  rooms,
  isLoading,
  onEdit,
  onDelete,
  getWardName,
}: RoomTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full border border-[#5C67F2]/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Home className="w-10 h-10 text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No Rooms Found</h3>
        <p className="text-zinc-500 text-center mt-3 max-w-sm font-medium">
          No rooms found. Add a new room to get started.
        </p>
      </div>
    );
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "PRIVATE": return "bg-blue-50 text-blue-500 border-blue-100";
      case "SHARED": return "bg-emerald-50 text-emerald-500 border-emerald-100";
      case "ISOLATION": return "bg-rose-50 text-rose-500 border-rose-100";
      case "OBSERVATION": return "bg-amber-50 text-amber-500 border-amber-100";
      default: return "bg-zinc-50 text-zinc-400 border-zinc-100";
    }
  };

    return (
        <div className="overflow-x-auto text-left">
            <Table>
                <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Room Number</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Ward</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Type</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Beds</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Status</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rooms?.map((room) => (
                        <TableRow 
                            key={room.id} 
                            className="border-zinc-50 hover:bg-zinc-50/40 transition-all group"
                        >
                            <TableCell className="px-10 py-8">
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">
                                        Room {room.room_number}
                                    </span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 opacity-60">ID: {String(room.id || 0).padStart(3, '0')}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-10 py-8">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-2xl bg-[#5C61F2]/5 flex items-center justify-center border border-[#5C61F2]/10">
                                        <Home className="w-5 h-5 text-[#5C61F2]" />
                                    </div>
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">{getWardName(room.ward)}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-10 py-8">
                                <Badge className={cn("border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm w-fit", getTypeBadgeColor(room.room_type))}>
                                    {room.room_type}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-10 py-8 text-center">
                                <div className="inline-flex w-11 h-11 rounded-2xl bg-zinc-50 border border-zinc-100 items-center justify-center shadow-sm">
                                    <span className="font-black text-zinc-900 text-sm">{room.capacity}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-10 py-8">
                                {room.is_active ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm flex items-center gap-2 w-fit">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge className="bg-zinc-50 text-zinc-400 border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm w-fit">Inactive</Badge>
                                )}
                            </TableCell>
                            <TableCell className="px-10 py-8 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(room)}
                                        className="h-11 w-11 text-zinc-400 hover:text-[#5C61F2] hover:bg-[#5C61F2]/5 rounded-2xl transition-all border border-transparent hover:border-[#5C61F2]/10"
                                    >
                                        <Edit2 className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(room)}
                                        className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100/50"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
