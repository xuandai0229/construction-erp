
'use client';

import React from 'react';
import { formatVnd } from '../dashboard-data';

interface CockpitData {
  healthScore: number;
  activeAlerts: number;
  totalInvoiced: number;
  totalOverdue: number;
  atRiskProjects: number;
  topRisks: any[];
}

export default function ExecutiveCockpit({ data }: { data: CockpitData }) {
  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-600';
    if (score > 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Health Score Card */}
      <div className="card-elevation p-6 relative overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-blue-500/5 rounded-full" />
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Tình trạng vận hành</h3>
        <div className={`text-4xl font-bold ${getHealthColor(data.healthScore)} mb-1 tabular-nums`}>
          {data.healthScore}%
        </div>
        <p className="text-[10px] text-[var(--text-muted)] font-bold">Dựa trên {data.healthScore > 0 ? 24 : 0} chỉ số quản trị</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Hệ thống ổn định</span>
        </div>
      </div>

      {/* Financial Health Card */}
      <div className="card-elevation p-6 bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Dòng tiền & Công nợ</h3>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-[var(--text-muted)] mb-1 font-bold">Tổng nợ quá hạn</div>
            <div className="text-xl font-bold text-rose-600 tabular-nums">{formatVnd(data.totalOverdue)}</div>
          </div>
          <div className="w-full bg-[var(--secondary)] h-1 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full"
              style={{ width: `${Math.min(100, (data.totalOverdue / (data.totalInvoiced || 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Tỷ lệ nợ: {Math.round((data.totalOverdue / (data.totalInvoiced || 1)) * 100) || 0}%</span>
            <span className="text-rose-500">Mức báo động</span>
          </div>
        </div>
      </div>

      {/* Portfolio Risk Card */}
      <div className="card-elevation p-6 bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Rủi ro thi công</h3>
        <div className="text-3xl font-bold text-[var(--text-primary)] mb-1 tabular-nums">
          {data.atRiskProjects} <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Hạng mục rủi ro</span>
        </div>
        <div className="mt-4 space-y-2">
          {data.topRisks.length > 0 ? (
            data.topRisks.slice(0, 2).map((risk, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[var(--secondary)] p-2 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate max-w-[120px]">{risk.projectName}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${risk.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {risk.riskScore}/100
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest">Không có rủi ro ghi nhận</div>
          )}
        </div>
      </div>
    </div>
  );
}
