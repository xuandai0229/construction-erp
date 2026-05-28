'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useCreateVendorPaymentMutation } from '@/services/queries/useCosts';
import { formatVnd } from '@/app/components/dashboard-data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cost: any; // CostRecord
}

export default function VendorPaymentModal({ isOpen, onClose, cost }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { mutateAsync: createPayment } = useCreateVendorPaymentMutation(currentProjectId);

  const [form, setForm] = useState({
    amount: cost?.amount || '',
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
    reference: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !cost) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount.toString());
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('LỖI KẾ TOÁN: Số tiền phải là số dương');
    if (amount > cost.amount) return setError('LỖI KẾ TOÁN: Không được thanh toán vượt số tiền phải trả (Overpayment)');

    setLoading(true);
    try {
      await createPayment({
        id: cost.id,
        amount,
        paymentDate: form.paymentDate,
        note: form.note,
        reference: form.reference,
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
          <div>
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Ủy nhiệm chi / Thanh toán NCC</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">CFO Workspace • True Ledger Posting</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] shadow-inner">
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider">Nhà cung cấp:</span>
              <span className="font-black text-[var(--text-primary)]">{cost.supplier || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider">Tổng nợ:</span>
              <span className="font-black text-rose-500">{formatVnd(cost.amount)}</span>
            </div>
          </div>
          
          <div>
            <label className="erp-label">Số tiền xuất quỹ (VND)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="erp-input w-full tabular-nums text-lg font-bold"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="erp-label">Ngày hạch toán</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={e => setForm({...form, paymentDate: e.target.value})}
                className="erp-input w-full"
              />
            </div>
            <div>
              <label className="erp-label">Số chứng từ (Ref)</label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm({...form, reference: e.target.value})}
                placeholder="VD: UNC-001"
                className="erp-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="erp-label">Diễn giải (Ghi chú)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              placeholder="Nội dung hạch toán..."
              className="erp-input w-full"
            />
          </div>

          <div className="bg-[var(--secondary)] p-3 rounded text-[10px] text-[var(--text-secondary)] font-mono border border-[var(--border)]">
            <div className="font-bold mb-1 text-[var(--text-primary)]">Ledger Preview:</div>
            <div>Dr 3310 - Phải trả người bán (AP)</div>
            <div>Cr 1020 - Tiền gửi ngân hàng</div>
            <div className="mt-1 text-emerald-500">Auto-post to Ledger enabled</div>
          </div>

          {error && <div className="text-rose-500 text-xs mt-2 font-bold bg-rose-500/10 p-2 rounded">{error}</div>}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--divider)] mt-6">
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">Hủy</button>
            <button type="submit" disabled={loading} className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-60 font-bold">Xác nhận hạch toán</button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
