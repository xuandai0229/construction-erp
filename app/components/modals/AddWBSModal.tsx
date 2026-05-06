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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {wbsItem ? <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /> : <path d="M12 3v5m-6 4h12M6 12v5m12-5v5" />}
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">{wbsItem ? 'Cập nhật hạng mục' : 'Thêm hạng mục WBS'}</h2>
              <p className="text-xs text-slate-500">{wbsItem ? 'Chỉnh sửa mục công trình' : 'Tạo mục công trình mới'}</p>
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
                disabled={!!wbsItem}
                onChange={e => handleChange('projectId', e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hạng mục cha (tùy chọn)</label>
            <div className="relative">
              <select
                value={form.parentId}
                onChange={e => handleChange('parentId', e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Hạng mục gốc --</option>
                {parentOptions.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên hạng mục <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="VD: 1. Công tác chuẩn bị"
              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
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
              className="flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              {wbsItem ? 'Cập nhật' : 'Thêm hạng mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

