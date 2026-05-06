'use client';

import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function PaymentHistoryModal({ isOpen, onClose, invoiceId }: Props) {
  const payments = useERPStore(state => state.payments);
  const deletePayment = useERPStore(state => state.deletePayment);

  if (!isOpen || !invoiceId) return null;

  const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bản ghi thanh toán này? Số dư hóa đơn sẽ được tính toán lại.')) {
      deletePayment(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-[15px] font-bold text-slate-100">Lịch sử thanh toán HĐ: {invoiceId.substring(0, 8)}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Diễn giải</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoicePayments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-300">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatVnd(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-400">{p.description || '--'}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="text-rose-500 hover:text-rose-400 font-bold underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {invoicePayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Chưa có lịch sử thanh toán</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="h-9 px-4 bg-slate-800 rounded-lg text-sm text-white">Đóng</button>
        </div>
      </div>
    </div>
  );
}

