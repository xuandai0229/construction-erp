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
    if (invoice && amount > invoice.remainingAmount) return setError('Số tiền thanh toán không được vượt quá số dư còn lại');

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
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal md" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">Ghi nhận thanh toán</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="erp-modal-body space-y-4">
            {invoice && (
              <div className="p-3 rounded-[var(--radius)] border border-[var(--info-light)] bg-[var(--info-light)]/20 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--text-secondary)]">Hóa đơn:</span>
                  <span className="font-bold text-[var(--text-primary)]">{invoice.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Còn lại:</span>
                  <span className="font-bold text-[var(--success)]">{new Intl.NumberFormat('vi-VN').format(invoice.remainingAmount)} VND</span>
                </div>
              </div>
            )}

            <div className="erp-form-group">
              <label className="t-label">Số tiền thanh toán (VND)</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="Nhập số tiền..."
                className="erp-input"
                autoFocus
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Ngày thanh toán</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Ghi chú</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="VD: Chuyển khoản ngân hàng..."
                className="erp-input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--danger-light)] bg-[var(--danger-light)]/50 px-3 py-2 text-sm text-[var(--danger)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="erp-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

