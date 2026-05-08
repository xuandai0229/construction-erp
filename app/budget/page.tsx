'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';

const KPICard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{
    background: 'white', border: '1px solid var(--border)', borderRadius: '6px',
    padding: '12px 16px', borderLeft: `3px solid ${color ?? 'var(--brand)'}`,
  }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '22px', fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1.2, marginTop: '3px' }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

function renderBudgetRows(nodes: any[], level = 0): React.ReactNode {
  return nodes.map(node => {
    const isParent  = node.children && node.children.length > 0;
    const variance  = node.budget - node.actual;
    const pct       = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
    const overBudget = node.actual > node.budget && node.budget > 0;

    return (
      <React.Fragment key={node.id}>
        <tr style={{ background: isParent ? '#F8FAFC' : 'white' }}>
          <td style={{ paddingLeft: `${level * 24 + 12}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {level === 0 ? (
                <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: 'var(--brand)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-mid)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: isParent ? 700 : 400, color: isParent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {node.name}
              </span>
            </div>
          </td>
          <td className="text-right text-money" style={{ color: 'var(--brand)', fontWeight: isParent ? 700 : 600 }}>
            {formatVnd(node.budget)}
          </td>
          <td className="text-right text-money" style={{ color: 'var(--brand)', fontWeight: isParent ? 700 : 400 }}>
            {formatVnd(node.budget)}
          </td>
          <td className="text-right text-money" style={{ color: overBudget ? 'var(--danger)' : 'var(--success)', fontWeight: isParent ? 700 : 600 }}>
            {formatVnd(node.actual)}
          </td>
          <td className="text-right text-money" style={{ color: variance < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: isParent ? 700 : 600 }}>
            {variance >= 0 ? '+' : ''}{formatVnd(variance)}
          </td>
          <td style={{ width: '130px', padding: '0 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ height: '5px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(120, pct)}%`, maxWidth: '100%', borderRadius: '3px',
                  background: overBudget ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)',
                }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: overBudget ? 'var(--danger)' : 'var(--text-secondary)', textAlign: 'right' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          </td>
          <td style={{ textAlign: 'center' }}>
            {overBudget ? (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--danger)', background: 'rgba(220,38,38,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>Vượt NS</span>
            ) : pct > 80 ? (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)', background: 'rgba(217,119,6,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>Cảnh báo</span>
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)', background: 'rgba(22,163,74,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>Ổn định</span>
            )}
          </td>
        </tr>
        {isParent && renderBudgetRows(node.children, level + 1)}
      </React.Fragment>
    );
  });
}

