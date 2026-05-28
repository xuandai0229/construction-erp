/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType } from '@/app/types';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useUpdateBudgetMutation } from '@/services/queries/useBudgets';

export interface WBSItem { id: string; projectId: string; name: string; }
export interface EditingBudget { id: string; wbsId: string; costType: CostType; estimatedAmount: number | string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingBudget: EditingBudget | null;
}

export default function EditBudgetModal({ isOpen, onClose, editingBudget }: Props) {
  const { currentProjectId } = useERPStore();
  
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsItems = wbsData?.flat || [];

  const { mutateAsync: updateBudget } = useUpdateBudgetMutation(currentProjectId);

  const [form, setForm] = useState({
    wbsId: '',
    costType: 'material' as CostType,
    estimatedAmount: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBudget && isOpen) {
      setForm({
        wbsId: editingBudget.wbsId || '',
        costType: editingBudget.costType || 'material',
        estimatedAmount: editingBudget.estimatedAmount ? String(editingBudget.estimatedAmount) : '',
      });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBudget, isOpen]);

  const filteredWbs = wbsItems.filter((w: WBSItem) =>
    currentProjectId ? w.projectId === currentProjectId : true
  );

  if (!isOpen || !editingBudget) return null;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const amount = parseFloat(form.estimatedAmount);
    if (!form.estimatedAmount || isNaN(amount) || amount <= 0) return setError('Dự toán phải là số dương');

    setLoading(true);
    try {
      await updateBudget({
        id: editingBudget.id,
        updates: {
          wbsId: form.wbsId,
          costType: form.costType,
          estimatedAmount: amount,
        }
      });
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-500 ring-1 ring-blue-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-black text-[var(--text-primary)]">Sửa Dự Toán</h2>
              <p className="text-[11.5px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Điều chỉnh chi phí đã duyệt</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="space-y-4 rounded-lg border border-[var(--border)] p-4 bg-[var(--secondary)]/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Thông tin hạng mục</h3>
            <div>
              <label className="erp-label">Hạng mục WBS <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.wbsId}
                  onChange={e => handleChange('wbsId', e.target.value)}
                  className="erp-input w-full appearance-none pr-8 font-semibold"
                >
                  <option value="">-- Chọn hạng mục phân bổ --</option>
                  {filteredWbs.map((w: WBSItem) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cơ cấu chi phí (Cost Type) <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries({
                material: 'Vật tư',
                labor: 'Nhân công',
                machine: 'Máy thi công',
                subcontract: 'Thầu phụ',
                overhead: 'Chi phí chung',
                other: 'Khác'
              }) as [any, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('costType', val)}
                  className={`h-8 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    form.costType === val
                      ? 'border border-blue-500 bg-blue-500/10 text-blue-500'
                      : 'border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Giá trị tài chính <span className="text-red-500">*</span></h3>
            <div>
              <input
                type="number"
                min="0"
                step="any"
                value={form.estimatedAmount}
                onChange={e => handleChange('estimatedAmount', e.target.value)}
                placeholder="Nhập số tiền dự toán..."
                className="erp-input w-full tabular-nums text-xl font-black text-blue-600 h-12"
                autoFocus
              />
              <div className="mt-2 text-right text-[12px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md inline-block float-right">
                = {form.estimatedAmount && !isNaN(parseFloat(form.estimatedAmount)) ? parseFloat(form.estimatedAmount).toLocaleString('vi-VN') : '0'} VNĐ
              </div>
              <div className="clear-both"></div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500 font-medium">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--divider)]">
            <button type="button" onClick={onClose} className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-bold">
              Hủy bỏ
            </button>
            <button type="submit" disabled={loading} className="erp-btn bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 px-6">
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="16" strokeDashoffset="16"/></svg>
              ) : (
                <>Cập nhật</>
              )}
            </button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
