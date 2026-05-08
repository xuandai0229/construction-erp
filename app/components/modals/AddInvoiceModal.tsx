'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInvoiceModal({ isOpen, onClose }: Props) {
  const projects = useERPStore(state => state.projects);
  const wbs = useERPStore(state => state.wbs);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const addInvoice = useERPStore(state => state.addInvoice);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    wbsId: '',
    amount: '',
    issuedDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục (WBS)');
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('Số tiền phải là số dương');

    setLoading(true);
    // addInvoice(projectId, wbsId, amount, issuedDate)
    const res = await addInvoice(form.projectId, form.wbsId, amount, form.issuedDate);
    setLoading(false);

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal lg" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">Xuất hóa đơn</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="erp-modal-body space-y-4">
            <div className="erp-form-group">
              <label className="t-label">Dự án</label>
              <select
                required
                value={form.projectId}
                onChange={e => setForm({...form, projectId: e.target.value})}
                className="erp-select"
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Hạng mục công trình (WBS)</label>
              <select
                required
                value={form.wbsId}
                onChange={e => setForm({...form, wbsId: e.target.value})}
                className="erp-select"
              >
                <option value="">Chọn hạng mục...</option>
                {wbs.filter(i => i.projectId === form.projectId).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Giá trị hóa đơn (VND)</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Ngày xuất hóa đơn</label>
              <input
                type="date"
                required
                value={form.issuedDate}
                onChange={e => setForm({...form, issuedDate: e.target.value})}
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
              Xuất hóa đơn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

