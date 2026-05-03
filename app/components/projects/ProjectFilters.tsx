'use client';

import { useState } from 'react';
import AddProjectModal from '@/app/components/modals/AddProjectModal';

export default function ProjectFilters() {
  const [showAddModal, setShowAddModal] = useState(false);
  return (
    <>
    <AddProjectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên dự án, CĐT..." 
            className="h-9 w-[260px] rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <FilterSelect label="Trạng thái" options={['Tất cả', 'Đang thi công', 'Hoàn thành', 'Tạm dừng']} />
        <FilterSelect label="Chủ đầu tư" options={['Tất cả', 'Công ty ABC', 'Tập đoàn XYZ']} />
        <FilterSelect label="Loại dự án" options={['Tất cả', 'Cao ốc văn phòng', 'Khu căn hộ', 'Nhà máy']} />

        <div className="flex items-center gap-2">
          <FilterDate label="Ngày bắt đầu" />
          <span className="text-slate-600">-</span>
          <FilterDate label="Ngày kết thúc" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setShowAddModal(true)} className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40 active:scale-95">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm dự án
        </button>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white active:scale-95">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Xuất Excel
        </button>
      </div>
    </div>
    </>
  );
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-500">{label}</label>
      <div className="relative">
        <select className="h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 py-0 pl-3 pr-8 text-sm text-slate-300 outline-none transition-colors focus:border-blue-500 focus:bg-slate-800 focus:ring-1 focus:ring-blue-500">
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function FilterDate({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-500">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          placeholder="Chọn ngày"
          className="h-9 w-[130px] rounded-lg border border-slate-700 bg-slate-800/50 py-0 pl-3 pr-8 text-sm text-slate-300 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500 focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
    </div>
  );
}
