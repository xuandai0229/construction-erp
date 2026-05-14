'use client';

import Header from '@/app/components/Header';

// ProjectsHeader reuses the shared Header component + renders action buttons inline.
// The old custom header (with hardcoded dark colors) has been replaced.
export default function ProjectsHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
          <h1 className="erp-section-title">Quản lý dự án thi công</h1>
          <p className="erp-section-subtitle">Danh sách dự án và điều phối thi công toàn hệ thống</p>
        </div>
        <button
          onClick={onAdd}
          className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 gap-2 px-5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm dự án mới
        </button>
      </div>
    </div>
  );
}
