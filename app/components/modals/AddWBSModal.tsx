'use client';

import { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { WBSItem } from '@/app/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wbsItem?: WBSItem | null;
}

export default function AddWBSModal({ isOpen, onClose, wbsItem }: Props) {
  const projects = useERPStore(state => state.projects);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const wbsItems = useERPStore(state => state.wbs);
  const addWBS = useERPStore(state => state.addWBS);
  const updateWBS = useERPStore(state => state.updateWBS);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    name: '',
    parentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wbsItem) {
      setForm({
        projectId: wbsItem.projectId,
        name: wbsItem.name,
        parentId: wbsItem.parentId || '',
      });
    } else {
      setForm({
        projectId: currentProjectId || projects[0]?.id || '',
        name: '',
        parentId: '',
      });
    }
  }, [wbsItem, isOpen, currentProjectId, projects]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    if (field === 'projectId') {
      setCurrentProject(value);
    }
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const parentOptions = wbsItems.filter(w =>
    (form.projectId ? w.projectId === form.projectId : true) && (wbsItem ? w.id !== wbsItem.id : true)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.name.trim()) return setError('Vui lòng nhập tên hạng mục');

    setLoading(true);
    let res;
    if (wbsItem) {
      res = await updateWBS(form.projectId, wbsItem.id, {
        name: form.name.trim(),
        parentId: form.parentId || null,
      });
    } else {
      res = await addWBS(form.projectId, form.name.trim(), form.parentId || null);
    }
    setLoading(false);

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal md" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">{wbsItem ? 'Cập nhật hạng mục' : 'Thêm hạng mục WBS'}</h2>
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
                disabled={!!wbsItem}
                onChange={e => handleChange('projectId', e.target.value)}
                className="erp-select disabled:opacity-60"
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Hạng mục cha (tùy chọn)</label>
              <select
                value={form.parentId}
                onChange={e => handleChange('parentId', e.target.value)}
                className="erp-select"
              >
                <option value="">Hạng mục gốc</option>
                {parentOptions.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="erp-form-group">
              <label className="t-label">Tên hạng mục</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="VD: 1. Công tác chuẩn bị"
                className="erp-input"
                autoFocus
              />
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
              {wbsItem ? 'Cập nhật' : 'Thêm hạng mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

