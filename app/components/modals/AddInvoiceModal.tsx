'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useCreateInvoiceMutation } from '@/services/queries/useRevenues';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInvoiceModal({ isOpen, onClose }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);

  const { data: projectsData } = useProjectsQuery();
  const projects = projectsData?.data || [];
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbs = wbsData?.flat || [];

  const { mutateAsync: createInvoice } = useCreateInvoiceMutation(currentProjectId);

  const [form, setForm] = useState({
    projectId: currentProjectId || '',
    wbsId: '',
    amount: '',
    issuedDate: new Date().toISOString().split('T')[0],
  });

  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) return;

    if (!form.projectId && projects.length > 0) {
      setForm(prev => ({ ...prev, projectId: currentProjectId || projects[0].id }));
    }
    // Only reset requestId when modal opens for the first time or after submit
  }, [projectsData, currentProjectId, form.projectId, isOpen]);

  // Reset requestId only when modal CLOSES to prepare for next open
  useEffect(() => {
    if (!isOpen) {
      setRequestId(crypto.randomUUID());
    }
  }, [isOpen]);

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
    try {
      await createInvoice({
        projectId: form.projectId,
        wbsId: form.wbsId,
        amount: amount,
        issuedDate: form.issuedDate,
        requestId,
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
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Xuất hóa đơn (Invoice)</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="erp-label">Dự án</label>
            <select
              value={form.projectId}
              onChange={e => setForm({...form, projectId: e.target.value})}
              className="erp-input w-full"
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label">Hạng mục công trình (WBS)</label>
            <select
              value={form.wbsId}
              onChange={e => setForm({...form, wbsId: e.target.value})}
              className="erp-input w-full"
            >
              <option value="">-- Chọn hạng mục --</option>
              {wbs.filter((i: any) => i.projectId === form.projectId).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label">Giá trị hóa đơn (VND)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="erp-input w-full tabular-nums"
            />
          </div>
          <div>
            <label className="erp-label">Ngày xuất hóa đơn</label>
            <input
              type="date"
              value={form.issuedDate}
              onChange={e => setForm({...form, issuedDate: e.target.value})}
              className="erp-input w-full"
            />
          </div>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--divider)] mt-6">
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">Hủy</button>
            <button type="submit" disabled={loading} className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-60">Xuất hóa đơn</button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
