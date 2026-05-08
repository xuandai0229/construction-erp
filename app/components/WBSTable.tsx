'use client';

import React from 'react';
import { DashboardData, formatVnd } from './dashboard-data';
import { useERPStore } from '@/store/erpStore';

export default function WBSTable({ data }: { data: DashboardData }) {
  const getWBSTreeWithCost = useERPStore(s => s.getWBSTreeWithCost);
  const { tree } = getWBSTreeWithCost();

  const totalBudget = tree.reduce((sum, node) => sum + node.budget, 0);
  const totalActual = tree.reduce((sum, node) => sum + node.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WBS - HẠNG MỤC VÀ DỰ TOÁN</h3>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none overflow-y-auto" style={{ maxHeight: '600px' }}>
        <table className="erp-table zebra">
          <thead>
            <tr>
              <th style={{ position: 'sticky', top: 0, zIndex: 30, background: '#F8FAFC', minWidth: '240px', paddingLeft: 'var(--sp-16)', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hạng mục</th>
              <th className="text-right" style={{ position: 'sticky', top: 0, zIndex: 30, background: '#F8FAFC', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dự toán (VND)</th>
              <th className="text-right" style={{ position: 'sticky', top: 0, zIndex: 30, background: '#F8FAFC', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thực tế (VND)</th>
              <th className="text-right" style={{ position: 'sticky', top: 0, zIndex: 30, background: '#F8FAFC', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chênh lệch</th>
              <th className="text-right" style={{ position: 'sticky', top: 0, zIndex: 30, background: '#F8FAFC', width: '60px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {tree.length > 0 ? renderRows(tree) : (
              <tr><td colSpan={5} style={{ height: '200px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF' }}>Không có dữ liệu.</td></tr>
            )}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 30, background: '#F8FAFC', borderTop: '1px solid var(--border)' }}>
            <tr style={{ height: '44px' }}>
              <td style={{ fontWeight: 800, color: '#111827', paddingLeft: 'var(--sp-16)', fontSize: '12px', textTransform: 'uppercase' }}>TỔNG CỘNG</td>
              <td className="text-right" style={{ fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>{formatVnd(totalBudget)}</td>
              <td className="text-right" style={{ fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>{formatVnd(totalActual)}</td>
              <td className="text-right" style={{ fontWeight: 800, color: totalVariance < 0 ? '#EF4444' : '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                {formatVnd(totalVariance)}
              </td>
              <td className="text-right" style={{ fontWeight: 800, color: '#2563eb', fontSize: '12px' }}>{Number.isFinite(totalPct) ? totalPct.toFixed(1) : '0'}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function renderRows(nodes: any[], level = 0): React.ReactNode {
  return nodes.map((node) => {
    const isParent = node.children && node.children.length > 0;
    const pct = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
    const variance = node.actual - node.budget;

    return (
      <React.Fragment key={node.id}>
        <tr className={isParent ? 'wbs-row-parent' : 'wbs-row-child'} style={{ height: '44px', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
          <td style={{ paddingLeft: `${level * 20 + 16}px`, fontSize: '12px' }}>
            <div className="flex items-center gap-2">
              {isParent ? (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m19 9-7 7-7-7" />
                </svg>
              ) : (
                <div className="h-1 w-1 rounded-full bg-gray-300" style={{ marginLeft: '4px' }} />
              )}
              <span className="truncate" style={{ fontWeight: isParent ? 700 : 400, color: isParent ? '#111827' : '#64748b' }}>{node.name}</span>
            </div>
          </td>
          <td className="text-right" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px', color: '#111827' }}>{formatVnd(node.budget)}</td>
          <td className="text-right" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px', color: '#111827' }}>{formatVnd(node.actual)}</td>
          <td className="text-right" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px', fontWeight: 600, color: variance > 0 ? '#EF4444' : '#64748b' }}>
            {formatVnd(variance)}
          </td>
          <td className="text-right" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px', fontWeight: 700, color: pct > 100 ? '#EF4444' : '#111827' }}>
            {Number.isFinite(pct) ? pct.toFixed(0) : '0'}%
          </td>
        </tr>
        {isParent && renderRows(node.children, level + 1)}
      </React.Fragment>
    );
  });
}
