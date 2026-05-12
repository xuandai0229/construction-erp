'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import WBSHeader from '@/app/components/wbs/WBSHeader';
import WBSStats from '@/app/components/wbs/WBSStats';
import WBSActions from '@/app/components/wbs/WBSActions';
import WBSTable from '@/app/components/wbs/WBSTable';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddWBSModal from '@/app/components/modals/AddWBSModal';
import { useWBSQuery } from '@/services/queries/useWBS';

export default function WBSListScreen() {
  const currentProjectId   = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed   = useERPStore(state => state.sidebarCollapsed);

  const { data, isLoading } = useWBSQuery(currentProjectId);
  const rawTree = data?.tree || [];
  const flatWbs = data?.flat || [];

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingWBS,  setEditingWBS]  = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);

  const stats = useMemo(() => {
    let totalBudget = 0;
    let totalActual = 0;
    rawTree.forEach((node: any) => {
      totalBudget += node.budget || 0;
      totalActual += node.actual || 0;
    });
    const variance = totalBudget - totalActual;
    const progress = totalBudget > 0 ? Math.min(100, (totalActual / totalBudget) * 100) : 0;
    return {
      totalItems: flatWbs.length,
      totalBudget,
      totalActual,
      variance,
      progress
    };
  }, [rawTree, flatWbs]);

  const tree = useMemo(() => {
    const applyExpanded = (nodes: any[]): EnrichedWBSNode[] =>
      nodes.map(node => ({
        ...node,
        isExpanded: expandedIds.has(node.id) || (node.level === 0 && !expandedIds.has('initialized')),
        children: applyExpanded(node.children || []),
      }));
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

  const handleExport = () => {
    if (flatWbs.length === 0) return;
    const headers = ['Mã', 'Tên hạng mục', 'Ngân sách', 'Thực tế', 'Chênh lệch', 'Tiến độ (%)'];
    const rows = flatWbs.map(w => [
      `"${w.code || ''}"`,
      `"${w.name.replace(/"/g, '""')}"`,
      w.budgetAmount,
      0, // Placeholder for actual if not in flat list
      w.budgetAmount,
      0
    ]);
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WBS_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="wbs" />
      <main
        className="erp-page-main"
        style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
      >
        <Header />
        <div className="p-6 md:p-8 space-y-6 animate-fade-in">
          <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
            <h1 className="erp-section-title">Hạng mục thi công (WBS)</h1>
            <p className="erp-section-subtitle">Phân tích ngân sách vs thực tế theo từng hạng mục</p>
          </div>
          
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <div className="text-[13px] font-semibold text-[var(--text-secondary)] mt-4">Đang tải dữ liệu WBS...</div>
            </div>
          ) : (
            <>
              <WBSStats
                totalItems={stats.totalItems}
                totalBudget={stats.totalBudget}
                totalActual={stats.totalActual}
                variance={stats.variance}
                progress={stats.progress}
              />
              <WBSActions onAdd={() => setIsAddingWBS(true)} onExport={handleExport} />
              <div className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
                <WBSTable
                  nodes={tree}
                  onToggleExpand={handleToggleExpand}
                  onEdit={setEditingWBS}
                  totalBudget={stats.totalBudget}
                  totalActual={stats.totalActual}
                  variance={stats.variance}
                  progress={stats.progress}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <AddWBSModal
        isOpen={isAddingWBS || !!editingWBS}
        onClose={() => { setIsAddingWBS(false); setEditingWBS(null); }}
        wbsItem={editingWBS}
      />
    </div>
  );
}
