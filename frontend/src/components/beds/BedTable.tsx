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
import { Edit2, Trash2, Hotel, CheckCircle2, XCircle, AlertCircle, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Bed {
  id: number;
  room: number;
  room_number?: string;
  bed_number: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  is_active: boolean;
  created_at: string;
}

interface BedTableProps {
  beds: Bed[];
  isLoading: boolean;
  onEdit: (bed: Bed) => void;
  onDelete: (bed: Bed) => void;
  getRoomNumber: (roomId: number) => string;
}

export default function BedTable({
  beds,
  isLoading,
  onEdit,
  onDelete,
  getRoomNumber,
}: BedTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full border border-[#5C67F2]/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!beds || beds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Hotel className="w-10 h-10 text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No Beds Found</h3>
        <p className="text-zinc-500 text-center mt-3 max-w-sm font-medium">
          No beds found. Add a new bed to get started.
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "AVAILABLE": 
        return { 
          color: "bg-emerald-50 text-emerald-500 border-emerald-100",
          icon: CheckCircle2,
          label: "Available"
        };
      case "OCCUPIED": 
        return { 
          color: "bg-[#5C67F2]/10 text-[#5C67F2] border-[#5C67F2]/20",
          icon: AlertCircle,
          label: "Occupied"
        };
      case "MAINTENANCE": 
        return { 
          color: "bg-amber-50 text-amber-500 border-amber-100",
          icon: Wrench,
          label: "Maintenance"
        };
      default: 
        return { 
          color: "bg-zinc-50 text-zinc-400 border-zinc-100",
          icon: AlertCircle,
          label: status
        };
    }
  };

    return (
        <div className="overflow-x-auto text-left">
            <Table>
                <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Bed Number</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Room</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Status</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {beds?.map((bed) => {
                        const statusConfig = getStatusConfig(bed.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <TableRow 
                                key={bed.id} 
                                className="border-zinc-50 hover:bg-zinc-50/40 transition-all group"
                            >
                                <TableCell className="px-10 py-8">
                                    <div className="flex flex-col text-left">
                                        <span className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">
                                            Bed {bed.bed_number}
                                        </span>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 opacity-60">Serial: {String(bed.id || 0).padStart(4, '0')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-10 py-8">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-10 h-10 rounded-2xl bg-[#5C61F2]/5 flex items-center justify-center border border-[#5C61F2]/10">
                                            <Hotel className="w-5 h-5 text-[#5C61F2]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-zinc-600 uppercase tracking-widest leading-none">Room {getRoomNumber(bed.room)}</span>
                                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-1.5">Room Assigned</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-10 py-8">
                                    <Badge className={cn("border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm flex items-center gap-2 w-fit", statusConfig.color)}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-10 py-8 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(bed)}
                                            className="h-11 w-11 text-zinc-400 hover:text-[#5C61F2] hover:bg-[#5C61F2]/5 rounded-2xl transition-all border border-transparent hover:border-[#5C61F2]/10"
                                        >
                                            <Edit2 className="h-4.5 w-4.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(bed)}
                                            className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100/50"
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