export default function BudgetPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const init               = useERPStore(s => s.init);
  const budgets            = useERPStore(s => s.budgets);
  const wbs                = useERPStore(s => s.wbs);
  const costs              = useERPStore(s => s.costs);
  const getWBSTreeWithCost = useERPStore(s => s.getWBSTreeWithCost);
  const isInit             = useERPStore(s => s.initialized);

  useEffect(() => { init(); }, [init]);

  const { tree, stats } = useMemo(() => getWBSTreeWithCost(), [budgets, wbs, costs, getWBSTreeWithCost]);

  // Aggregate metrics
  const totalBudget = stats.totalBudget;
  const totalActual = stats.totalActual;
  const variance    = totalBudget - totalActual;
  const utilPct     = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const overCount   = budgets.filter(b => {
    const actual = costs.filter(c => c.wbsId === b.wbsId).reduce((s, c) => s + c.amount, 0);
    return actual > b.estimatedAmount;
  }).length;

  // Cost category breakdown
  const categoryMap = costs.reduce((acc, c) => {
    acc[c.costType] = (acc[c.costType] ?? 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  if (!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Dự toán" />
        <main className="erp-content"><div className="erp-card h-64 skeleton" /></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Dự toán" />
        <main className="erp-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Dự toán & Kiểm soát Ngân sách</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                So sánh ngân sách kế hoạch — thực tế — phương sai
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsAdding(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px',
                  background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <svg viewBox="0 0 24 24" style={{ height: '14px', width: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm dự toán
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <KPICard label="Tổng NS kế hoạch" value={`${(totalBudget / 1e9).toFixed(2)} tỷ`} sub="VND" color="var(--brand)" />
            <KPICard label="Chi phí thực tế"  value={`${(totalActual / 1e9).toFixed(2)} tỷ`} sub="VND" color={totalActual > totalBudget ? 'var(--danger)' : 'var(--success)'} />
            <KPICard
              label="Số dư ngân sách"
              value={`${(Math.abs(variance) / 1e9).toFixed(2)} tỷ`}
              sub={variance >= 0 ? 'Còn dư' : 'Vượt ngân sách'}
              color={variance >= 0 ? 'var(--success)' : 'var(--danger)'}
            />
            <KPICard
              label="Tỉ lệ sử dụng"
              value={`${utilPct.toFixed(1)}%`}
              sub="Thực tế / Kế hoạch"
              color={utilPct > 100 ? 'var(--danger)' : utilPct > 80 ? 'var(--warning)' : 'var(--success)'}
            />
            <KPICard
              label="Hạng mục vượt NS"
              value={String(overCount)}
              sub={overCount > 0 ? 'Cần xem xét' : 'Đang kiểm soát'}
              color={overCount > 0 ? 'var(--danger)' : 'var(--success)'}
            />
          </div>

          {/* Overall Budget Progress */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tiến độ sử dụng ngân sách tổng thể</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>NS: <strong style={{ color: 'var(--brand)' }}>{formatVnd(totalBudget)}</strong></span>
                <span>TT: <strong style={{ color: totalActual > totalBudget ? 'var(--danger)' : 'var(--success)' }}>{formatVnd(totalActual)}</strong></span>
                <span>Chênh: <strong style={{ color: variance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{variance >= 0 ? '+' : ''}{formatVnd(variance)}</strong></span>
              </div>
            </div>
            <div style={{ height: '10px', background: 'var(--bg-muted)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, utilPct)}%`,
                borderRadius: '5px',
                background: utilPct > 100 ? 'var(--danger)' : utilPct > 80 ? 'var(--warning)' : 'var(--success)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span style={{ fontWeight: 700, color: utilPct > 100 ? 'var(--danger)' : 'var(--text-primary)' }}>{utilPct.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Main Table + Side Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
            {/* Budget Matrix Table */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Bảng dự toán chi tiết theo WBS</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{budgets.length} khoản mục</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="erp-table" style={{ minWidth: '750px' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '220px' }}>Hạng mục WBS</th>
                      <th className="text-right">Dự toán gốc</th>
                      <th className="text-right">Dự toán điều chỉnh</th>
                      <th className="text-right">Chi phí thực tế</th>
                      <th className="text-right">Chênh lệch</th>
                      <th style={{ width: '130px' }}>% Thực hiện</th>
                      <th className="text-center" style={{ width: '90px' }}>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                          Chưa có dự toán. Nhấn &quot;Thêm dự toán&quot; để tạo.
                        </td>
                      </tr>
                    ) : (
                      renderBudgetRows(tree)
                    )}
                  </tbody>
                  {tree.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#F0F4FF', borderTop: '2px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>TỔNG CỘNG</td>
                        <td className="text-right text-money" style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatVnd(totalBudget)}</td>
                        <td className="text-right text-money" style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatVnd(totalBudget)}</td>
                        <td className="text-right text-money" style={{ fontWeight: 700, color: totalActual > totalBudget ? 'var(--danger)' : 'var(--success)' }}>{formatVnd(totalActual)}</td>
                        <td className="text-right text-money" style={{ fontWeight: 700, color: variance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {variance >= 0 ? '+' : ''}{formatVnd(variance)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: utilPct > 100 ? 'var(--danger)' : 'var(--text-primary)' }}>{utilPct.toFixed(1)}%</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Side Panel: Cost Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Phân loại chi phí</span>
                </div>
                <div style={{ padding: '12px' }}>
                  {categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>Chưa có chi phí</div>
                  ) : (
                    categories.map(([cat, amt]) => {
                      const pct = totalActual > 0 ? (amt / totalActual) * 100 : 0;
                      return (
                        <div key={cat} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{cat}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: '2px' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatVnd(amt)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Budget Alerts */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Cảnh báo NS</span>
                </div>
                <div style={{ padding: '12px' }}>
                  {overCount === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px', background: 'rgba(22,163,74,0.08)' }}>
                      <svg viewBox="0 0 24 24" style={{ height: '16px', width: '16px', color: 'var(--success)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>Tất cả hạng mục trong ngân sách</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px', background: 'rgba(220,38,38,0.08)' }}>
                      <svg viewBox="0 0 24 24" style={{ height: '16px', width: '16px', color: 'var(--danger)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>{overCount} hạng mục vượt ngân sách</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
      <AddBudgetModal isOpen={isAdding} onClose={() => setIsAdding(false)} />
    </div>
  );
}
