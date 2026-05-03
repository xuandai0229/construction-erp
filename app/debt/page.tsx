'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';

export default function DebtPage() {
  const invoices = useERPStore(state => state.invoices);
  const costs = useERPStore(state => state.costs);
  const updateCost = useERPStore(state => state.updateCost);
  const deleteInvoice = useERPStore(state => state.deleteInvoice);
  const currentProjectId = useERPStore(state => state.currentProjectId);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<string | null>(null);

  const handlePayCost = (id: string) => {
    updateCost(currentProjectId, id, { status: 'paid' });
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('CẢNH BÁO: Xóa hóa đơn sẽ xóa TOÀN BỘ lịch sử thanh toán liên quan. Bạn có chắc chắn?')) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="debt" />
      <main className="ml-[258px] flex-1">
        <Header />
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý công nợ & Thanh toán</h1>
            <p className="text-slate-400 text-sm">Theo dõi các khoản phải thu, phải trả và lịch sử thanh toán</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Accounts Receivable */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-emerald-400">Phải thu khách hàng (Invoices)</h3>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <th className="px-5 py-4 text-left">Mã HĐ</th>
                      <th className="px-5 py-4 text-left">Ngày phát hành</th>
                      <th className="px-5 py-4 text-right">Tổng tiền</th>
                      <th className="px-5 py-4 text-right text-emerald-400">Đã thu</th>
                      <th className="px-5 py-4 text-right text-rose-400">Còn nợ</th>
                      <th className="px-5 py-4 text-center">Trạng thái</th>
                      <th className="px-5 py-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="px-5 py-4 font-bold text-slate-500">
                          <button onClick={() => setHistoryInvoice(inv.id)} className="hover:text-blue-400 transition-colors">
                            {inv.id.substring(0, 8)}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(inv.issued_date)}</td>
                        <td className="px-5 py-4 text-right font-bold">{formatVnd(inv.amount)}</td>
                        <td className="px-5 py-4 text-right font-medium text-emerald-400">{formatVnd(inv.paid_amount)}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-rose-400">{formatVnd(inv.remaining_amount)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${inv.remaining_amount === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {inv.remaining_amount === 0 ? 'Hoàn tất' : 'Còn nợ'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {inv.remaining_amount > 0 && (
                              <button 
                                onClick={() => setSelectedInvoice(inv.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                              >
                                Thu tiền
                              </button>
                            )}
                            <button 
                              onClick={() => setHistoryInvoice(inv.id)}
                              className="px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-700"
                            >
                              Lịch sử
                            </button>
                            <button 
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                              title="Xóa hóa đơn"
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-500">Chưa có hóa đơn nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Accounts Payable */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-rose-400">Phải trả nhà cung cấp (Costs)</h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <th className="px-5 py-4 text-left">Ngày</th>
                      <th className="px-5 py-4 text-left">Loại chi phí</th>
                      <th className="px-5 py-4 text-right">Số tiền</th>
                      <th className="px-5 py-4 text-center">Trạng thái</th>
                      <th className="px-5 py-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.filter(c => c.status === 'unpaid').map((cost) => (
                      <tr key={cost.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="px-5 py-4 text-slate-400">{formatDate(cost.date)}</td>
                        <td className="px-5 py-4 text-slate-300 uppercase text-xs font-bold">{cost.cost_type}</td>
                        <td className="px-5 py-4 text-right font-bold text-rose-400">{formatVnd(cost.amount)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Chưa trả</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button 
                            onClick={() => handlePayCost(cost.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded transition-colors"
                          >
                            Xác nhận đã trả
                          </button>
                        </td>
                      </tr>
                    ))}
                    {costs.filter(c => c.status === 'unpaid').length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">Không có công nợ phải trả</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <AddPaymentModal 
          isOpen={!!selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          invoiceId={selectedInvoice || undefined} 
        />
        <PaymentHistoryModal 
          isOpen={!!historyInvoice} 
          onClose={() => setHistoryInvoice(null)} 
          invoiceId={historyInvoice || undefined} 
        />
      </main>
    </div>
  );
}
