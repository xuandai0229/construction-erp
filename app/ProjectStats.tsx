'use client';

import { formatCurrency } from './utils';

interface StatsData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  totalValue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subLabel: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}

function StatCard({
  title,
  value,
  subLabel,
  icon,
  gradient,
  trend,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg p-6 border border-[#334155] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer group ${gradient}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent"></div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#94a3b8] text-sm font-medium mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-[#e2e8f0]">{value}</h3>
            {trend && (
              <span className="text-green-400 text-sm font-semibold">{trend}</span>
            )}
          </div>
          <p className="text-[#64748b] text-xs mt-2">{subLabel}</p>
        </div>

        <div className="p-3 rounded-lg bg-white/10 text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ProjectStats({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-6 py-6 bg-[#020617]">
      <StatCard
        title="Tổng số dự án"
        value={stats.totalProjects}
        subLabel="Dự án"
        icon="📊"
        gradient="bg-gradient-to-br from-[#1e293b] to-[#0f172a] hover:from-[#334155] hover:to-[#1e293b]"
        trend="+2"
      />

      <StatCard
        title="Đang thi công"
        value={stats.activeProjects}
        subLabel="Dự án"
        icon="🔨"
        gradient="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 hover:from-emerald-900/60 hover:to-emerald-950/60"
        trend={`${Math.round((stats.activeProjects / stats.totalProjects) * 100)}%`}
      />

      <StatCard
        title="Hoàn thành"
        value={stats.completedProjects}
        subLabel="Dự án"
        icon="✅"
        gradient="bg-gradient-to-br from-blue-900/40 to-blue-950/40 hover:from-blue-900/60 hover:to-blue-950/60"
      />

      <StatCard
        title="Tạm dừng"
        value={stats.pausedProjects}
        subLabel="Dự án"
        icon="⏸️"
        gradient="bg-gradient-to-br from-amber-900/40 to-amber-950/40 hover:from-amber-900/60 hover:to-amber-950/60"
      />

      <StatCard
        title="Tổng giá trị"
        value={formatCurrency(stats.totalValue)}
        subLabel="Hợp đồng"
        icon="💰"
        gradient="bg-gradient-to-br from-rose-900/40 to-rose-950/40 hover:from-rose-900/60 hover:to-rose-950/60"
      />
    </div>
  );
}
