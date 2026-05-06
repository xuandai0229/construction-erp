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
  const isOverBudget = variance < 0; 
  
  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard 
        title="Tổng số hạng mục" 
        value={totalItems.toLocaleString()} 
        label="Hạng mục" 
        color="blue"
        icon={
          <>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </>
        }
      />
      <StatCard 
        title="Tổng dự toán" 
        value={totalBudget.toLocaleString()} 
        label="VND" 
        color="green"
        icon={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
      />
      <StatCard 
        title="Tổng chi phí thực tế" 
        value={totalActual.toLocaleString()} 
        label="VND" 
        color="red"
        icon={
          <>
            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </>
        }
      />
      <StatCard 
        title="Chênh lệch" 
        value={variance.toLocaleString()} 
        label="VND" 
        color="red"
        icon={<path d="M23 18l-9.5-9.5-5 5L1 6" />}
      />
      <StatCard 
        title="% hoàn thành TB" 
        value={`${progress.toFixed(0)}%`} 
        label="Hoàn thành" 
        color="yellow"
        icon={<path d="M21.21 15.89A10 10 0 1 1 8 2.83" />}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, label, color, icon }: StatCardProps) {
  const styles = ({
    blue: 'from-[#0e1c3d] to-[#040914] border-[#1e3a8a] text-blue-400',
    green: 'from-[#062c1b] to-[#021008] border-[#064e3b] text-emerald-400',
    red: 'from-[#3b1212] to-[#170505] border-[#7f1d1d] text-rose-400',
    yellow: 'from-[#3a2008] to-[#140b02] border-[#78350f] text-amber-400',
  } as Record<string, string>)[color] || 'from-slate-900/40 to-slate-900/80 border-slate-900/50 text-slate-400';

  const iconStyles = ({
    blue: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
    red: 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30',
  } as Record<string, string>)[color] || 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30';

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${styles} p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-${color}-900/30`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className={`text-[12px] font-semibold text-slate-400`}>{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-bold text-white tracking-tight">{value}</span>
          </div>
          <div className="text-[11px] text-slate-500">{label}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconStyles}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 opacity-[0.03] transition-transform duration-500 group-hover:scale-125 group-hover:opacity-10">
        <svg viewBox="0 0 24 24" className="h-32 w-32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {icon}
        </svg>
      </div>
    </div>
  );
}

