'use client';

import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function PaymentHistoryModal({ isOpen, onClose, invoiceId }: Props) {
  const payments = useERPStore(state => state.payments);
  const deletePayment = useERPStore(state => state.deletePayment);

  if (!isOpen || !invoiceId) return null;

  const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bản ghi thanh toán này? Số dư hóa đơn sẽ được tính toán lại.')) {
      deletePayment(id);
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal lg" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">Lịch sử thanh toán</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="erp-modal-body">
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{width: '15%'}}>Ngày</th>
                  <th style={{width: '25%'}}>Số tiền</th>
                  <th style={{width: '40%'}}>Diễn giải</th>
                  <th style={{width: '20%'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoicePayments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td className="text-money text-[var(--success)] font-bold">{formatVnd(p.amount)}</td>
                    <td>{p.description || '—'}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-[var(--danger)] hover:text-[var(--danger-hover)] font-semibold text-sm underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {invoicePayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-[var(--text-muted)] py-8">
                      Chưa có lịch sử thanh toán
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

