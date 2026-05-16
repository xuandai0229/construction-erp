
'use client';

import React from 'react';
import { formatVnd } from '../dashboard-data';

interface CockpitData {
  healthScore: number;
  activeAlerts: number;
  totalInvoiced: number;
  totalOverdue: number;
  atRiskProjects: number;
  topRisks: Array<{ projectName: string; riskScore: number; severity: string }>;
}

export default function ExecutiveCockpit({ data }: { data: CockpitData }) {
  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
      {/* Health Score Card */}
      <div className="erp-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-blue-600/[0.03] rounded-full group-hover:scale-110 transition-transform duration-700" />
        <h3 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          Chỉ số An toàn Vận hành
        </h3>
        <div className={`text-4xl font-black ${getHealthColor(data.healthScore)} mb-2 tracking-tighter tabular-nums`}>
          {data.healthScore}%
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-tight opacity-70">Tổng hợp từ {data.healthScore > 0 ? 24 : 0} chỉ số quản trị rủi ro</p>
        <div className="mt-6 flex items-center gap-2.5 px-3 py-1.5 bg-blue-500/5 rounded-xl border border-blue-500/10 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Hệ thống ổn định</span>
        </div>
      </div>

      {/* Financial Health Card */}
      <div className="erp-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-rose-600/[0.03] rounded-full group-hover:scale-110 transition-transform duration-700" />
        <h3 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          Dòng tiền & Công nợ
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] mb-1.5 font-bold uppercase tracking-tight opacity-70">Tổng nợ quá hạn (HĐ)</div>
            <div className="text-2xl font-black text-rose-500 tracking-tight tabular-nums">{formatVnd(data.totalOverdue)}</div>
          </div>
          <div className="w-full bg-[var(--secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]/10">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (data.totalOverdue / (data.totalInvoiced || 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
            <span>Tỷ lệ: {Math.round((data.totalOverdue / (data.totalInvoiced || 1)) * 100) || 0}%</span>
            <span className="text-rose-500 opacity-80">Mức độ rủi ro: Cao</span>
          </div>
        </div>
      </div>

      {/* Portfolio Risk Card */}
      <div className="erp-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-orange-600/[0.03] rounded-full group-hover:scale-110 transition-transform duration-700" />
        <h3 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          Rủi ro danh mục
        </h3>
        <div className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tighter tabular-nums">
          {data.atRiskProjects} <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] ml-1">Hạng mục báo động</span>
        </div>
        <div className="mt-5 space-y-2">
          {data.topRisks.length > 0 ? (
            data.topRisks.slice(0, 2).map((risk, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[var(--secondary)]/40 p-2.5 rounded-xl border border-[var(--border)] group-hover:border-orange-500/20 transition-colors shadow-sm">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate max-w-[140px] tracking-tight">{risk.projectName}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${risk.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                  {risk.riskScore}/100
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-[var(--text-tertiary)] text-[9.5px] font-black uppercase tracking-[0.15em] border border-dashed border-[var(--border)] rounded-xl opacity-40">Danh mục ổn định</div>
          )}
        </div>
      </div>
    </div>
  );
}
