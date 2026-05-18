'use client';

import React from 'react';
import { IntelligenceSnapshot, EnhancedFinancialAnomaly, ActionRecommendation } from '@/app/types/financial';
import { formatCurrency } from '@/lib/math';

interface Props {
  data: IntelligenceSnapshot;
  onAction?: (action: ActionRecommendation) => void;
  onAcknowledge?: (anomalyId: string) => void;
}

const healthStatusLabels: Record<string, string> = {
  STABLE: 'ỔN ĐỊNH',
  WARNING: 'CẢNH BÁO',
  CRITICAL: 'NGUY CƠ',
};

const anomalyTypeLabels: Record<string, string> = {
  COST_SPIKE: 'CHI PHÍ TĂNG VỌT',
  UNUSUAL_TRANSACTION: 'GIAO DỊCH BẤT THƯỜNG',
  BUDGET_OVERRUN: 'VƯỢT DỰ TOÁN',
  DATA_MISMATCH: 'SAI LỆCH DỮ LIỆU',
};

const urgencyLabels: Record<string, string> = {
  HIGH: 'KHẨN CẤP',
  MEDIUM: 'TRUNG BÌNH',
  LOW: 'THẤP',
};

export default function ExecutiveActionCockpit({ data, onAction, onAcknowledge }: Props) {
  if (!data) return null;

  const health = data.health || {
    score: 0,
    status: 'STABLE',
    components: { dataIntegrity: 0, reconciliation: 0, operationalStability: 0, budgetAdherence: 0 },
    lastUpdated: new Date()
  };
  const anomalies = data.anomalies || [];
  const reality = data.reality || { totalRevenue: 0, actualCost: 0, grossProfit: 0, grossMargin: 0 };
  const exposure = data.exposure || { totalCostExposure: 0, pendingCost: 0, budgetUtilization: 0, isOverBudget: false };

  const dataIntegrity = health.components?.dataIntegrity ?? 0;
  const grossMargin = Number(reality.grossMargin ?? 0);
  const budgetUtilization = Number(exposure.budgetUtilization ?? 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Decision Health Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-1 h-full ${getHealthColor(health.status)}`} />
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Sức khỏe Tài chính</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getHealthBadge(health.status)}`}>
              {healthStatusLabels[health.status] || health.status}
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">{health.score}</span>
            <span className="text-sm font-bold text-[var(--text-muted)] mb-1.5">/100</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getHealthColor(health.status)}`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        <div className="md:col-span-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMini label="Biên LN Thực tế" value={`${grossMargin.toFixed(1)}%`} sub="Thực tế thời gian thực" tone={grossMargin < 10 ? 'red' : 'green'} />
          <StatMini label="Sử dụng Ngân sách" value={`${budgetUtilization.toFixed(1)}%`} sub="so với tổng BOQ" tone={exposure.isOverBudget ? 'red' : 'blue'} />
          <StatMini label="Bất thường Hoạt động" value={anomalies.length.toString()} sub="Cần chú ý xử lý" tone={anomalies.length > 0 ? 'amber' : 'green'} />
          <StatMini label="Độ tin cậy Dữ liệu" value={`${dataIntegrity}%`} sub="Phân bổ Hạng mục WBS" tone="blue" />
        </div>
      </div>

      {/* 2. Critical Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Hàng đợi xử lý khẩn cấp</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">Đã sắp xếp theo mức độ ưu tiên</span>
          </div>

          {anomalies.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Không phát hiện bất thường khẩn cấp nào</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Các hoạt động vận hành nằm trong giới hạn an toàn xác định.</p>
            </div>
          ) : (
            anomalies.map(anomaly => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} onAction={onAction} onAcknowledge={onAcknowledge} />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Thông tin vận hành chuyên sâu</h3>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
            {(data.insights || []).map(insight => (
              <div key={insight.id} className="group cursor-default">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${insight.impact === 'NEGATIVE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-[11px] font-black text-[var(--text-primary)] leading-tight mb-1">{insight.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{insight.explanation}</p>
                    {insight.suggestion && (
                      <p className="mt-2 text-[9px] font-bold text-blue-500 border-l border-blue-500/30 pl-2">
                        {insight.suggestion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-b border-[var(--border-primary)] opacity-50 group-last:hidden" />
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Độ tin cậy Quyết định</p>
            <p className="text-2xl font-black tracking-tighter mb-4">Độ tin cậy Cao</p>
            <p className="text-[10px] leading-relaxed opacity-90">
              Các khuyến nghị được suy ra từ các ảnh chụp tài chính xác định và được đối chiếu với thực tế số liệu kế toán ERP chính thức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnomalyCard({ anomaly, onAction, onAcknowledge }: { anomaly: EnhancedFinancialAnomaly, onAction?: any, onAcknowledge?: any }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${anomaly.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none mb-1">
                {anomalyTypeLabels[anomaly.type] || anomaly.type}
              </p>
              <h4 className="text-sm font-black text-[var(--text-primary)] leading-tight">{anomaly.message}</h4>
            </div>
          </div>
          <button
            onClick={() => onAcknowledge?.(anomaly.id)}
            className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Đã ghi nhận
          </button>
        </div>

        {anomaly.rootCause && (
          <div className="mb-5 bg-[var(--bg-tertiary)]/50 rounded-xl p-4 border border-[var(--border-primary)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">Phân tích Nguyên nhân Gốc rễ</span>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">{anomaly.rootCause.driver}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-3">
              {anomaly.rootCause.explanation}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-0.5">Tác động Vận hành</p>
                <p className="text-[10px] font-bold text-rose-500/80 leading-tight">{anomaly.rootCause.operationalImpact}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-0.5">Tác động Tài chính</p>
                <p className="text-[10px] font-bold text-rose-500/80 leading-tight">{anomaly.rootCause.financialImpact}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Hành động gợi ý</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(anomaly.recommendations || []).map(rec => (
              <div key={rec.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500/50 rounded-xl p-4 transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${getUrgencyStyle(rec.urgency)}`}>
                    {urgencyLabels[rec.urgency] || rec.urgency}
                  </span>
                  <span className="text-[9px] font-bold text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-[11px] font-black text-[var(--text-primary)] mb-1">{rec.title}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-snug mb-3">{rec.description}</p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onAction?.(rec)}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Thực thi Hành động
                  </button>
                  <div className="flex items-center gap-1 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-bold">{rec.confidenceLevel}% Tin cậy</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, sub, tone }: { label: string, value: string, sub: string, tone: string }) {
  const colorMap: any = {
    red: 'text-rose-500',
    green: 'text-emerald-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500'
  };
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className={`text-xl font-black tracking-tight ${colorMap[tone] || 'text-[var(--text-primary)]'}`}>{value}</p>
      <p className="text-[9px] font-medium text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function getHealthColor(status: string) {
  if (status === 'CRITICAL') return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
  if (status === 'WARNING') return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
  return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
}

function getHealthBadge(status: string) {
  if (status === 'CRITICAL') return 'bg-rose-500/10 text-rose-500';
  if (status === 'WARNING') return 'bg-amber-500/10 text-amber-500';
  return 'bg-emerald-500/10 text-emerald-500';
}

function getUrgencyStyle(urgency: string) {
  if (urgency === 'HIGH') return 'bg-rose-500/10 text-rose-500';
  if (urgency === 'MEDIUM') return 'bg-amber-500/10 text-amber-500';
  return 'bg-blue-500/10 text-blue-500';
}
