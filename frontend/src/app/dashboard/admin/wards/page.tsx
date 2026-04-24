"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map, RefreshCw } from "lucide-react";
import WardTable from "@/components/wards/WardTable";
import WardDialog from "@/components/wards/WardDialog";
import WardDeleteDialog from "@/components/wards/WardDeleteDialog";
import PaginationController from "@/components/ui/PaginationController";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Ward {
  id: number;
  name: string;
  floor: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function WardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredWards, setFilteredWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWards = useCallback(async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const response = await api.get(`wards/admin/wards/`, {
        params: { page, search }
      });
      if (response.data.success) {
        setWards(response.data.results);
        setTotalPages(response.data.total_pages);
        setTotalCount(response.data.count);
        setCurrentPage(response.data.current_page);
      }
    } catch (error) {
      toast.error("Failed to load wards");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchWards(1, searchQuery);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, fetchWards]);

  // Page Change Effect
  useEffect(() => {
    if (currentPage > 1 || searchQuery === "") {
        fetchWards(currentPage, searchQuery);
    }
  }, [currentPage, fetchWards]);

  // Handle manual refresh
  const handleRefresh = () => {
    setCurrentPage(1);
    fetchWards(1, searchQuery);
  };

  const handleEdit = (ward: Ward) => {
    setSelectedWard(ward);
    setIsDialogOpen(true);
  };

  const handleDelete = (ward: Ward) => {
    setSelectedWard(ward);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWard(null);
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
                <Map className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
                Ward Management
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 font-medium italic">
              Configure and oversee facility wards and clinical units.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ward
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search by ward name or floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-zinc-800 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="bg-black/40 border-zinc-800 hover:bg-zinc-900 text-zinc-400"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="mt-6 bg-zinc-900/20 border border-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
          <WardTable
            wards={wards}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          <PaginationController 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </div>

        {/* Stats Summary (Optional/Premium touch) */}
        {!loading && (wards?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Wards</p>
              <p className="text-2xl font-bold mt-1 text-zinc-200">{wards?.length ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Units</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">
                {wards?.filter(w => w.is_active).length ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <WardDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          ward={selectedWard}
          onSuccess={fetchWards}
        />
        <WardDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          ward={selectedWard}
          onSuccess={fetchWards}
        />
      </div>
    </DashboardShell>
  );
}
