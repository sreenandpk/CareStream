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
import { Edit2, Trash2 } from "lucide-react";

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
  onDelete: (ward: Ward) => void;
  isLoading: boolean;
}

export default function WardTable({
  wards,
  onEdit,
  onDelete,
  isLoading,
}: WardTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (wards.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No wards found. Click "Add Ward" to create one.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-terminal-border bg-black/20 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="hover:bg-transparent border-terminal-border">
            <TableHead className="text-zinc-400 font-medium">Name</TableHead>
            <TableHead className="text-zinc-400 font-medium text-center">Floor</TableHead>
            <TableHead className="text-zinc-400 font-medium">Description</TableHead>
            <TableHead className="text-zinc-400 font-medium text-center">Status</TableHead>
            <TableHead className="text-zinc-400 font-medium text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wards.map((ward) => (
            <TableRow
              key={ward.id}
              className="border-terminal-border hover:bg-zinc-900/30 transition-colors"
            >
              <TableCell className="font-semibold text-zinc-100 py-4">
                {ward.name}
              </TableCell>
              <TableCell className="text-center text-zinc-300">
                {ward.floor}
              </TableCell>
              <TableCell className="max-w-xs truncate text-zinc-400 text-sm">
                {ward.description || "—"}
              </TableCell>
              <TableCell className="text-center">
                {ward.is_active ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right py-4 pr-4">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(ward)}
                    className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all rounded-full"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ward)}
                    className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
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
