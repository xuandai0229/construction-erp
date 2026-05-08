'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import AddCostModal from '@/app/components/modals/AddCostModal';
import { CostRecord } from '@/app/types';

export default function CostsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const init = useERPStore(state => state.init);
  const costs = useERPStore(state => state.costs);
  const wbs = useERPStore(state => state.wbs);
  const isInitialized = useERPStore(state => state.initialized);

  useEffect(() => { init(); }, [init]);

  const getWbsName = (id: string) => wbs.find(w => w.id === id)?.name || 'N/A';

  if (!isInitialized) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Chi phí" />
        <main className="erp-content space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">Nhật ký chi phí ({costs.length})</h2>
            <button onClick={() => setIsAdding(true)} className="btn btn-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm chi phí
            </button>
          </div>

          <div className="erp-card">
            <div className="erp-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="erp-table zebra">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Nội dung</th>
                    <th>Hạng mục</th>
                    <th>Loại</th>
                    <th className="text-right">Số tiền (VND)</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost) => (
                    <tr key={cost.id}>
                      <td>{formatDate(cost.date)}</td>
                      <td className="font-bold text-slate-900">{cost.description}</td>
                      <td className="text-slate-500">{getWbsName(cost.wbsId)}</td>
                      <td className="uppercase text-[11px] font-bold text-slate-400">{cost.costType}</td>
                      <td className="text-right font-money text-blue-600">{formatVnd(cost.amount)}</td>
                      <td className="text-center">
                         <span className={`badge ${cost.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {cost.status === 'paid' ? 'Đã chi' : 'Phải trả'}
                         </span>
                      </td>
                      <td className="text-center">
                        <button onClick={() => setEditingCost(cost)} className="btn btn-ghost btn-sm p-1">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400 hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {costs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-400">Chưa có phát sinh chi phí</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <AddCostModal 
        isOpen={isAdding || !!editingCost} 
        onClose={() => { setIsAdding(false); setEditingCost(null); }} 
        costRecord={editingCost} 
      />
    </div>
  );
}
