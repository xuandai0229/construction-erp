'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { TaskStatus } from '@prisma/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEW: 'Đang kiểm tra',
  DONE: 'Hoàn thành',
};

export default function AddTaskModal({ isOpen, onClose }: Props) {
  const projects = useERPStore(state => state.projects);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const addTask = useERPStore(state => state.addTask);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.title.trim()) return setError('Vui lòng nhập tên công việc');

    setLoading(true);
    setError('');
    const res = await addTask(form.projectId, form.title.trim(), form.description || undefined, form.status);
    setLoading(false);

    if (res?.success) {
      setForm({ projectId: form.projectId, title: '', description: '', status: 'TODO' });
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
      console.error('AddTask error:', res?.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">Thêm công việc</h2>
              <p className="text-xs text-slate-500">Tạo task mới cho dự án</p>
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
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Dự án <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={form.projectId}
                onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Tên công việc <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="VD: Khảo sát địa chất..."
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết công việc..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: val }))}
                  className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                    form.status === val
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
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
              className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              Thêm công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
