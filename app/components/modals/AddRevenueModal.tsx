'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useCreateRevenueMutation } from '@/services/queries/useRevenues';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRevenueModal({ isOpen, onClose }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);

  const { data: projectsData } = useProjectsQuery();
  const projects = projectsData?.data || [];
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsItems = wbsData?.flat || [];

  const { mutateAsync: createRevenue } = useCreateRevenueMutation(currentProjectId);

  const [form, setForm] = useState({
    projectId: currentProjectId || '',
    wbsId: '',
    amount: '',
    status: 'unpaid' as 'paid' | 'unpaid',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isOpen) return;

    if (!form.projectId && projects.length > 0) {
      setForm(prev => ({ ...prev, projectId: currentProjectId || projects[0].id }));
    }
  }, [projectsData, currentProjectId, form.projectId, isOpen]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredWbs = wbsItems.filter((w: any) =>
    form.projectId ? w.projectId === form.projectId : true
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setError('Số tiền phải là số dương');

    setLoading(true);
    try {
      await createRevenue({
        projectId: form.projectId,
        wbsId: form.wbsId,
        amount: amount,
        status: form.status,
        description: form.description,
        date: form.date,
      });
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
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Ghi nhận doanh thu</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Dự án</label>
              <select
                value={form.projectId}
                onChange={e => setForm({...form, projectId: e.target.value, wbsId: ''})}
                className="erp-input w-full"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Hạng mục WBS</label>
              <select
                value={form.wbsId}
                onChange={e => setForm({...form, wbsId: e.target.value})}
                className="erp-input w-full"
              >
                <option value="">-- Chọn hạng mục --</option>
                {filteredWbs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Số tiền (VND)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="erp-input w-full tabular-nums"
              />
            </div>
            <div>
              <label className="erp-label">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value as 'paid' | 'unpaid'})}
                className="erp-input w-full"
              >
                <option value="unpaid">Chưa thu tiền</option>
                <option value="paid">Đã thu tiền</option>
              </select>
            </div>
          </div>
          <div>
            <label className="erp-label">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="erp-input w-full"
            />
          </div>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--divider)] mt-6">
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">Hủy</button>
            <button type="submit" disabled={loading} className="erp-btn bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60">Lưu doanh thu</button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
