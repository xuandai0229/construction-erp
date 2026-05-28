'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { WBSItem } from '@/app/types';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useWBSQuery, useCreateWBSMutation, useUpdateWBSMutation } from '@/services/queries/useWBS';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wbsItem?: WBSItem | null;
  initialParentId?: string | null;
}

export default function AddWBSModal({ isOpen, onClose, wbsItem, initialParentId }: Props) {
  const { currentProjectId, setCurrentProject } = useERPStore();
  
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsItems = wbsData?.flat || [];

  const { mutateAsync: createWBS } = useCreateWBSMutation(currentProjectId);
  const { mutateAsync: updateWBS } = useUpdateWBSMutation(currentProjectId);

  const [form, setForm] = useState({
    projectId: currentProjectId || projects[0]?.id || '',
    name: '',
    parentId: initialParentId || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (wbsItem) {
      setForm({
        projectId: wbsItem.projectId,
        name: wbsItem.name,
        parentId: wbsItem.parentId || '',
      });
    } else {
      setForm(prev => {
        const targetProjectId = currentProjectId || projects[0]?.id || '';
        const targetParentId = initialParentId || '';
        // Only update if we really need to, preventing unnecessary re-renders
        if (prev.projectId === targetProjectId && prev.name === '' && prev.parentId === targetParentId) {
          return prev;
        }
        return {
          projectId: targetProjectId,
          name: '',
          parentId: targetParentId,
        };
      });
    }
    // Safe dependencies: explicitly exclude `projects` to avoid reference loops.
  }, [isOpen, wbsItem, currentProjectId, initialParentId]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    if (field === 'projectId') {
      setCurrentProject(value);
    }
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const parentOptions = wbsItems.filter((w: any) =>
    (form.projectId ? w.projectId === form.projectId : true) && (wbsItem ? w.id !== wbsItem.id : true)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.name.trim()) return setError('Vui lòng nhập tên hạng mục');

    setLoading(true);
    try {
      const payload = {
        projectId: form.projectId,
        name: form.name.trim(),
        parentId: form.parentId || null,
      };

      if (wbsItem) {
        await updateWBS({ id: wbsItem.id, updates: payload });
      } else {
        await createWBS(payload);
      }
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-500 ring-1 ring-emerald-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {wbsItem ? <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /> : <path d="M12 3v5m-6 4h12M6 12v5m12-5v5" />}
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">{wbsItem ? 'Cập nhật hạng mục' : 'Thêm hạng mục WBS'}</h2>
              <p className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider">{wbsItem ? 'Chỉnh sửa mục công trình' : 'Tạo mục công trình mới'}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="erp-label">Dự án <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={form.projectId}
                disabled={!!wbsItem}
                onChange={e => handleChange('projectId', e.target.value)}
                className="erp-input w-full appearance-none pr-8 disabled:opacity-50"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div>
            <label className="erp-label">Hạng mục cha (tùy chọn)</label>
            <div className="relative">
              <select
                value={form.parentId}
                onChange={e => handleChange('parentId', e.target.value)}
                className="erp-input w-full appearance-none pr-8"
              >
                <option value="">-- Hạng mục gốc --</option>
                {parentOptions.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div>
            <label className="erp-label">Tên hạng mục <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="VD: 1. Công tác chuẩn bị"
              className="erp-input w-full"
              autoFocus
            />
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
              className="erp-btn bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              {wbsItem ? 'Cập nhật' : 'Thêm hạng mục'}
            </button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
