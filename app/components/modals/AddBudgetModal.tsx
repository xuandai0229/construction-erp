'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType, costType_LABELS } from '@/app/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBudgetModal({ isOpen, onClose }: Props) {
  const projects = useERPStore(state => state.projects);
  const wbsItems = useERPStore(state => state.wbs);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const addBudget = useERPStore(state => state.addBudget);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    wbsId: '',
    costType: 'material' as CostType,
    estimatedAmount: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredWbs = wbsItems.filter(w =>
    form.projectId ? w.projectId === form.projectId : true
  );

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    if (field === 'projectId') {
      setCurrentProject(value);
      setForm(prev => ({ ...prev, projectId: value, wbsId: '' }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const amount = parseFloat(form.estimatedAmount);
    if (!form.estimatedAmount || isNaN(amount) || amount <= 0) return setError('Dự toán phải là số dương');

    setLoading(true);
    const res = await addBudget(form.projectId, form.wbsId, form.costType, amount);
    setLoading(false);

    if (res?.success) {
      setForm(prev => ({ ...prev, estimatedAmount: '', wbsId: '' }));
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal md" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">Lập dự toán</h2>
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
                value={form.projectId}
                onChange={e => handleChange('projectId', e.target.value)}
                className="erp-select"
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Hạng mục WBS</label>
              <select
                value={form.wbsId}
                onChange={e => handleChange('wbsId', e.target.value)}
                className="erp-select"
              >
                <option value="">Chọn hạng mục...</option>
                {filteredWbs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Loại chi phí</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(costType_LABELS) as [CostType, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleChange('costType', val)}
                    className={`h-8 rounded-[var(--radius)] border text-xs font-semibold transition-colors ${
                      form.costType === val
                        ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-mid)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Số tiền dự toán (VND)</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.estimatedAmount}
                onChange={e => handleChange('estimatedAmount', e.target.value)}
                placeholder="VD: 5000000000"
                className="erp-input"
                autoFocus
              />
              {form.estimatedAmount && !isNaN(parseFloat(form.estimatedAmount)) && (
                <div className="mt-2 text-right text-xs text-[var(--text-secondary)]">
                  = {parseFloat(form.estimatedAmount).toLocaleString('vi-VN')} đ
                </div>
              )}
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
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              Lưu dự toán
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

