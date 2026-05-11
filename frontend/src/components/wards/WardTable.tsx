"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, UserCheck, Users, Clock, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Ward {
  id: number;
  name: string;
  floor: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface WardTableProps {
  wards: Ward[];
  onEdit: (ward: Ward) => void;
  onAssign: (ward: Ward) => void;
  onDelete: (ward: Ward) => void;
  isLoading: boolean;
}

export default function WardTable({
  wards,
  onEdit,
  onAssign,
  onDelete,
  isLoading,
}: WardTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full border border-[#5C67F2]/10 rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  if (!wards || wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Map className="w-10 h-10 text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No Wards Created</h3>
        <p className="text-zinc-500 max-w-sm mt-3 font-medium">Add a new ward to get started.</p>
      </div>
    );
  }

    return (
        <div className="overflow-x-auto text-left">
            <Table>
                <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Ward Name</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Floor</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10">Description</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-center">Status</TableHead>
                        <TableHead className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[9px] h-20 px-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {wards?.map((ward) => (
                        <TableRow 
                            key={ward.id} 
                            className="border-zinc-50 hover:bg-zinc-50/40 transition-all group"
                        >
                            <TableCell className="px-10 py-8">
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">{ward.name}</span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 opacity-60">ID: {String(ward.id || 0).padStart(3, '0')}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-10 py-8 text-center">
                                <div className="inline-flex w-11 h-11 rounded-2xl bg-[#5C61F2]/5 border border-[#5C61F2]/10 items-center justify-center shadow-sm">
                                    <span className="font-black text-[#5C61F2] text-sm">{ward.floor}F</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-10 py-8 text-left">
                                <p className="text-zinc-500 text-[13px] font-bold leading-relaxed max-w-xs truncate">
                                    {ward.description || "No description provided."}
                                </p>
                            </TableCell>
                            <TableCell className="px-10 py-8 text-center">
                                {ward.is_active ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm">Active</Badge>
                                ) : (
                                    <Badge className="bg-zinc-50 text-zinc-400 border-none text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-lg shadow-sm">Inactive</Badge>
                                )}
                            </TableCell>
                            <TableCell className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onAssign(ward)}
                                        className={cn(
                                            "h-11 w-11 transition-all rounded-2xl border border-transparent",
                                            (ward.nurses?.length ?? 0) > 0 
                                                ? "text-[#5C61F2] bg-[#5C61F2]/5 border-[#5C61F2]/10 shadow-sm" 
                                                : "text-zinc-400 hover:text-[#5C61F2] hover:bg-[#5C61F2]/5"
                                        )}
                                        title={(ward.nurses?.length ?? 0) > 0 ? `${ward.nurses?.length} Nurses Assigned` : "Assign Nurses"}
                                    >
                                        <Users className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(ward)}
                                        className="h-11 w-11 text-zinc-400 hover:text-[#5C61F2] hover:bg-[#5C61F2]/5 border border-transparent hover:border-[#5C61F2]/10 rounded-2xl transition-all"
                                        title="Edit Ward"
                                    >
                                        <Edit2 className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(ward)}
                                        className="h-11 w-11 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100/50 rounded-2xl transition-all"
                                        title="Delete Ward"
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
