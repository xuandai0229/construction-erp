'use client';

import { DashboardData, formatDate, formatVnd } from './dashboard-data';

const statusLabel = {
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thi công',
  completed: 'Hoàn thành',
  on_hold: 'Tạm dừng',
};

export default function Header({ data }: { data: DashboardData }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#020617]/95 backdrop-blur">
      <div className="flex h-[74px] items-center justify-between px-6">
        <h1 className="text-[20px] font-bold tracking-wide text-slate-50">TỔNG QUAN DỰ ÁN</h1>
        <div className="flex items-center gap-4">
          <button className="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-100">
            20/06/2024
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v4M16 2v4M4 10h16M5 5h14v16H5z" />
            </svg>
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">AD</div>
          <div className="text-sm font-semibold text-slate-100">admin</div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
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
