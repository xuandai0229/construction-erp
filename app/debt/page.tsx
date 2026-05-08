'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';

export default function DebtPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<string | null>(null);

  const invoices = useERPStore(state => state.invoices);
  const costs = useERPStore(state => state.costs);
  const updateCost = useERPStore(state => state.updateCost);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const currentProjectId = useERPStore(state => state.currentProjectId);

  useEffect(() => { init(); }, [init]);

  const handlePayCost = (id: string) => {
    updateCost(currentProjectId, id, { status: 'paid' });
  };

  if (!isInitialized) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Công nợ & Thanh toán" />
        <main className="erp-content">
          <div className="erp-card h-64 skeleton rounded-[6px]" />
        </main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Công nợ & Thanh toán" />
        <main className="erp-content space-y-[var(--sp-24)]">
          
          {/* AR Section */}
          <section className="space-y-[var(--sp-12)]">
            <h2 className="t-section-title text-[var(--brand)] uppercase text-[13px] tracking-wider">Phải thu khách hàng (AR)</h2>
            <div className="erp-card">
              <div className="erp-table-wrap border-none rounded-none">
                <table className="erp-table zebra">
                  <thead>
                    <tr>
                      <th className="w-32">Mã hóa đơn</th>
                      <th>Ngày phát hành</th>
                      <th className="text-right">Tổng tiền</th>
                      <th className="text-right">Đã thu</th>
                      <th className="text-right">Còn nợ</th>
                      <th className="text-center w-32">Trạng thái</th>
                      <th className="text-center w-48">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-bold text-[var(--text-secondary)] uppercase">{inv.id.substring(0, 8)}</td>
                        <td>{formatDate(inv.issuedDate)}</td>
                        <td className="text-right text-money">{formatVnd(inv.amount)}</td>
                        <td className="text-right text-money text-[var(--success)]">{formatVnd(inv.paidAmount)}</td>
                        <td className="text-right text-money text-[var(--danger)]">{formatVnd(inv.remainingAmount)}</td>
                        <td className="text-center">
                          <span className={`badge ${inv.remainingAmount === 0 ? 'badge-success' : 'badge-danger'}`}>
                            {inv.remainingAmount === 0 ? 'Hoàn tất' : 'Còn nợ'}
                          </span>
                        </td>
                        <td className="text-center">
                           <div className="flex items-center justify-center gap-2">
                             {inv.remainingAmount > 0 && (
                               <button onClick={() => setSelectedInvoice(inv.id)} className="btn btn-primary btn-sm px-3">Thu tiền</button>
                             )}
                             <button onClick={() => setHistoryInvoice(inv.id)} className="btn btn-secondary btn-sm px-3">Lịch sử</button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[var(--text-muted)] italic">Chưa có hóa đơn phát hành</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* AP Section */}
          <section className="space-y-[var(--sp-12)]">
            <h2 className="t-section-title text-[var(--danger)] uppercase text-[13px] tracking-wider">Phải trả nhà cung cấp (AP)</h2>
            <div className="erp-card">
              <div className="erp-table-wrap border-none rounded-none">
                <table className="erp-table zebra">
                  <thead>
                    <tr>
                      <th className="w-32">Ngày</th>
                      <th>Nội dung chi phí</th>
                      <th className="w-40">Loại chi phí</th>
                      <th className="text-right w-48">Số tiền cần thanh toán</th>
                      <th className="text-center w-32">Trạng thái</th>
                      <th className="text-center w-48">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.filter(c => c.status === 'unpaid').map((cost) => (
                      <tr key={cost.id}>
                        <td className="text-[var(--text-secondary)]">{formatDate(cost.date)}</td>
                        <td className="font-semibold text-[var(--text-primary)]">{cost.description}</td>
                        <td>
                           <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase bg-[var(--bg-muted)] px-2 py-0.5 rounded-[4px]">
                              {cost.costType}
                           </span>
                        </td>
                        <td className="text-right text-money text-[var(--danger)]">{formatVnd(cost.amount)}</td>
                        <td className="text-center">
                          <span className="badge badge-danger">Chưa trả</span>
                        </td>
                        <td className="text-center">
                          <button onClick={() => handlePayCost(cost.id)} className="btn btn-primary btn-sm px-4">Xác nhận thanh toán</button>
                        </td>
                      </tr>
                    ))}
                    {costs.filter(c => c.status === 'unpaid').length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] italic">Không có khoản phải trả quá hạn</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>

      <AddPaymentModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoiceId={selectedInvoice || undefined} />
      <PaymentHistoryModal isOpen={!!historyInvoice} onClose={() => setHistoryInvoice(null)} invoiceId={historyInvoice || undefined} />
    </div>
  );
}
