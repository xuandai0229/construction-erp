'use client';
import React from 'react';

import { Project } from '@/app/types';

export default function ProjectCardStats({ projects }: { projects: Project[] }) {
  const total = projects.length;
  const inProgress = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completed = projects.filter(p => p.status === 'COMPLETED').length;
  const onHold = projects.filter(p => p.status === 'CANCELLED').length;
  const totalValue = projects.reduce((sum, p) => sum + (p.totalValue ?? 0), 0);

  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard 
        title="TỔNG SỐ DỰ ÁN" 
        value={total.toString()} 
        label="Dự án" 
        color="blue"
        icon={
          <>
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </>
        }
      />
      <StatCard 
        title="ĐANG THI CÔNG" 
        value={inProgress.toString()} 
        label="Dự án" 
        color="green"
        icon={<path d="M23 6l-9.5 9.5-5-5L1 18M23 6h-6M23 6v6"></path>}
      />
      <StatCard 
        title="HOÀN THÀNH" 
        value={completed.toString()} 
        label="Dự án" 
        color="purple"
        icon={
          <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </>
        }
      />
      <StatCard 
        title="TẠM DỪNG" 
        value={onHold.toString()} 
        label="Dự án" 
        color="yellow"
        icon={
          <>
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </>
        }
      />
      <StatCard 
        title="TỔNG GIÁ TRỊ HĐ" 
        value={totalValue.toLocaleString()} 
        label="VND" 
        color="red"
        icon={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>}
      />
    </div>
  );
}

interface StatCardProps { title: string; value: string; label: string; color: string; icon: React.ReactNode; }
function StatCard({ title, value, label, color, icon }: StatCardProps) {
  const styles = ({
    blue: 'from-[#0e1c3d] to-[#040914] border-[#1e3a8a] text-blue-400 icon-bg-blue',
    green: 'from-[#062c1b] to-[#021008] border-[#064e3b] text-emerald-400 icon-bg-green',
    purple: 'from-[#2e1045] to-[#12041c] border-[#4c1d95] text-purple-400 icon-bg-purple',
    yellow: 'from-[#3a2008] to-[#140b02] border-[#78350f] text-amber-400 icon-bg-yellow',
    red: 'from-[#3b1212] to-[#170505] border-[#7f1d1d] text-rose-400 icon-bg-red',
  } as Record<string, string>)[color as string] || 'from-slate-900/40 to-slate-900/80 border-slate-900/50 text-slate-400 icon-bg-slate';

  const iconStyles = ({
    blue: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
    purple: 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30',
    red: 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30',
  } as Record<string, string>)[color as string] || 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30';

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${styles} p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-${color}-900/30`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className={`text-[11px] font-bold uppercase tracking-wider ${styles.split(' ')[2]}`}>{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{value}</span>
          </div>
          <div className="text-xs text-slate-400">{label}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconStyles}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 opacity-10 transition-transform duration-500 group-hover:scale-125 group-hover:opacity-20">
        <svg viewBox="0 0 24 24" className="h-32 w-32" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            {icon}
        </svg>
      </div>
    </div>
  );
}

