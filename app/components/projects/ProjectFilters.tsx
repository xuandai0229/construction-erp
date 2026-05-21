'use client';

import { useState, useEffect, useRef } from 'react';
import { projectApi } from '@/services/api/project.api';
import AddProjectModal from '@/app/components/modals/AddProjectModal';
import { exportToCsv } from '@/app/services/export.service';
import { useDebounce } from '@/app/hooks/useDebounce';

interface ProjectFiltersProps {
  filters: {
    status?: string;
    search?: string;
  };
  onFilterChange: (filters: { status?: string; search?: string }) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái', icon: '◉', color: 'text-[var(--text-muted)]', bg: '' },
  { value: 'PLANNED', label: 'Lập kế hoạch', icon: '📋', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { value: 'IN_PROGRESS', label: 'Đang thi công', icon: '🚧', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'ACTIVE', label: 'Đang vận hành', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'COMPLETED', label: 'Hoàn thành', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'CANCELLED', label: 'Tạm dừng', icon: '⏸', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'CLOSED', label: 'Đã đóng', icon: '🔒', color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

const STATUS_DESCRIPTIONS: Record<string, string> = {
  '': 'Hiển thị tất cả dự án',
  'PLANNED': 'Đang chuẩn bị hồ sơ và triển khai',
  'IN_PROGRESS': 'Dự án đang được thi công thực tế',
  'ACTIVE': 'Dự án đang vận hành và khai thác',
  'COMPLETED': 'Đã nghiệm thu và bàn giao',
  'CANCELLED': 'Tạm dừng triển khai',
  'CLOSED': 'Đã đóng hồ sơ vĩnh viễn',
};

const DATE_PRESETS = [
  { label: 'Tất cả', value: '' },
  { label: '7 ngày', value: '7' },
  { label: '30 ngày', value: '30' },
  { label: 'Quý này', value: 'quarter' },
  { label: 'Năm nay', value: 'year' },
];

export default function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [focusedStatusIndex, setFocusedStatusIndex] = useState(-1);
  const [activeDatePreset, setActiveDatePreset] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Sync debounced search back to parent state
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Sync external search updates back to local state (e.g. on clear)
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for status dropdown
  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (!showStatusDropdown) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setShowStatusDropdown(true);
        setFocusedStatusIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedStatusIndex(prev => Math.min(prev + 1, STATUS_OPTIONS.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedStatusIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedStatusIndex >= 0) {
          onFilterChange({ ...filters, status: STATUS_OPTIONS[focusedStatusIndex].value });
          setShowStatusDropdown(false);
        }
        break;
      case 'Escape':
        setShowStatusDropdown(false);
        break;
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await projectApi.getAllFiltered({ 
        status: filters.status, 
        search: filters.search 
      });
      
      if (!res.success || !res.data) {
        alert("Lỗi khi tải dữ liệu xuất bản: " + (res.error || "Không có dữ liệu"));
        return;
      }

      const projects = res.data;
      const headers = ['Mã dự án', 'Tên dự án', 'Chủ đầu tư', 'Giá trị HĐ (VND)', 'Loại', 'Trạng thái', 'Ngày bắt đầu', 'Ngày kết thúc'];
      const rows = projects.map(p => [
        p.id.slice(0, 8).toUpperCase(),
        p.name,
        p.investor || '---',
        p.contractValue || p.totalValue || 0,
        p.projectType || 'Dân dụng',
        STATUS_OPTIONS.find(s => s.value === p.status)?.label || p.status,
        p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '---',
        p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '---'
      ]);
      
      exportToCsv('ERP_Projects', headers, rows);
    } catch (error) {
      console.error("Export error:", error);
      alert("Đã xảy ra lỗi khi xuất file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveDatePreset('');
    onFilterChange({});
  };

  const hasActiveFilters = !!filters.status || !!filters.search || !!activeDatePreset;

  const selectedStatus = STATUS_OPTIONS.find(s => s.value === (filters.status || '')) || STATUS_OPTIONS[0];

  return (
    <>
      <AddProjectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      
      <div className="card-elevation p-4 mt-6">
        {/* Main filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search - Primary */}
          <div className="relative flex-1 min-w-[280px] max-w-[480px] group">
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
              placeholder="Tìm theo mã dự án, tên dự án, chủ đầu tư..." 
              className="erp-input w-full !pl-10 !pr-8 text-[13px]"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); onFilterChange({ ...filters, search: '' }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[var(--border)] mx-1 hidden md:block" />

          {/* Status Filter - Enterprise Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              onKeyDown={handleStatusKeyDown}
              className={`erp-input flex items-center gap-2.5 !w-auto min-w-[180px] cursor-pointer hover:border-blue-500/30 transition-all ${showStatusDropdown ? '!border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]' : ''}`}
            >
              <span className="text-base leading-none">{selectedStatus.icon}</span>
              <span className={`text-[12.5px] font-semibold ${selectedStatus.value ? selectedStatus.color : 'text-[var(--text-secondary)]'}`}>
                {selectedStatus.label}
              </span>
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-[var(--text-muted)] ml-auto transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown */}
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-[280px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-scale-up">
                <div className="px-3 py-2.5 border-b border-[var(--divider)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Trạng thái vận hành</div>
                </div>
                <div className="py-1.5 max-h-[320px] overflow-y-auto">
                  {STATUS_OPTIONS.map((opt, index) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onFilterChange({ ...filters, status: opt.value });
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all
                        ${focusedStatusIndex === index ? 'bg-blue-500/10' : 'hover:bg-[var(--secondary)]'}
                        ${filters.status === opt.value || (!filters.status && !opt.value) ? 'bg-blue-500/5' : ''}
                      `}
                    >
                      <span className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm ${opt.bg || 'bg-[var(--secondary)]'}`}>
                        {opt.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12.5px] font-semibold ${opt.value ? opt.color : 'text-[var(--text-primary)]'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] opacity-60 mt-0.5">
                          {STATUS_DESCRIPTIONS[opt.value]}
                        </div>
                      </div>
                      {(filters.status === opt.value || (!filters.status && !opt.value)) && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Preset Chips */}
          <div className="hidden lg:flex items-center gap-1.5 ml-1">
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 opacity-50">Khởi công</span>
            {DATE_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => setActiveDatePreset(activeDatePreset === preset.value ? '' : preset.value)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider
                  ${activeDatePreset === preset.value 
                    ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters}
                className="erp-btn text-[var(--text-muted)] hover:text-rose-400 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 gap-1.5 px-3 text-[10px]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" />
                </svg>
                <span className="uppercase tracking-wider font-bold">Xóa lọc</span>
              </button>
            )}

            <button 
              onClick={handleExportExcel} 
              disabled={isExporting}
              className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-emerald-500/30 hover:bg-emerald-500/5 gap-1.5 px-3 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {isExporting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
