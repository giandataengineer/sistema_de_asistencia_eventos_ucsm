"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-border hover:bg-surface-alt
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm text-ink-light px-3">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-border hover:bg-surface-alt
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
