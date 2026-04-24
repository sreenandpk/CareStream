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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-900/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-zinc-950/20 rounded-xl border border-zinc-900">
        <Home className="w-10 h-10 text-zinc-800 mb-4" />
        <h3 className="text-zinc-400 font-bold tracking-tight">No Clinical Rooms Available</h3>
        <p className="text-zinc-600 text-[11px] mt-1 font-medium uppercase tracking-widest text-center px-12">
          This ward has not been configured with room units yet.
        </p>
      </div>
    );
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "PRIVATE": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "SHARED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "ISOLATION": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "OBSERVATION": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-900/40">
          <TableRow className="border-zinc-800 hover:bg-transparent uppercase text-[10px] tracking-widest font-black">
            <TableHead className="text-zinc-400 py-4 px-6">Room Number</TableHead>
            <TableHead className="text-zinc-400 py-4 px-6">Ward Assignment</TableHead>
            <TableHead className="text-zinc-400 py-4 px-6">Classification</TableHead>
            <TableHead className="text-zinc-400 py-4 px-6">Occupancy</TableHead>
            <TableHead className="text-zinc-400 py-4 px-6">Status</TableHead>
            <TableHead className="text-zinc-400 py-4 px-6 text-right pr-10">Management</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms?.map((room) => (
            <TableRow 
              key={room.id} 
              className="border-zinc-900 hover:bg-zinc-900/30 transition-all group"
            >
              <TableCell className="px-6 py-4 font-mono font-bold text-zinc-200">
                {room.room_number}
              </TableCell>
              <TableCell className="px-6 py-4 text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {getWardName(room.ward)}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge variant="outline" className={`font-bold text-[10px] ${getTypeBadgeColor(room.room_type)}`}>
                  {room.room_type}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-bold">{room.capacity}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                {room.is_active ? (
                  <div className="flex items-center gap-2 text-emerald-500/80">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Deactive</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(room)}
                    className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(room)}
                    className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
