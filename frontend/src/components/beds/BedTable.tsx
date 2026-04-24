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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-900/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!beds || beds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-zinc-950/20 rounded-2xl border border-zinc-900 shadow-inner">
        <Hotel className="w-10 h-10 text-zinc-800 mb-4" />
        <h3 className="text-zinc-400 font-bold tracking-tight">Bed Inventory Uninitialized</h3>
        <p className="text-zinc-600 text-[11px] mt-1 font-medium uppercase tracking-widest text-center px-12">
          No beds have been registered to clinical rooms in this unit yet.
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "AVAILABLE": 
        return { 
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
          label: "Available"
        };
      case "OCCUPIED": 
        return { 
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: AlertCircle,
          label: "Occupied"
        };
      case "MAINTENANCE": 
        return { 
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: Wrench,
          label: "Maintenance"
        };
      default: 
        return { 
          color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          icon: AlertCircle,
          label: status
        };
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-900/40">
          <TableRow className="border-zinc-800 hover:bg-transparent uppercase text-[10px] tracking-widest font-black">
            <TableHead className="text-zinc-400 py-5 px-6">Bed Identity</TableHead>
            <TableHead className="text-zinc-400 py-5 px-6">Room Assignment</TableHead>
            <TableHead className="text-zinc-400 py-5 px-6">Operational State</TableHead>
            <TableHead className="text-zinc-400 py-5 px-6">Service Eligibility</TableHead>
            <TableHead className="text-zinc-400 py-5 px-6 text-right pr-10">Administration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {beds?.map((bed) => {
            const statusConfig = getStatusConfig(bed.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <TableRow 
                key={bed.id} 
                className="border-zinc-900/50 hover:bg-zinc-900/30 transition-all group"
              >
                <TableCell className="px-6 py-4 font-mono font-bold text-zinc-200">
                  {bed.bed_number}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Room {getRoomNumber(bed.room)}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className={`font-bold text-[10px] flex items-center gap-1.5 w-fit ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {bed.is_active ? (
                    <div className="flex items-center gap-2 text-emerald-500/80">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
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
                      onClick={() => onEdit(bed)}
                      className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(bed)}
                      className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
