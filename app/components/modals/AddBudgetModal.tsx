'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType, costType_LABELS } from '@/app/types';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useCreateBudgetMutation } from '@/services/queries/useBudgets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBudgetModal({ isOpen, onClose }: Props) {
  const { currentProjectId, setCurrentProject } = useERPStore();
  
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsItems = wbsData?.flat || [];

  const { mutateAsync: createBudget } = useCreateBudgetMutation(currentProjectId);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    wbsId: '',
    costType: 'material' as CostType,
    estimatedAmount: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredWbs = wbsItems.filter((w: any) =>
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
    try {
      await createBudget({
        projectId: form.projectId,
        wbsId: form.wbsId,
        costType: form.costType,
        estimatedAmount: amount,
      });
      setForm(prev => ({ ...prev, estimatedAmount: '', wbsId: '' }));
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
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-500 ring-1 ring-purple-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 3h10v18H7zM10 7h4M10 11h4M10 15h2" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Lập dự toán</h2>
              <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)]">Thêm dự toán cho hạng mục</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="erp-label">Dự án <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={form.projectId}
                onChange={e => handleChange('projectId', e.target.value)}
                className="erp-input w-full appearance-none pr-8"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="erp-label">Hạng mục WBS <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={form.wbsId}
                onChange={e => handleChange('wbsId', e.target.value)}
                className="erp-input w-full appearance-none pr-8"
              >
                <option value="">-- Chọn hạng mục --</option>
                {filteredWbs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="erp-label">Loại chi phí</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(costType_LABELS) as [CostType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('costType', val)}
                  className={`h-8 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    form.costType === val
                      ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                      : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="erp-label">Số tiền dự toán (VND) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.estimatedAmount}
              onChange={e => handleChange('estimatedAmount', e.target.value)}
              placeholder="VD: 5000000000"
              className="erp-input w-full tabular-nums text-lg font-bold"
              autoFocus
            />
            {form.estimatedAmount && !isNaN(parseFloat(form.estimatedAmount)) && (
              <div className="mt-1.5 text-right text-[11px] font-black uppercase tracking-widest text-emerald-500">
                = {parseFloat(form.estimatedAmount).toLocaleString('vi-VN')} đ
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--divider)] mt-6">
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="erp-btn bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-colors disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              Lưu dự toán
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
