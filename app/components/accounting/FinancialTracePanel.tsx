'use client';

import React, { useState, useEffect } from 'react';
import ReadonlyPostedBanner from './ReadonlyPostedBanner';
import DocumentStatusTimeline from './DocumentStatusTimeline';
import AllocationLinesTable from './AllocationLinesTable';
import JournalLinesTable from './JournalLinesTable';
import AuditTimeline from './AuditTimeline';
import { formatVnd } from '@/app/components/dashboard-data';
import { EnterpriseCard } from '@/app/components/ui-enterprise';

interface FinancialTracePanelProps {
  type: 'contract' | 'invoice' | 'payment' | 'advance' | 'cost';
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FinancialTracePanel({ type, id, isOpen, onClose }: FinancialTracePanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !id) return;

    const fetchTrace = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        let url = '';
        if (type === 'invoice') {
          url = `/api/invoices/${id}/financial-trace`;
        } else if (type === 'payment') {
          url = `/api/payments/${id}/financial-trace`;
        } else if (type === 'contract') {
          url = `/api/contracts/${id}/financial-trace`;
        } else if (type === 'advance') {
          url = `/api/advances/${id}/financial-trace`;
        } else if (type === 'cost') {
          url = `/api/costs/${id}/financial-trace`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Lỗi kết nối máy chủ (${res.status})`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu truy vết.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrace();
  }, [type, id, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-[var(--background)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full animate-slide-in select-none">
      {/* Background Overlay */}
      <div className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-col space-y-1">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            TRUY VẾT TÀI CHÍNH KẾ TOÁN (FINANCIAL TRACE)
          </h2>
          <p className="text-[11px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider">
            Đối chiếu kiểm toán từ chứng từ nguồn {type.toUpperCase()} ID: {id.substring(0, 8).toUpperCase()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full border border-[var(--border)] hover:bg-[var(--muted)] flex items-center justify-center text-sm font-extrabold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          aria-label="Đóng panel"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-xs text-[var(--text-secondary)] font-bold">Đang truy xuất vết kế toán thực tế...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-semibold leading-relaxed flex gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-bold block mb-1">Không thể tải dữ liệu truy vết:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* 1. Banner status locked if applicable */}
            {data.invoiceId && (
              <ReadonlyPostedBanner status={data.status || "POSTED"} />
            )}
            {data.paymentId && (
              <ReadonlyPostedBanner status="PAID" />
            )}

            {/* 2. Timeline Status */}
            <DocumentStatusTimeline status={data.status || (data.paymentId ? "POSTED" : "APPROVED")} />

            {/* 3. Basic Overview Summary Card */}
            <EnterpriseCard title="THÔNG TIN CHỨNG TỪ NGUỒN" subtitle="Thông tin định danh và số liệu tài chính gốc">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Loại chứng từ</span>
                  <span className="text-xs font-black text-blue-500 mt-1 uppercase">{type}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Số tiền gốc</span>
                  <span className="text-xs font-black text-[var(--text-primary)] font-mono mt-1">
                    {formatVnd(Number(data.amount || data.value || 0))}
                  </span>
                </div>
                {data.paidAmount !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Đã thanh toán</span>
                    <span className="text-xs font-black text-emerald-500 font-mono mt-1">
                      {formatVnd(Number(data.paidAmount))}
                    </span>
                  </div>
                )}
                {data.remainingAmount !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Số dư còn lại</span>
                    <span className="text-xs font-black text-amber-500 font-mono mt-1">
                      {formatVnd(Number(data.remainingAmount))}
                    </span>
                  </div>
                )}
              </div>
            </EnterpriseCard>

            {/* 4. Warning if missing source document */}
            {type === 'payment' && !data.invoice && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[11px] font-bold flex gap-2 select-none">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>CẢNH BÁO: Giao dịch thanh toán này không được liên kết trực tiếp với Hóa đơn mua hàng/nghiệm thu. Vui lòng đối chiếu thủ công!</span>
              </div>
            )}

            {/* 5. Allocations details */}
            {data.allocations && (
              <AllocationLinesTable allocations={data.allocations} />
            )}

            {/* 6. Journal Entries */}
            {data.journals && (
              <JournalLinesTable entries={data.journals} />
            )}

            {/* 7. Audit timeline */}
            {data.auditLogs && (
              <AuditTimeline logs={data.auditLogs} />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold border border-[var(--border)] bg-[var(--secondary)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
}
