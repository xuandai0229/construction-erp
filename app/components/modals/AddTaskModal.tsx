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
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal md" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">Thêm công việc</h2>
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
                required
                value={form.projectId}
                onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))}
                className="erp-select"
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Tên công việc</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Khảo sát địa chất..."
                className="erp-input"
                autoFocus
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết công việc..."
                rows={3}
                className="erp-input resize-none"
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Trạng thái</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, status: val }))}
                    className={`h-8 rounded-[var(--radius)] border text-xs font-semibold transition-colors ${
                      form.status === val
                        ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-mid)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
              Thêm công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

