'use client';

import { useState } from 'react';
import { projectApi } from '@/services/api/project.api';
import AddProjectModal from '@/app/components/modals/AddProjectModal';
import { exportToCsv } from '@/app/services/export.service';

interface ProjectFiltersProps {
  filters: {
    status?: string;
    search?: string;
  };
  onFilterChange: (filters: { status?: string; search?: string }) => void;
}

const statusMap: Record<string, string> = {
  'Tất cả': '',
  'Đang thi công': 'IN_PROGRESS',
  'Đang vận hành': 'ACTIVE',
  'Hoàn thành': 'COMPLETED',
  'Tạm dừng': 'CANCELLED',
  'Đã đóng': 'CLOSED',
  'Lưu trữ': 'ARCHIVED'
};

const reverseStatusMap: Record<string, string> = Object.entries(statusMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

export default function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        reverseStatusMap[p.status] || p.status,
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

  return (
    <>
      <AddProjectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      
      <div className="card-elevation p-4 mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Tìm kiếm hồ sơ</label>
            <div className="relative flex items-center group">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none z-10">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)] opacity-60 group-focus-within:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                placeholder="Mã dự án, tên dự án, CĐT..." 
                className="erp-input w-[340px] !pl-12 text-[13px] shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Trạng thái</label>
            <div className="relative flex items-center">
              <select 
                className="erp-input w-[140px] pr-8 appearance-none bg-[var(--secondary)] cursor-pointer text-[12.5px] font-medium"
                value={reverseStatusMap[filters.status || ''] || 'Tất cả'}
                onChange={(e) => onFilterChange({ ...filters, status: statusMap[e.target.value] })}
              >
                {Object.keys(statusMap).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--text-muted)] opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Khoảng thời gian</label>
            <div className="flex items-center gap-2">
              <FilterDate />
              <span className="text-[var(--text-muted)] opacity-30">—</span>
              <FilterDate />
            </div>
          </div>
        </div>

        <div className="flex items-end pb-0.5">
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting}
            className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] gap-2 transition-all px-4 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isExporting ? 'Đang chuẩn bị...' : 'Xuất Excel'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

function FilterDate() {
  return (
    <div className="relative flex items-center">
      <input 
        type="date" 
        className="erp-input w-[130px] bg-[var(--secondary)] text-[var(--text-primary)] text-[12.5px] font-medium [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
      />
    </div>
  );
}
