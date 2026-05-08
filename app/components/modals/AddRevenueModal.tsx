'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRevenueModal({ isOpen, onClose }: Props) {
  const projects = useERPStore(state => state.projects);
  const wbsItems = useERPStore(state => state.wbs);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const addRevenue = useERPStore(state => state.addRevenue);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    wbsId: '',
    amount: '',
    status: 'unpaid' as 'paid' | 'unpaid',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredWbs = wbsItems.filter(w =>
    form.projectId ? w.projectId === form.projectId : true
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('Số tiền phải là số dương');

    setLoading(true);
    const res = await addRevenue(form.projectId, form.wbsId, amount, form.status, form.description, form.date);
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
          <h2 className="t-section-title">Ghi nhận doanh thu</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="erp-modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="erp-form-group">
                <label className="t-label">Dự án</label>
                <select
                  required
                  value={form.projectId}
                  onChange={e => setForm({...form, projectId: e.target.value, wbsId: ''})}
                  className="erp-select"
                >
                  <option value="">Chọn dự án...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="erp-form-group">
                <label className="t-label">Hạng mục WBS</label>
                <select
                  required
                  value={form.wbsId}
                  onChange={e => setForm({...form, wbsId: e.target.value})}
                  className="erp-select"
                >
                  <option value="">Chọn hạng mục...</option>
                  {filteredWbs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="erp-form-group">
                <label className="t-label">Số tiền (VND)</label>
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
                <label className="t-label">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as 'paid' | 'unpaid'})}
                  className="erp-select"
                >
                  <option value="unpaid">Chưa thu tiền</option>
                  <option value="paid">Đã thu tiền</option>
                </select>
              </div>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Mô tả</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Thông tin thêm về doanh thu này"
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
              Lưu doanh thu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

