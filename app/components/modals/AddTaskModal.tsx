'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { TaskStatus } from '@prisma/client';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useCreateTaskMutation } from '@/services/queries/useTasks';

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
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { mutateAsync: createTask } = useCreateTaskMutation(currentProjectId);

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
    
    try {
      await createTask({
        projectId: form.projectId,
        title: form.title.trim(),
        description: form.description || undefined,
        status: form.status
      });
      setForm({ projectId: form.projectId, title: '', description: '', status: 'TODO' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
      console.error('AddTask error:', err.message);
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-500 ring-1 ring-blue-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Thêm công việc</h2>
              <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)]">Tạo task mới cho dự án</p>
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
            <label className="erp-label">
              Dự án <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.projectId}
                onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))}
                className="erp-input w-full appearance-none pr-8"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div>
            <label className="erp-label">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="VD: Khảo sát địa chất..."
              className="erp-input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="erp-label">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết công việc..."
              rows={3}
              className="erp-input w-full resize-none py-2"
            />
          </div>

          <div>
            <label className="erp-label">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: val }))}
                  className={`h-8 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    form.status === val
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                      : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
              className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors disabled:opacity-60"
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
