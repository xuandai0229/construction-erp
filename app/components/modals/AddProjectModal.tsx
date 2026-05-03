'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { ProjectStatus } from '@/app/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Lập kế hoạch' },
  { value: 'in_progress', label: 'Đang thi công' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'on_hold', label: 'Tạm dừng' },
];

export default function AddProjectModal({ isOpen, onClose }: Props) {
  const addProject = useERPStore(state => state.addProject);

  const [form, setForm] = useState({
    name: '',
    investor: '',
    total_value: '',
    status: 'in_progress' as ProjectStatus,
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Vui lòng nhập tên dự án');
    if (!form.investor.trim()) return setError('Vui lòng nhập chủ đầu tư');
    const totalValue = parseFloat(form.total_value.replace(/,/g, ''));
    if (!form.total_value || isNaN(totalValue) || totalValue <= 0)
      return setError('Vui lòng nhập giá trị hợp đồng hợp lệ');

    setLoading(true);
    const res = addProject(
      form.name.trim(),
      form.investor.trim(),
      totalValue,
      form.status,
      form.start_date || undefined,
      form.end_date || undefined
    );
    setLoading(false);

    if (res?.success) {
      setForm({ name: '', investor: '', total_value: '', status: 'in_progress', start_date: '', end_date: '' });
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">Thêm dự án mới</h2>
              <p className="text-xs text-slate-500">Điền thông tin để tạo dự án</p>
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
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên dự án <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="VD: Cao ốc văn phòng ABC Tower"
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chủ đầu tư <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.investor}
              onChange={e => handleChange('investor', e.target.value)}
              placeholder="VD: Công ty TNHH ABC"
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giá trị hợp đồng (VND) <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.total_value}
              onChange={e => handleChange('total_value', e.target.value)}
              placeholder="VD: 50000000000"
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Trạng thái</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => handleChange('start_date', e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => handleChange('end_date', e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              Tạo dự án
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
