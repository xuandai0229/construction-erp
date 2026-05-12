'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useInvoicesQuery, useCreatePaymentMutation } from '@/services/queries/useRevenues';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function AddPaymentModal({ isOpen, onClose, invoiceId }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  
  const { data: invoices = [] } = useInvoicesQuery(currentProjectId);
  const { mutateAsync: createPayment } = useCreatePaymentMutation(currentProjectId);

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) {
      setRequestId(crypto.randomUUID());
    }
  }, [isOpen]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !invoiceId) return null;

  const invoice = invoices.find((inv: any) => inv.id === invoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('Số tiền phải là số dương');
    if (invoice && amount > invoice.remainingAmount) return setError('Số tiền thanh toán không được vượt quá số dư còn lại');

    setLoading(true);
    try {
      await createPayment({
        projectId: currentProjectId,
        invoiceId,
        amount,
        date: form.date,
        description: form.description,
        requestId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Ghi nhận thanh toán</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {invoice && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] shadow-inner">
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider">Hóa đơn:</span>
                <span className="font-black text-[var(--text-primary)]">{invoice.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider">Còn lại:</span>
                <span className="font-black text-emerald-500">{new Intl.NumberFormat('vi-VN').format(invoice.remainingAmount)} VND</span>
              </div>
            </div>
          )}
          <div>
            <label className="erp-label">Số tiền thanh toán (VND)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              placeholder="Nhập số tiền..."
              className="erp-input w-full tabular-nums text-lg font-bold"
              autoFocus
            />
          </div>
          <div>
            <label className="erp-label">Ngày thanh toán</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="erp-input w-full"
            />
          </div>
          <div>
            <label className="erp-label">Ghi chú</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="VD: Chuyển khoản ngân hàng..."
              className="erp-input w-full"
            />
          </div>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--divider)] mt-6">
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">Hủy</button>
            <button type="submit" disabled={loading} className="erp-btn bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60">Xác nhận</button>
          </div>
        </form>
      </div>
    </div>
  );
}
