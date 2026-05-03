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
    form.projectId ? w.project_id === form.projectId : true
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-[15px] font-bold text-slate-100">Ghi nhận doanh thu</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dự án</label>
              <select
                value={form.projectId}
                onChange={e => setForm({...form, projectId: e.target.value, wbsId: ''})}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hạng mục WBS</label>
              <select
                value={form.wbsId}
                onChange={e => setForm({...form, wbsId: e.target.value})}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
              >
                <option value="">-- Chọn hạng mục --</option>
                {filteredWbs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số tiền (VND)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value as any})}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
              >
                <option value="unpaid">Chưa thu tiền</option>
                <option value="paid">Đã thu tiền</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm text-slate-300">Hủy</button>
            <button type="submit" disabled={loading} className="h-9 px-4 bg-green-600 rounded-lg text-sm text-white">Lưu doanh thu</button>
          </div>
        </form>
      </div>
    </div>
  );
}
