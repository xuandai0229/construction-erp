'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function AddPaymentModal({ isOpen, onClose, invoiceId }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const invoices = useERPStore(state => state.invoices);
  const addPayment = useERPStore(state => state.addPayment);

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !invoiceId) return null;

  const invoice = invoices.find(inv => inv.id === invoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('Số tiền phải là số dương');
    if (invoice && amount > invoice.remaining_amount) return setError('Số tiền thanh toán không được vượt quá số dư còn lại');

    setLoading(true);
    const res = await addPayment(currentProjectId, invoiceId, amount, form.date, form.description);
    setLoading(false);

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-[15px] font-bold text-slate-100">Ghi nhận thanh toán</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {invoice && (
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Hóa đơn:</span>
                <span className="font-bold text-slate-200">{invoice.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Còn lại:</span>
                <span className="font-bold text-emerald-400">{new Intl.NumberFormat('vi-VN').format(invoice.remaining_amount)} VND</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số tiền thanh toán (VND)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              placeholder="Nhập số tiền..."
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày thanh toán</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ghi chú</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="VD: Chuyển khoản ngân hàng..."
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm text-slate-300">Hủy</button>
            <button type="submit" disabled={loading} className="h-9 px-4 bg-emerald-600 rounded-lg text-sm text-white font-bold">Xác nhận</button>
          </div>
        </form>
      </div>
    </div>
  );
}
