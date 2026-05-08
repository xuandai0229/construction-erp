'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';

export default function BudgetPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const init = useERPStore(state => state.init);
  const budgets = useERPStore(state => state.budgets);
  const wbs = useERPStore(state => state.wbs);
  const getWBSTreeWithCost = useERPStore(state => state.getWBSTreeWithCost);
  const isInitialized = useERPStore(state => state.initialized);

  useEffect(() => { init(); }, [init]);

  const { tree } = useMemo(() => getWBSTreeWithCost(), [budgets, wbs, getWBSTreeWithCost]);

  if (!isInitialized) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Dự toán" />
        <main className="erp-content space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">Bảng dự toán chi tiết</h2>
            <button onClick={() => setIsAdding(true)} className="btn btn-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm dự toán
            </button>
          </div>

          <div className="erp-card">
            <div className="erp-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Hạng mục WBS</th>
                    <th className="text-right">Dự toán gốc</th>
                    <th className="text-right">Dự toán điều chỉnh</th>
                    <th className="text-right">Thực tế</th>
                    <th className="text-right">Chênh lệch</th>
                    <th className="text-right">Tỉ lệ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {renderBudgetRows(tree)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <AddBudgetModal isOpen={isAdding} onClose={() => setIsAdding(false)} />
    </div>
  );
}

function renderBudgetRows(nodes: any[], level = 0): React.ReactNode {
  return nodes.map(node => {
    const isParent = node.children && node.children.length > 0;
    const variance = node.budget - node.actual;
    const pct = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;

    return (
      <React.Fragment key={node.id}>
        <tr className={isParent ? 'wbs-row-parent' : 'wbs-row-child'}>
          <td style={{ paddingLeft: `${level * 24 + 16}px` }}>{node.name}</td>
          <td className="text-right font-money">{formatVnd(node.budget)}</td>
          <td className="text-right font-money">{formatVnd(node.budget)}</td>
          <td className="text-right font-money text-green-600">{formatVnd(node.actual)}</td>
          <td className={`text-right font-money ${variance < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {formatVnd(variance)}
          </td>
          <td className="text-right font-bold">
             <span className={pct > 100 ? 'text-red-600' : 'text-blue-600'}>{pct.toFixed(1)}%</span>
          </td>
        </tr>
        {isParent && renderBudgetRows(node.children, level + 1)}
      </React.Fragment>
    );
  });
}

import React from 'react';
