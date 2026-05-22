'use client';
import React from 'react';

interface WBSStatsProps {
  totalItems: number;
  totalBudget: number;
  totalActual: number;
  variance: number;
  progress: number;
}

export default function WBSStats({ totalItems, totalBudget, totalActual, variance, progress }: WBSStatsProps) {
  const kpis = [
    {
      title: 'Tổng hạng mục', value: totalItems.toLocaleString(), label: 'Hạng mục',
      accent: 'text-blue-400', gradientFrom: 'from-blue-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-blue-500/20',
      icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
    },
    {
      title: 'Tổng dự toán', value: totalBudget.toLocaleString(), label: 'VNĐ',
      accent: 'text-emerald-400', gradientFrom: 'from-emerald-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-emerald-500/20',
      icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    },
    {
      title: 'Chi phí thực tế', value: totalActual.toLocaleString(), label: 'VNĐ',
      accent: 'text-rose-400', gradientFrom: 'from-rose-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-rose-500/20',
      icon: <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />,
    },
    {
      title: 'Chênh lệch', value: variance < 0 ? '' + variance.toLocaleString() : '+' + variance.toLocaleString(), label: 'VNĐ',
      accent: variance >= 0 ? 'text-emerald-400' : 'text-rose-400',
      gradientFrom: variance >= 0 ? 'from-emerald-500/8' : 'from-rose-500/8', gradientTo: 'to-transparent',
      ringColor: variance >= 0 ? 'ring-emerald-500/20' : 'ring-rose-500/20',
      icon: <path d="M23 18l-9.5-9.5-5 5L1 6" />,
    },
    {
      title: 'Tiến độ TB', value: `${progress.toFixed(1)}%`, label: 'Hoàn thành',
      accent: 'text-amber-400', gradientFrom: 'from-amber-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-amber-500/20',
      icon: <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.title} className="erp-kpi-card group relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradientFrom} ${kpi.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--secondary)] ring-1 ${kpi.ringColor} ${kpi.accent}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  {kpi.icon}
                </svg>
              </div>
            </div>
            <div className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 opacity-70">{kpi.title}</div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-2xl font-black tabular-nums tracking-tight ${kpi.accent}`}>{kpi.value}</span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase opacity-50">{kpi.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
