'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/app/hooks/useDebounce';

interface WBSActionsProps {
  onAdd: () => void;
  onExport?: () => void;
  onSearch: (term: string) => void;
}

export default function WBSActions({ onAdd, onExport, onSearch }: WBSActionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <button
          onClick={onAdd}
          className="erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/20 gap-1.5 whitespace-nowrap"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm hạng mục
        </button>



        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-[360px] group ml-auto md:ml-2 w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)] opacity-50 group-focus-within:text-blue-500 group-focus-within:opacity-100 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã WBS, tên hạng mục..." 
            className="erp-input w-full !pl-10 !pr-8 text-[13px]"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); onSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={onExport}
          className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Xuất Excel
        </button>
      </div>
    </div>
  );
}
