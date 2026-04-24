"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function PaginationController({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  // Ensure we are working with valid numbers
  const safeCurrentPage = isNaN(currentPage) ? 1 : currentPage;
  const safeTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;

  if (safeTotalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", safeTotalPages);
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        pages.push(1, "...", safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
      } else {
        pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", safeTotalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t border-white/5 bg-zinc-950/20 rounded-b-xl">
      <p className="text-xs text-zinc-500 font-medium tracking-tight">
        Page <span className="text-zinc-300">{safeCurrentPage}</span> of <span className="text-zinc-300">{safeTotalPages}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1 || isLoading}
          className="w-8 h-8 bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === "..." ? (
              <div key={`ellipsis-${index}`} className="flex items-center justify-center w-8 h-8">
                <MoreHorizontal className="w-4 h-4 text-zinc-600" />
              </div>
            ) : (
              <Button
                key={`page-${page}-${index}`}
                variant={safeCurrentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className={cn(
                  "w-8 h-8 text-[11px] font-bold transition-all",
                  currentPage === page 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="w-8 h-8 bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-20"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
