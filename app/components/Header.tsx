'use client';

import { useState } from 'react';
import { DashboardData, formatDate, formatVnd } from './dashboard-data';
import AddCostModal from '@/app/components/modals/AddCostModal';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import AddInvoiceModal from '@/app/components/modals/AddInvoiceModal';

import { useERPStore } from '@/store/erpStore';

const statusLabel: Record<string, string> = {
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thi công',
  completed: 'Hoàn thành',
  on_hold: 'Tạm dừng',
};

export default function Header({ data: propData }: { data?: DashboardData }) {
  const [showCostModal, setShowCostModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  const projects = useERPStore(state => state.projects);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const userRole = useERPStore(state => state.userRole);
  const getDashboardData = useERPStore(state => state.getDashboardData);

  const data = propData || getDashboardData();

  return (
    <>
    <AddCostModal isOpen={showCostModal} onClose={() => setShowCostModal(false)} />
    <AddBudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
    <AddRevenueModal isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} />
    <AddInvoiceModal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#020617]/95 backdrop-blur">
      <div className="flex h-[74px] items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-[20px] font-bold tracking-wide text-slate-50">TỔNG QUAN DỰ ÁN</h1>
          <div className="h-6 w-px bg-slate-800" />
          <select 
            value={currentProjectId}
            onChange={(e) => setCurrentProject(e.target.value)}
            className="bg-transparent text-[14px] font-bold text-blue-400 outline-none cursor-pointer hover:text-blue-300"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRevenueModal(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-green-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-green-500 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Doanh thu
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
            Hóa đơn
          </button>
          <button
            onClick={() => setShowCostModal(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-500 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Chi phí
          </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-purple-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Dự toán
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <button className="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-100">
            20/06/2024
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v4M16 2v4M4 10h16M5 5h14v16H5z" />
            </svg>
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white uppercase">
            {useERPStore.getState().userRole.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-slate-100">User</div>
            <div className="text-[10px] font-bold uppercase text-blue-400 leading-none">
              {userRole}
            </div>
          </div>
          <button 
            onClick={() => {
              import('@/app/utils/supabase').then(({ supabase }) => {
                supabase.auth.signOut().then(() => window.location.reload());
              });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Đăng xuất"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mx-6 mb-5 grid grid-cols-[180px_minmax(0,1fr)_420px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
        <div className="h-[142px] bg-[linear-gradient(135deg,#1d4ed8,#0f172a_55%,#f59e0b)] p-4">
          <div className="h-full rounded-md border border-white/15 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.45),transparent_20%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(0,0,0,.25))] p-4">
            <div className="mt-5 h-16 border-l-4 border-blue-200 pl-2">
              <div className="h-full w-24 bg-slate-200/80 shadow-lg shadow-black/30" />
            </div>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-slate-50">{data.project.name}</h2>
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">{statusLabel[data.project.status]}</span>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-8">
            <Info label="Chủ đầu tư" value={data.project.investor} />
            <Info label="Tổng giá trị hợp đồng" value={`${formatVnd(data.project.total_value)} VND`} />
            <Info label="Thời gian thực hiện" value={`${formatDate(data.project.start_date)} - ${formatDate(data.project.end_date)}`} />
          </div>
        </div>
        <div className="border-l border-slate-800 px-5 py-9">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-100">Tiến độ tổng thể</span>
            <span className="text-xl font-extrabold text-green-400">{data.progress}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${data.progress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 text-xs text-slate-400">
            <span>Ngày bắt đầu: {formatDate(data.project.start_date)}</span>
            <span>Ngày kết thúc dự kiến: {formatDate(data.project.end_date)}</span>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-50">{value}</div>
    </div>
  );
}
