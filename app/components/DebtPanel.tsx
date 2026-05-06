'use client';

import { DashboardData, DebtSummary, formatVnd } from './dashboard-data';

export default function DebtPanel({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-[15px] font-extrabold text-slate-50">CÔNG NỢ</h3>
      <div className="grid grid-cols-2 gap-4">
        <DebtCard title="PHẢI THU (KHÁCH HÀNG)" data={data.receivable} labels={['Tổng phải thu', 'Đã thu', 'Còn lại', 'Quá hạn']} />
        <DebtCard title="PHẢI TRẢ (NHÀ CUNG CẤP)" data={data.payable} labels={['Tổng phải trả', 'Đã trả', 'Còn lại', 'Quá hạn']} />
      </div>
    </section>
  );
}

function DebtCard({ title, data, labels }: { title: string; data: DebtSummary; labels: string[] }) {
  const rows = [
    { label: labels[0], value: data.total, color: 'bg-blue-500', text: 'text-slate-100' },
    { label: labels[1], value: data.paid, color: 'bg-green-500', text: 'text-slate-100' },
    { label: labels[2], value: data.remaining, color: 'bg-yellow-500', text: 'text-yellow-300' },
    { label: labels[3], value: data.overdue, color: 'bg-red-500', text: 'text-red-400' },
  ];

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <h4 className="mb-4 text-sm font-extrabold text-slate-100">{title}</h4>
      <div className="space-y-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-300"><i className={`h-2.5 w-2.5 rounded-full ${row.color}`} />{row.label}</span>
            <span className={`font-extrabold ${row.text}`}>{formatVnd(row.value)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

