'use client';

import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddWBSModal from '@/app/components/modals/AddWBSModal';
import { formatVnd } from '@/app/components/dashboard-data';

const KPICard = ({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) => (
  <div style={{
    background: 'white', border: '1px solid var(--border)', borderRadius: '6px',
    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
    borderLeft: `3px solid ${color ?? 'var(--brand)'}`,
  }}>
    {icon && (
      <div style={{
        height: '36px', width: '36px', borderRadius: '6px', flexShrink: 0,
        background: color ? `${color}14` : 'rgba(37,99,235,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color ?? 'var(--brand)',
      }}>
        {icon}
      </div>
    )}
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{sub}</div>}
    </div>
  </div>
);

function WBSTreeRows({
  nodes,
  onToggle,
  onEdit,
}: {
  nodes: EnrichedWBSNode[];
  onToggle: (id: string) => void;
  onEdit: (item: WBSItem) => void;
}): React.ReactNode {
  return nodes.map(node => {
    const isParent  = node.children.length > 0;
    const pct       = node.budget > 0 ? Math.min(100, (node.actual / node.budget) * 100) : 0;
    const overBudget = node.actual > node.budget && node.budget > 0;

    return (
      <React.Fragment key={node.id}>
        <tr style={{ background: isParent ? '#F8FAFC' : 'white' }}>
          {/* Name */}
          <td style={{ paddingLeft: `${node.level * 22 + 12}px`, width: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isParent ? (
                <button
                  onClick={() => onToggle(node.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '18px', width: '18px', borderRadius: '3px', flexShrink: 0,
                    border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ height: '10px', width: '10px', transform: node.isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <div style={{ width: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-mid)' }} />
                </div>
              )}
              <span style={{
                fontSize: '13px',
                fontWeight: isParent ? 700 : 400,
                color: isParent ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {node.name}
              </span>
              {isParent && node.children.length > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: '3px' }}>
                  {node.children.length}
                </span>
              )}
            </div>
          </td>

          {/* Budget */}
          <td className="text-right text-money" style={{ color: 'var(--brand)', fontWeight: isParent ? 700 : 600 }}>
            {formatVnd(node.budget)}
          </td>

          {/* Actual */}
          <td className="text-right text-money" style={{ color: overBudget ? 'var(--danger)' : 'var(--success)', fontWeight: isParent ? 700 : 600 }}>
            {formatVnd(node.actual)}
          </td>

          {/* Variance */}
          <td className="text-right text-money" style={{ color: node.variance < 0 ? 'var(--danger)' : 'var(--success)' }}>
            {node.variance >= 0 ? '+' : ''}{formatVnd(node.variance)}
          </td>

          {/* Progress Bar */}
          <td style={{ width: '130px', padding: '0 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ height: '5px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: '3px',
                  background: overBudget ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: overBudget ? 'var(--danger)' : 'var(--text-secondary)', textAlign: 'right' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          </td>

          {/* Status */}
          <td style={{ textAlign: 'center' }}>
            {overBudget ? (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--danger)', background: 'rgba(220,38,38,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Vượt NS
              </span>
            ) : pct > 80 ? (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)', background: 'rgba(217,119,6,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Cảnh báo
              </span>
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)', background: 'rgba(22,163,74,0.08)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Bình thường
              </span>
            )}
          </td>

          {/* Actions */}
          <td style={{ textAlign: 'center' }}>
            <button
              onClick={() => onEdit(node as unknown as WBSItem)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '26px', width: '26px', borderRadius: '4px',
                border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <svg viewBox="0 0 24 24" style={{ height: '12px', width: '12px' }} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </td>
        </tr>

        {/* Recursive children */}
        {node.isExpanded && (
          <WBSTreeRows nodes={node.children} onToggle={onToggle} onEdit={onEdit} />
        )}
      </React.Fragment>
    );
  });
}

export default function WBSListScreen() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingWBS, setEditingWBS] = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);

  const init             = useERPStore(s => s.init);
  const getWBSTreeWithCost = useERPStore(s => s.getWBSTreeWithCost);
  const wbsItems         = useERPStore(s => s.wbs);
  const budgets          = useERPStore(s => s.budgets);
  const costs            = useERPStore(s => s.costs);
  const isInit           = useERPStore(s => s.initialized);

  useEffect(() => { init(); }, [init]);

  const { tree: rawTree, stats } = useMemo(() => {
    if (!isInit) return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };
    return getWBSTreeWithCost();
  }, [wbsItems, budgets, costs, isInit, getWBSTreeWithCost]);

  const tree = useMemo(() => {
    const applyExpanded = (nodes: EnrichedWBSNode[]): EnrichedWBSNode[] =>
      nodes.map(node => ({
        ...node,
        isExpanded: expandedIds.has(node.id) || (node.level === 0 && !expandedIds.has('__initialized__')),
        children: applyExpanded(node.children),
      }));
    return applyExpanded(rawTree);
  }, [rawTree, expandedIds]);

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add('__initialized__');
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll  = () => { const ids = new Set<string>(['__initialized__']); wbsItems.forEach(w => ids.add(w.id)); setExpandedIds(ids); };
  const collapseAll = () => setExpandedIds(new Set(['__initialized__']));

  const overBudgetCount = useMemo(() => {
    const flat = (nodes: EnrichedWBSNode[]): EnrichedWBSNode[] => nodes.flatMap(n => [n, ...flat(n.children)]);
    return flat(rawTree).filter(n => n.actual > n.budget && n.budget > 0).length;
  }, [rawTree]);

  if (!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`erp-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Hạng mục WBS" />
        <main className="erp-content"><div className="erp-card h-64 skeleton" /></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`erp-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Cấu trúc Hạng mục (WBS)" />

        <main className="erp-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Work Breakdown Structure</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Phân cấp hạng mục công trình — Ngân sách & Chi phí thực tế
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setIsAddingWBS(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px',
                  background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <svg viewBox="0 0 24 24" style={{ height: '14px', width: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm hạng mục
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <KPICard
              label="Tổng hạng mục" value={String(stats.totalItems)} sub="Toàn bộ WBS"
              color="var(--brand)"
              icon={<svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            />
            <KPICard
              label="Ngân sách" value={`${(stats.totalBudget / 1e9).toFixed(2)} tỷ`} sub="VND"
              color="var(--brand)"
              icon={<svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M9 3h6v4H9V3zM5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <KPICard
              label="Thực tế đã dùng" value={`${(stats.totalActual / 1e9).toFixed(2)} tỷ`} sub="VND"
              color={stats.totalActual > stats.totalBudget ? 'var(--danger)' : 'var(--success)'}
              icon={<svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>}
            />
            <KPICard
              label="Chênh lệch NS" value={`${Math.abs(stats.variance / 1e6).toFixed(0)} tr`}
              sub={stats.variance >= 0 ? 'Còn dư' : 'Vượt NS'} color={stats.variance >= 0 ? 'var(--success)' : 'var(--danger)'}
              icon={<svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <KPICard
              label="Vượt ngân sách" value={String(overBudgetCount)} sub="hạng mục"
              color={overBudgetCount > 0 ? 'var(--danger)' : 'var(--success)'}
              icon={<svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
          </div>

          {/* Table Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Chi tiết hạng mục công trình ({stats.totalItems} hạng mục)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={expandAll}
                style={{ height: '30px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Mở rộng tất cả
              </button>
              <button
                onClick={collapseAll}
                style={{ height: '30px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Thu gọn tất cả
              </button>
            </div>
          </div>

          {/* WBS Table */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '280px' }}>Tên hạng mục</th>
                    <th className="text-right">Ngân sách (VND)</th>
                    <th className="text-right">Thực tế (VND)</th>
                    <th className="text-right">Chênh lệch (VND)</th>
                    <th style={{ width: '130px' }}>Tiến độ chi phí</th>
                    <th className="text-center" style={{ width: '100px' }}>Trạng thái</th>
                    <th className="text-center" style={{ width: '70px' }}>Sửa</th>
                  </tr>
                </thead>
                <tbody>
                  {rawTree.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                        Chưa có hạng mục WBS. Nhấn &quot;Thêm hạng mục&quot; để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    <WBSTreeRows nodes={tree} onToggle={handleToggle} onEdit={setEditingWBS} />
                  )}
                </tbody>

                {/* Summary Row */}
                {rawTree.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#F0F4FF', borderTop: '2px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        TỔNG CỘNG
                      </td>
                      <td className="text-right text-money" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                        {formatVnd(stats.totalBudget)}
                      </td>
                      <td className="text-right text-money" style={{ fontWeight: 700, color: stats.totalActual > stats.totalBudget ? 'var(--danger)' : 'var(--success)' }}>
                        {formatVnd(stats.totalActual)}
                      </td>
                      <td className="text-right text-money" style={{ fontWeight: 700, color: stats.variance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {stats.variance >= 0 ? '+' : ''}{formatVnd(stats.variance)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ height: '6px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${Math.min(100, stats.progress)}%`, borderRadius: '3px',
                              background: stats.totalActual > stats.totalBudget ? 'var(--danger)' : 'var(--brand)',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                            {stats.progress.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Bottom Analytics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Budget Utilization Card */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Phân bổ ngân sách</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top hạng mục</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rawTree.slice(0, 5).map(node => {
                  const pct = stats.totalBudget > 0 ? (node.budget / stats.totalBudget) * 100 : 0;
                  return (
                    <div key={node.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatVnd(node.budget)} VND</span>
                    </div>
                  );
                })}
                {rawTree.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Cost Burn Status */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tóm tắt ngân sách</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Tổng ngân sách', value: formatVnd(stats.totalBudget), color: 'var(--brand)' },
                  { label: 'Chi phí thực tế', value: formatVnd(stats.totalActual), color: stats.totalActual > stats.totalBudget ? 'var(--danger)' : 'var(--success)' },
                  { label: 'Số dư ngân sách', value: formatVnd(Math.abs(stats.variance)), color: stats.variance >= 0 ? 'var(--success)' : 'var(--danger)' },
                  { label: 'Tỉ lệ sử dụng', value: `${stats.progress.toFixed(1)}%`, color: stats.progress > 100 ? 'var(--danger)' : stats.progress > 80 ? 'var(--warning)' : 'var(--success)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      <AddWBSModal
        isOpen={isAddingWBS || !!editingWBS}
        onClose={() => { setIsAddingWBS(false); setEditingWBS(null); }}
        wbsItem={editingWBS}
      />
    </div>
  );
}
