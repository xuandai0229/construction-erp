'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { RevenueStatus } from '@/app/types';

export default function RevenueListPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const revenues = useERPStore(state => state.revenues);
  const wbs = useERPStore(state => state.wbs);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const updateRevenue = useERPStore(state => state.updateRevenue);

  useEffect(() => { init(); }, [init]);

  const getWbsName = (id: string) => wbs.find(w => w.id === id)?.name || 'N/A';

  const handleToggleStatus = (id: string, currentStatus: RevenueStatus) => {
    const newStatus: RevenueStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    updateRevenue(id, { status: newStatus });
  };

  if (!isInitialized) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Doanh thu" />
        <main className="erp-content space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">Danh sách doanh thu ({revenues.length})</h2>
          </div>

          <div className="erp-card">
            <div className="erp-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="erp-table zebra">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Hạng mục WBS</th>
                    <th>Diễn giải</th>
                    <th className="text-right">Số tiền (VND)</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((rev) => (
                    <tr key={rev.id}>
                      <td>{formatDate(rev.date)}</td>
                      <td className="font-bold text-slate-900">{getWbsName(rev.wbsId)}</td>
                      <td className="text-slate-500">{rev.description}</td>
                      <td className="text-right font-money text-green-600">{formatVnd(rev.amount)}</td>
                      <td className="text-center">
                        <span className={`badge ${rev.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {rev.status === 'paid' ? 'Đã thu' : 'Chờ thu'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={() => handleToggleStatus(rev.id, rev.status)}
                          className="btn btn-secondary btn-sm"
                        >
                          {rev.status === 'paid' ? 'Mở lại' : 'Xác nhận thu'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {revenues.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400">Chưa có dữ liệu doanh thu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
