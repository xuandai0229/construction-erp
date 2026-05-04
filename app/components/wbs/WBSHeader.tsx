'use client';

import { useERPStore } from '@/store/erpStore';

export default function WBSHeader() {
  const projects = useERPStore(state => state.projects);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const statusLabels: Record<string, string> = {
    PLANNED: 'Lập kế hoạch',
    IN_PROGRESS: 'Đang thi công',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Tạm dừng/Hủy',
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#020617]/95 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-[20px] font-bold uppercase tracking-wide text-slate-50">Hạng mục công trình (WBS)</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={currentProjectId}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 transition-colors hover:bg-slate-800 text-[13px] font-bold text-slate-200 appearance-none pr-10 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            {currentProject && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                currentProject.status === 'IN_PROGRESS' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                currentProject.status === 'COMPLETED' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              }`}>
                {statusLabels[currentProject.status] || currentProject.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 self-start mt-1">
          <div className="relative">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm hạng mục..." 
              className="h-9 w-[280px] rounded-md border border-slate-800 bg-slate-900/50 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            20/06/2024
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v4M16 2v4M4 10h16M5 5h14v16H5z" />
            </svg>
          </button>
          <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
            <div className="relative cursor-pointer hover:text-white text-slate-400 transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shadow-red-500/50">5</div>
            </div>
            <div className="flex cursor-pointer items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900/80 text-sm font-bold text-blue-200 ring-2 ring-blue-500/20">
                AD
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-slate-200 leading-tight">admin</span>
                <span className="text-[11px] text-slate-500">Quản trị viên</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

