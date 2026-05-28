'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType, costType_LABELS, CostRecord } from '@/app/types';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useCreateCostMutation, useUpdateCostMutation } from '@/services/queries/useCosts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  costRecord?: CostRecord | null;
}

export default function AddCostModal({ isOpen, onClose, costRecord }: Props) {
  const { currentProjectId, setCurrentProject } = useERPStore();

  const { data: projectsData } = useProjectsQuery();
  const projects = projectsData?.data || [];
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsItems = wbsData?.flat || [];

  const { mutateAsync: createCost } = useCreateCostMutation();
  const { mutateAsync: updateCost } = useUpdateCostMutation(currentProjectId);

  const [form, setForm] = useState({
    projectId: currentProjectId || '',
    wbsId: '',
    costType: 'material' as CostType,
    quantity: '',
    unitPrice: '',
    note: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    vatRate: '10',
    retentionRate: '0',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate idempotency key
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) return;

    if (costRecord) {
      const displayQty = costRecord.quantity || 1;
      const displayPrice = costRecord.unitPrice || costRecord.amount;
      setForm({
        projectId: costRecord.projectId,
        wbsId: costRecord.wbsId,
        costType: costRecord.costType,
        quantity: displayQty.toString(),
        unitPrice: displayPrice.toString(),
        note: costRecord.note || '',
        supplier: (costRecord as any).supplier || '',
        date: costRecord.date.split('T')[0],
        vatRate: (costRecord as any).vatRate?.toString() || '10',
        retentionRate: (costRecord as any).retentionRate?.toString() || '0',
      });
    } else {
      setForm({
        projectId: currentProjectId || (projects.length > 0 ? projects[0].id : ''),
        wbsId: '',
        costType: 'material',
        quantity: '',
        unitPrice: '',
        note: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        vatRate: '10',
        retentionRate: '0',
      });
      setRequestId(crypto.randomUUID()); 
    }
  }, [isOpen, costRecord]); // Only depend on isOpen and costRecord

  const vatRateNum = parseFloat(form.vatRate) || 0;
  const retentionRateNum = parseFloat(form.retentionRate) || 0;
  const amount = (parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0);
  const netAmount = amount / (1 + vatRateNum / 100);
  const vatAmount = amount - netAmount;
  const retentionAmount = amount * (retentionRateNum / 100);
  const payableAmount = amount - retentionAmount;

  const filteredWbs = wbsItems.filter(w =>
    form.projectId ? w.projectId === form.projectId : true
  );

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    if (field === 'projectId') {
      setCurrentProject(value);
      setForm(prev => ({ ...prev, projectId: value, wbsId: '' }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError('Vui lòng chọn dự án');
    if (!form.wbsId) return setError('Vui lòng chọn hạng mục WBS');
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.unitPrice);
    if (!form.quantity || isNaN(qty) || qty <= 0) return setError('Số lượng phải là số dương');
    if (!form.unitPrice || isNaN(price) || price <= 0) return setError('Đơn giá phải là số dương');

    setLoading(true);
    try {
      const payload = {
        projectId: form.projectId,
        wbsId: form.wbsId,
        costType: form.costType,
        amount: amount,
        quantity: qty,
        unitPrice: price,
        note: form.note,
        supplier: form.supplier,
        date: form.date,
        requestId: costRecord ? undefined : requestId,
        vatRate: vatRateNum,
        retentionRate: retentionRateNum,
      };

      if (costRecord) {
        await updateCost({ id: costRecord.id, updates: payload });
      } else {
        await createCost(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600/20 text-amber-500 ring-1 ring-amber-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {costRecord ? <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /> : <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">{costRecord ? 'Cập nhật chi phí' : 'Ghi nhận chi phí'}</h2>
              <p className="text-[11px] text-[var(--text-muted)] font-bold tracking-wider">{costRecord ? 'Chỉnh sửa bản ghi chi phí' : 'Thêm phát sinh chi phí thực tế'}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <EnterpriseForm onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Dự án <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.projectId}
                  disabled={!!costRecord}
                  onChange={e => handleChange('projectId', e.target.value)}
                  className="erp-input w-full appearance-none pr-7 disabled:opacity-50"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>

            <div>
              <label className="erp-label">Hạng mục WBS <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.wbsId}
                  onChange={e => handleChange('wbsId', e.target.value)}
                  className="erp-input w-full appearance-none pr-7"
                >
                  <option value="">-- Chọn hạng mục --</option>
                  {filteredWbs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="erp-label">Loại chi phí</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(costType_LABELS) as [CostType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('costType', val)}
                  className={`h-8 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    form.costType === val
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                      : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Số lượng <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                placeholder="VD: 100"
                className="erp-input w-full"
              />
            </div>
            <div>
              <label className="erp-label">Đơn giá (VNĐ) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.unitPrice}
                onChange={e => handleChange('unitPrice', e.target.value)}
                placeholder="VD: 500000"
                className="erp-input w-full"
              />
            </div>
          </div>

          {/* VAT & Retention Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Thuế suất VAT <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={form.vatRate}
                  onChange={e => handleChange('vatRate', e.target.value)}
                  className="erp-input w-full appearance-none pr-7"
                >
                  <option value="0">0% (Không chịu thuế)</option>
                  <option value="5">5% (Thuế ưu đãi)</option>
                  <option value="8">8% (Giảm thuế VAT)</option>
                  <option value="10">10% (Tiêu chuẩn)</option>
                </select>
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>

            <div>
              <label className="erp-label">Giữ lại bảo hành (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={form.retentionRate}
                  onChange={e => handleChange('retentionRate', e.target.value)}
                  placeholder="VD: 5"
                  className="erp-input w-full pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[var(--text-muted)]">%</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Preview */}
          {amount > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <span>Trước thuế:</span>
                <span className="font-extrabold text-[var(--text-secondary)] tabular-nums">{Math.round(netAmount).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <span>Thuế VAT ({form.vatRate}%):</span>
                <span className="font-extrabold text-[var(--text-secondary)] tabular-nums">{Math.round(vatAmount).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2 mb-2">
                <span>Giữ lại bảo hành ({form.retentionRate}%):</span>
                <span className="font-extrabold text-amber-500 tabular-nums">-{Math.round(retentionAmount).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">Tổng hạch toán:</span>
                <span className="text-lg font-black text-blue-500 tabular-nums">{Math.round(amount).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Thực thanh toán đợt:</span>
                <span className="text-md font-black text-emerald-500 tabular-nums">{Math.round(payableAmount).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Nhà cung cấp / Đội thi công</label>
              <input
                type="text"
                value={form.supplier}
                onChange={e => handleChange('supplier', e.target.value)}
                placeholder="VD: Công ty A"
                className="erp-input w-full"
              />
            </div>
            <div>
              <label className="erp-label">Ngày phát sinh</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className="erp-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="erp-label">Ghi chú & Ảnh hiện trường</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.note}
                onChange={e => handleChange('note', e.target.value)}
                placeholder="Mô tả..."
                className="erp-input flex-1"
              />
              <button type="button" className="h-[38px] w-[38px] flex shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
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
            <button type="button" onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="erp-btn bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 disabled:opacity-60"
            >
              {loading
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              }
              {costRecord ? 'Cập nhật' : 'Ghi nhận chi phí'}
            </button>
          </div>
        </EnterpriseForm>
      </div>
    </div>
  );
}
