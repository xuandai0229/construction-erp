'use client';

import { useState } from 'react';
import { useProjectsQuery } from '@/services/queries/useProjects';
import AddProjectModal from '@/app/components/modals/AddProjectModal';

export default function ProjectFilters() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];

  const handleExportExcel = () => {
    if (projects.length === 0) return;

    const headers = ['ID', 'Mã dự án', 'Tên dự án', 'Chủ đầu tư', 'Giá trị HĐ (VND)', 'Loại', 'Trạng thái'];
    const rows = projects.map(p => [
      p.id,
      p.id.slice(0, 8),
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.investor || '').replace(/"/g, '""')}"`,
      p.contractValue || p.totalValue || 0,
      `"${(p.projectType || '').replace(/"/g, '""')}"`,
      p.status
    ]);
    
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ERP_Projects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AddProjectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      
      <div className="card-elevation p-4 mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Tìm kiếm</label>
            <div className="relative flex items-center">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Tên dự án, CĐT..." 
                className="erp-input w-[280px] pl-9 text-[13px]"
              />
            </div>
          </div>

          <FilterSelect label="Trạng thái" options={['Tất cả', 'Đang thi công', 'Hoàn thành', 'Tạm dừng']} />
          <FilterSelect label="Chủ đầu tư" options={['Tất cả', 'Công ty ABC', 'Tập đoàn XYZ']} />
          <FilterSelect label="Loại dự án" options={['Tất cả', 'Cao ốc văn phòng', 'Khu căn hộ', 'Nhà máy']} />

          <div className="flex items-center gap-2">
            <FilterDate label="Ngày bắt đầu" />
            <span className="text-[var(--text-muted)] mt-6">-</span>
            <FilterDate label="Ngày kết thúc" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] gap-1.5 transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Xuất Excel
          </button>
          <button onClick={() => setShowAddModal(true)} className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 gap-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Thêm dự án
          </button>
        </div>
      </div>
    </>
  );
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative flex items-center">
        <select className="erp-input w-[130px] pr-8 appearance-none bg-[var(--table-head-bg)] cursor-pointer">
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function FilterDate({ label }: { label: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative flex items-center">
        <input 
          type="date" 
          className="erp-input w-[120px] bg-[var(--table-head-bg)] text-[var(--text-primary)] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>
    </div>
  );
}
