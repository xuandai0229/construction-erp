'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostRecord, CostType } from '@/app/types';

interface AddCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costRecord?: CostRecord | null;
}

export default function AddCostModal({ isOpen, onClose, costRecord }: AddCostModalProps) {
  const [formData, setFormData] = useState({
    wbsId: '',
    note: '',
    amount: '',
    costType: 'material' as CostType,
    date: new Date().toISOString().split('T')[0],
    status: 'unpaid' as 'paid' | 'unpaid',
  });

  const wbsItems = useERPStore(s => s.wbs);
  const currentProjectId = useERPStore(s => s.currentProjectId);
  const addCost = useERPStore(s => s.addCost);
  const updateCost = useERPStore(s => s.updateCost);

  useEffect(() => {
    if (costRecord) {
      setFormData({
        wbsId: costRecord.wbsId,
        note: costRecord.note || '',
        amount: costRecord.amount.toString(),
        costType: costRecord.costType,
        date: new Date(costRecord.date).toISOString().split('T')[0],
        status: costRecord.status as 'paid' | 'unpaid',
      });
    } else {
      setFormData({
        wbsId: '',
        note: '',
        amount: '',
        costType: 'material',
        date: new Date().toISOString().split('T')[0],
        status: 'unpaid',
      });
    }
  }, [costRecord, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);

    if (costRecord) {
      updateCost(currentProjectId, costRecord.id, {
        ...formData,
        amount: amountNum,
      } as any);
    } else {
      addCost(
        currentProjectId, 
        formData.wbsId, 
        formData.costType, 
        amountNum
      );
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
        <div className="erp-modal md" onClick={e => e.stopPropagation()}>
          <div className="erp-modal-header">
            <h2 className="t-section-title">{costRecord ? 'Sửa chi phí' : 'Ghi nhận chi phí mới'}</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="erp-modal-body space-y-4">
              <div className="erp-form-group">
                <label className="t-label">Hạng mục thi công (WBS)</label>
                <select
                  required
                  value={formData.wbsId}
                  onChange={e => setFormData({ ...formData, wbsId: e.target.value })}
                  className="erp-select"
                >
                  <option value="">Chọn hạng mục...</option>
                  {wbsItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="erp-form-group">
                <label className="t-label">Nội dung chi tiết</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Thanh toán thép đợt 1..."
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="erp-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="erp-form-group">
                  <label className="t-label">Loại chi phí</label>
                  <select
                    value={formData.costType}
                    onChange={e => setFormData({ ...formData, costType: e.target.value as CostType })}
                    className="erp-select"
                  >
                    <option value="material">Vật liệu</option>
                    <option value="labor">Nhân công</option>
                    <option value="machine">Máy móc</option>
                    <option value="subcon">Thầu phụ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="t-label">Trạng thái thanh toán</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'paid' | 'unpaid' })}
                    className="erp-select"
                  >
                    <option value="unpaid">Chờ thanh toán (Công nợ)</option>
                    <option value="paid">Đã thanh toán xong</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="erp-form-group">
                  <label className="t-label">Số tiền (VND)</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="erp-input font-bold"
                  />
                </div>
                <div className="erp-form-group">
                  <label className="t-label">Ngày hạch toán</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="erp-input"
                  />
                </div>
              </div>
            </div>

            <div className="erp-modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary px-6">
                Hủy bỏ
              </button>
              <button type="submit" className="btn btn-primary px-8">
                {costRecord ? 'Cập nhật thay đổi' : 'Xác nhận ghi nhận'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
