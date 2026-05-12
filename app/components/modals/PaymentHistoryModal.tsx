'use client';

import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { usePaymentsQuery, useDeletePaymentMutation } from '@/services/queries/useRevenues';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function PaymentHistoryModal({ isOpen, onClose, invoiceId }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  
  const { data: payments = [], isLoading } = usePaymentsQuery(currentProjectId);
  const { mutate: deletePayment, isPending } = useDeletePaymentMutation(currentProjectId);

  if (!isOpen || !invoiceId) return null;

  const invoicePayments = payments.filter((p: any) => p.invoiceId === invoiceId);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bản ghi thanh toán này? Số dư hóa đơn sẽ được tính toán lại.')) {
      deletePayment(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Lịch sử thanh toán HĐ: <span className="font-black text-blue-500">{invoiceId.substring(0, 8)}</span></h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--table-head-bg)] overflow-hidden shadow-inner">
            <table className="erp-table w-full text-xs">
              <thead>
                <tr className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]">
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Diễn giải</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      <div className="flex justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : invoicePayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Chưa có lịch sử thanh toán</td>
                  </tr>
                ) : (
                  invoicePayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors group">
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-semibold">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-emerald-500 group-hover:text-emerald-400">{formatVnd(p.amount)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{p.description || '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                          className="text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 underline underline-offset-2 disabled:opacity-50 transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-[var(--divider)]">
          <button onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">Đóng</button>
        </div>
      </div>
    </div>
  );
}
