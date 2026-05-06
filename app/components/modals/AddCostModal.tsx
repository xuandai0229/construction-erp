'use client';

import { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType, costType_LABELS, CostRecord } from '@/app/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  costRecord?: CostRecord | null;
}

export default function AddCostModal({ isOpen, onClose, costRecord }: Props) {
  const projects = useERPStore(state => state.projects);
  const wbsItems = useERPStore(state => state.wbs);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const addCost = useERPStore(state => state.addCost);
  const updateCost = useERPStore(state => state.updateCost);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    wbsId: '',
    costType: 'material' as CostType,
    quantity: '',
    unitPrice: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (costRecord) {
      setForm({
        projectId: costRecord.projectId,
        wbsId: costRecord.wbsId,
        costType: costRecord.costType,
        quantity: costRecord.quantity?.toString() || '',
        unitPrice: costRecord.unitPrice?.toString() || '',
        note: costRecord.note || '',
        date: costRecord.date.split('T')[0],
      });
    } else {
      setForm({
        projectId: currentProjectId || projects[0]?.id || '',
        wbsId: '',
        costType: 'material',
        quantity: '',
        unitPrice: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [costRecord, isOpen, currentProjectId, projects]);

  const amount = (parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0);

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
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.unitPrice);
    if (!form.quantity || isNaN(qty) || qty <= 0) return setError('Số lượng phải là số dương');
    if (!form.unitPrice || isNaN(price) || price <= 0) return setError('Đơn giá phải là số dương');

    setLoading(true);
    let res;
    if (costRecord) {
      res = await updateCost(form.projectId, costRecord.id, {
        wbsId: form.wbsId,
        costType: form.costType,
        amount: amount,
        quantity: qty,
        unitPrice: price,
        note: form.note,
        date: form.date,
      });
    } else {
      res = await addCost(form.projectId, form.wbsId, form.costType, amount, qty, price);
    }
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
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {costRecord ? <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /> : <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">{costRecord ? 'Cập nhật chi phí' : 'Ghi nhận chi phí'}</h2>
              <p className="text-xs text-slate-500">{costRecord ? 'Chỉnh sửa bản ghi chi phí' : 'Thêm phát sinh chi phí thực tế'}</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dự án <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={form.projectId}
                  disabled={!!costRecord}
                  onChange={e => handleChange('projectId', e.target.value)}
                  className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-7 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hạng mục WBS <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={form.wbsId}
                  onChange={e => handleChange('wbsId', e.target.value)}
                  className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-7 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn hạng mục --</option>
                  {filteredWbs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Loại chi phí</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(costType_LABELS) as [CostType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('costType', val)}
                  className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                    form.costType === val
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số lượng <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                placeholder="VD: 100"
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Đơn giá (VND) <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.unitPrice}
                onChange={e => handleChange('unitPrice', e.target.value)}
                placeholder="VD: 500000"
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount Preview */}
          {amount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-600/10 px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-400">Thành tiền</span>
              <span className="text-sm font-extrabold text-blue-300">{amount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày phát sinh</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ghi chú</label>
              <input
                type="text"
                value={form.note}
                onChange={e => handleChange('note', e.target.value)}
                placeholder="Mô tả ngắn..."
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
              className="flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              {costRecord ? 'Cập nhật' : 'Ghi nhận chi phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

