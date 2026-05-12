'use client';

export default function WBSActions({ onAdd, onExport }: { onAdd: () => void; onExport?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onAdd}
          className="erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/20 gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm hạng mục
        </button>

        <button
          onClick={onAdd}
          className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm mục con
        </button>

        <button
          className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          </svg>
          Tải lại
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Hiển thị</span>
          <select className="erp-input h-8 px-2 text-[12px] w-auto">
            <option>Tất cả</option>
            <option>Chỉ mục cha</option>
            <option>Đang thi công</option>
          </select>
        </div>

        <button
          onClick={onExport}
          className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Xuất Excel
        </button>
      </div>
    </div>
  );
}
