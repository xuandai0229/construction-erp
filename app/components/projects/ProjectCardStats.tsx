'use client';

export default function ProjectCardStats({ stats, totalCount }: { stats: any; totalCount: number }) {
  const inProgress = stats?.inProgress || 0;
  const completed = stats?.completed || 0;
  const onHold = stats?.cancelled || 0;
  const totalValue = stats?.totalValue || 0;
  const compactMoney = (value: number) => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} tỷ`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} tr`;
    }
    return value.toLocaleString();
  };

  const kpis = [
    {
      title: 'Tổng số dự án',
      value: totalCount.toString(),
      label: 'Dự án',
      accent: 'text-blue-400',
      ringColor: 'ring-blue-500/20',
      icon: <><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    },
    {
      title: 'Đang thi công',
      value: inProgress.toString(),
      label: 'Dự án',
      accent: 'text-emerald-400',
      ringColor: 'ring-emerald-500/20',
      icon: <path d="M23 6l-9.5 9.5-5-5L1 18M23 6h-6M23 6v6" />,
    },
    {
      title: 'Hoàn thành',
      value: completed.toString(),
      label: 'Dự án',
      accent: 'text-green-400',
      ringColor: 'ring-green-500/20',
      icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    },
    {
      title: 'Tạm dừng',
      value: onHold.toString(),
      label: 'Dự án',
      accent: 'text-amber-400',
      ringColor: 'ring-amber-500/20',
      icon: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
    },
    {
      title: 'Tổng giá trị HĐ',
      value: compactMoney(totalValue),
      fullValue: totalValue.toLocaleString(),
      label: 'VND',
      accent: 'text-purple-400',
      ringColor: 'ring-purple-500/20',
      icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {kpis.map(kpi => (
        <div key={kpi.title} className="erp-kpi-card group relative min-w-0 overflow-hidden">
          <div className="relative min-w-0">
            <div className="mb-3 flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-[var(--secondary)] ring-1 ${kpi.ringColor} ${kpi.accent}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  {kpi.icon}
                </svg>
              </div>
            </div>
            <div className="mb-1 truncate text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-70">{kpi.title}</div>
            <div className="flex min-w-0 items-baseline gap-1.5">
              <span className={`min-w-0 whitespace-nowrap text-[22px] font-black tabular-nums tracking-tight ${kpi.accent}`} title={(kpi as any).fullValue || kpi.value}>
                {kpi.value}
              </span>
              <span className="shrink-0 text-[9px] font-bold uppercase text-[var(--text-muted)] opacity-50">{kpi.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
