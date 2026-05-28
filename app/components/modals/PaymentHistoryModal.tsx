'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { usePaymentsQuery, useDeletePaymentMutation } from '@/services/queries/useRevenues';
import type { PaymentRecord } from '@/app/types';
import { useAsyncAction } from '@/app/hooks/useAsyncAction';
import { Column, EnterpriseEmptyState, EnterpriseTable } from '@/app/components/ui-enterprise';
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

  const invoicePayments = (payments as PaymentRecord[]).filter(payment => payment.invoiceId === invoiceId);
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

  const columns: Column<PaymentRecord>[] = [
    {
      header: 'Ngày',
      accessor: row => formatDate(row.date),
      align: 'center',
      width: '140px',
    },
    {
      header: 'Số tiền',
      accessor: row => <span className="font-black text-emerald-500">{formatVnd(row.amount)}</span>,
      align: 'right',
      width: '180px',
    },
    {
      header: 'Diễn giải',
      accessor: row => row.description || '--',
      width: '260px',
    },
    {
      header: 'Thao tác',
      accessor: row => (
        <button
          onClick={() => setDeleteTargetId(row.id)}
          disabled={pendingKey !== null}
          className="text-[11px] font-black uppercase tracking-wider text-rose-500 underline underline-offset-2 transition-colors hover:text-rose-400 disabled:opacity-50"
        >
          Hủy
        </button>
      ),
      align: 'center',
      width: '120px',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
            Lịch sử thanh toán HĐ: <span className="font-black text-blue-500">{invoiceId.substring(0, 8)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Đóng">
            x
          </button>
        </div>

        <div className="px-6 py-5">
          <EnterpriseTable
            data={invoicePayments}
            columns={columns}
            loading={isLoading}
            minWidth="700px"
            getRowKey={row => row.id}
            emptyState={
              <EnterpriseEmptyState
                title="Chưa có giao dịch"
                description="Hóa đơn này chưa có lịch sử thanh toán để đối chiếu."
                iconType="voucher"
              />
            }
          />
        </div>

        <div className="flex justify-end border-t border-[var(--divider)] px-6 py-4">
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
        message="Thanh toán sẽ được hủy mềm, số dư hóa đơn được tính lại và bút toán liên quan được đảo để giữ nhật ký kiểm toán."
        confirmLabel="Hủy thanh toán"
        cancelLabel="Giữ lại"
        variant="danger"
        businessContext="Không xóa cứng chứng từ tài chính. Mọi thay đổi được ghi nhận trong nhật ký kiểm toán và sổ cái."
      />
    </div>
  );
}
