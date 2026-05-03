'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType, COST_TYPE_LABELS } from '@/app/types';

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
    form.projectId ? w.project_id === form.projectId : true
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const amount = parseFloat(form.estimatedAmount);
    if (!form.estimatedAmount || isNaN(amount) || amount <= 0) return setError('Dự toán phải là số dương');

    setLoading(true);
    const res = addBudget(form.projectId, form.wbsId, form.costType, amount);
    setLoading(false);

    if (res?.success) {
      setForm(prev => ({ ...prev, estimatedAmount: '', wbsId: '' }));
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 3h10v18H7zM10 7h4M10 11h4M10 15h2" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">Lập dự toán</h2>
              <p className="text-xs text-slate-500">Thêm dự toán cho hạng mục</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dự án <span className="text-red-400">*</span></label>
            <div className="relative">
              <select
                value={form.projectId}
                onChange={e => handleChange('projectId', e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hạng mục WBS <span className="text-red-400">*</span></label>
            <div className="relative">
              <select
                value={form.wbsId}
                onChange={e => handleChange('wbsId', e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn hạng mục --</option>
                {filteredWbs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Loại chi phí</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(COST_TYPE_LABELS) as [CostType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('costType', val)}
                  className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                    form.costType === val
                      ? 'border-purple-500 bg-purple-600/20 text-purple-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số tiền dự toán (VND) <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.estimatedAmount}
              onChange={e => handleChange('estimatedAmount', e.target.value)}
              placeholder="VD: 5000000000"
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            {form.estimatedAmount && !isNaN(parseFloat(form.estimatedAmount)) && (
              <div className="mt-1 text-right text-xs text-slate-500">
                = {parseFloat(form.estimatedAmount).toLocaleString('vi-VN')} đ
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-60"
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
