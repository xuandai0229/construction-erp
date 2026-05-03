'use client';

import { useState } from 'react';
import AddWBSModal from '@/app/components/modals/AddWBSModal';

export default function WBSActions() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
    <AddWBSModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowAddModal(true)} className="flex h-9 items-center gap-2 rounded bg-blue-600 px-3 text-[13px] font-semibold text-white shadow-sm shadow-blue-900/20 transition-all hover:bg-blue-500 active:scale-95">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm hạng mục
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex h-9 items-center gap-2 rounded border border-slate-700 bg-slate-800/80 px-3 text-[13px] font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white active:scale-95">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm hạng mục con
        </button>
        <button className="flex h-9 items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-3 text-[13px] font-semibold text-slate-400 transition-all hover:bg-slate-700 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Sửa
        </button>
        <button className="flex h-9 items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-3 text-[13px] font-semibold text-slate-400 transition-all hover:bg-slate-700 hover:text-rose-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Xóa
        </button>
        <button className="flex h-9 items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-3 text-[13px] font-semibold text-slate-400 transition-all hover:bg-slate-700 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          </svg>
          Tải lại
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Hiển thị</span>
          <div className="relative">
            <select className="h-9 appearance-none rounded border border-slate-700 bg-slate-800/50 py-0 pl-3 pr-8 text-[13px] font-medium text-slate-300 outline-none transition-colors focus:border-blue-500 focus:bg-slate-800 focus:ring-1 focus:ring-blue-500">
              <option>Tất cả</option>
              <option>Chỉ mục cha</option>
              <option>Đang thi công</option>
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <button className="flex h-9 items-center gap-2 rounded border border-slate-700 bg-slate-800/80 px-3 text-[13px] font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white active:scale-95">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Xuất Excel
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-slate-400 transition-all hover:bg-slate-700 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
    </>
  );
}

