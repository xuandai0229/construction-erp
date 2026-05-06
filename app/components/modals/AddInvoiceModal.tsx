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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-[15px] font-bold text-slate-100">Xuất hóa đơn (Invoice)</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dự án</label>
            <select
              value={form.projectId}
              onChange={e => setForm({...form, projectId: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hạng mục công trình (WBS)</label>
            <select
              value={form.wbsId}
              onChange={e => setForm({...form, wbsId: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            >
              <option value="">-- Chọn hạng mục --</option>
              {wbs.filter(i => i.projectId === form.projectId).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giá trị hóa đơn (VND)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày xuất hóa đơn</label>
            <input
              type="date"
              value={form.issuedDate}
              onChange={e => setForm({...form, issuedDate: e.target.value})}
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm text-slate-300">Hủy</button>
            <button type="submit" disabled={loading} className="h-9 px-4 bg-blue-600 rounded-lg text-sm text-white">Xuất hóa đơn</button>
          </div>
        </form>
      </div>
    </div>
  );
}

