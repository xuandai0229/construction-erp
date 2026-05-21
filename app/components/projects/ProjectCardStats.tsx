'use client';
import React from 'react';
import { Project } from '@/app/types';

export default function ProjectCardStats({ stats, totalCount }: { stats: any, totalCount: number }) {
  const inProgress = stats?.inProgress || 0;
  const completed  = stats?.completed || 0;
  const onHold     = stats?.cancelled || 0;
  const totalValue = stats?.totalValue || 0;

  const kpis = [
    {
      title: 'Tổng số dự án', value: totalCount.toString(), label: 'Dự án',
      accent: 'text-blue-400', gradientFrom: 'from-blue-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-blue-500/20',
      icon: <><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    },
    {
      title: 'Đang thi công', value: inProgress.toString(), label: 'Dự án',
      accent: 'text-emerald-400', gradientFrom: 'from-emerald-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-emerald-500/20',
      icon: <path d="M23 6l-9.5 9.5-5-5L1 18M23 6h-6M23 6v6" />,
    },
    {
      title: 'Hoàn thành', value: completed.toString(), label: 'Dự án',
      accent: 'text-green-400', gradientFrom: 'from-green-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-green-500/20',
      icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    },
    {
      title: 'Tạm dừng', value: onHold.toString(), label: 'Dự án',
      accent: 'text-amber-400', gradientFrom: 'from-amber-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-amber-500/20',
      icon: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
    },
    {
      title: 'Tổng giá trị HĐ', value: totalValue.toLocaleString(), label: 'VND',
      accent: 'text-purple-400', gradientFrom: 'from-purple-500/8', gradientTo: 'to-transparent',
      ringColor: 'ring-purple-500/20',
      icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
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
