'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddWBSModal from '@/app/components/modals/AddWBSModal';
import { formatVnd } from '@/app/components/dashboard-data';

export default function WBSListScreen() {
  const [collapsed, setCollapsed] = useState(false);
  const init = useERPStore(state => state.init);
  const getWBSTreeWithCost = useERPStore(state => state.getWBSTreeWithCost);
  const wbsItems = useERPStore(state => state.wbs);
  const budgets = useERPStore(state => state.budgets);
  const costs = useERPStore(state => state.costs);
  const isInitialized = useERPStore(state => state.initialized);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingWBS, setEditingWBS] = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const { tree: rawTree, stats } = useMemo(() => {
    if (!isInitialized) return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };
    return getWBSTreeWithCost();
  }, [wbsItems, budgets, costs, isInitialized, getWBSTreeWithCost]);

  const tree = useMemo(() => {
    const applyExpanded = (nodes: EnrichedWBSNode[]): EnrichedWBSNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: expandedIds.has(node.id) || (node.level === 0 && !expandedIds.has('initialized')),
        children: applyExpanded(node.children)
      }));
    };
    return applyExpanded(rawTree);
  }, [rawTree, expandedIds]);

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add('initialized');
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ml = collapsed ? 'var(--sidebar-width-sm)' : 'var(--sidebar-width)';

  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="erp-main" style={{ marginLeft: ml }}>
          <Header title="Hạng mục WBS" />
          <main className="erp-content grid place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="erp-main" style={{ marginLeft: ml }}>
        <Header title="Cấu trúc Hạng mục (WBS)" />
        <main className="erp-content space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="kpi-card">
              <div className="t-kpi-label">Tổng số hạng mục</div>
              <div className="t-kpi-value">{stats.totalItems}</div>
            </div>
            <div className="kpi-card">
              <div className="t-kpi-label">Tổng ngân sách</div>
              <div className="t-kpi-value" style={{ color: 'var(--info)' }}>{formatVnd(stats.totalBudget)} ₫</div>
            </div>
            <div className="kpi-card">
              <div className="t-kpi-label">Thực tế đã dùng</div>
              <div className="t-kpi-value" style={{ color: stats.totalActual > stats.totalBudget ? 'var(--danger)' : 'var(--success)' }}>
                {formatVnd(stats.totalActual)} ₫
              </div>
            </div>
            <div className="kpi-card">
              <div className="t-kpi-label">Tiến độ chi phí</div>
              <div className="t-kpi-value">{stats.progress.toFixed(1)}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="t-section-title">Danh sách hạng mục dự án</div>
            <button 
              onClick={() => setIsAddingWBS(true)}
              className="btn btn-primary"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm hạng mục mới
            </button>
          </div>

          {/* WBS Table */}
          <div className="erp-card">
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Tên hạng mục</th>
                    <th className="text-right">Ngân sách</th>
                    <th className="text-right">Thực tế</th>
                    <th className="text-right">Chênh lệch</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(tree, handleToggleExpand, setEditingWBS)}
                </tbody>
              </table>
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

function renderTree(nodes: EnrichedWBSNode[], onToggle: (id: string) => void, onEdit: (item: any) => void): React.ReactNode {
  return nodes.map(node => (
    <React.Fragment key={node.id}>
      <tr>
        <td style={{ paddingLeft: `${node.level * 24 + 12}px` }}>
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <button onClick={() => onToggle(node.id)} className="text-slate-500 hover:text-white">
                <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
            {node.children.length === 0 && <div className="w-4" />}
            <span className="font-medium text-slate-200">{node.name}</span>
          </div>
        </td>
        <td className="text-right font-semibold text-blue-400">{formatVnd(node.budget)} ₫</td>
        <td className="text-right font-semibold text-emerald-400">{formatVnd(node.actual)} ₫</td>
        <td className="text-right" style={{ color: node.variance < 0 ? 'var(--danger)' : 'var(--success)' }}>
          {formatVnd(node.variance)} ₫
        </td>
        <td className="text-center">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(node)}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </td>
      </tr>
      {node.isExpanded && renderTree(node.children, onToggle, onEdit)}
    </React.Fragment>
  ));
}

import React from 'react';
