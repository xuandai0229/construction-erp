'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { usePaymentsQuery, useDeletePaymentMutation } from '@/services/queries/useRevenues';
import type { PaymentRecord } from '@/app/types';
import { useAsyncAction } from '@/app/hooks/useAsyncAction';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export default function PaymentHistoryModal({ isOpen, onClose, invoiceId }: Props) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: payments = [], isLoading } = usePaymentsQuery(currentProjectId);
  const { mutateAsync: deletePayment } = useDeletePaymentMutation(currentProjectId);
  const { pendingKey, run } = useAsyncAction();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (!isOpen || !invoiceId) return null;

  const invoicePayments = (payments as PaymentRecord[]).filter((payment) => payment.invoiceId === invoiceId);
  const isDeleting = pendingKey?.startsWith('delete-payment') ?? false;

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await run(
      `delete-payment:${deleteTargetId}`,
      async () => {
        await deletePayment(deleteTargetId);
        setDeleteTargetId(null);
      },
      {
        successTitle: 'Đã hủy thanh toán',
        successMessage: 'Số dư hóa đơn và bút toán đảo đã được cập nhật.',
        errorTitle: 'Không thể hủy thanh toán',
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
            Lịch sử thanh toán HĐ: <span className="font-black text-blue-500">{invoiceId.substring(0, 8)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--table-head-bg)] overflow-hidden shadow-inner">
            <table className="erp-table w-full text-xs">
              <thead>
                <tr className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]">
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Diễn giải</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      <div className="flex justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : invoicePayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      Chưa có lịch sử thanh toán
                    </td>
                  </tr>
                ) : (
                  invoicePayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors group">
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-semibold">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-emerald-500 group-hover:text-emerald-400">
                        {formatVnd(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{payment.description || '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteTargetId(payment.id)}
                          disabled={pendingKey !== null}
                          className="text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 underline underline-offset-2 disabled:opacity-50 transition-colors"
                        >
                          Hủy
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-[var(--divider)]">
          <button onClick={onClose} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">
            Đóng
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hủy thanh toán"
        message="Thanh toán sẽ được hủy mềm, số dư hóa đơn được tính lại và bút toán liên quan được đảo để giữ audit trail."
        confirmLabel="Hủy thanh toán"
        cancelLabel="Giữ lại"
        variant="danger"
        businessContext="Không xóa cứng chứng từ tài chính. Mọi thay đổi được ghi nhận trong nhật ký kiểm toán và sổ cái."
      />
    </div>
  );
}
