'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { MoneyTextLine } from "@/app/components/accounting/MoneyTextLine";
import ReadonlyPostedBanner from "@/app/components/accounting/ReadonlyPostedBanner";
import { formatVnd } from "@/app/components/dashboard-data";
import { AuditedPrintStatus, useAuditedPrint } from "@/app/components/accounting/AuditedPrintGate";


export default function PrintInvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const audit = useAuditedPrint({
    printType: "INVOICE",
    entityId: id,
    route: `/print/invoice/${id}`,
    reason: "In hóa đơn/chứng từ doanh thu",
  });

  const [invoice, setInvoice] = useState<any>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && audit.status === "APPROVED") {
      // Fetch invoice and trace details in parallel
      Promise.all([
        fetch(`/api/invoices/${id}`).then(res => res.json()),
        fetch(`/api/invoices/${id}/financial-trace`).then(res => res.json())
      ])
        .then(([invRes, traceRes]) => {
          if (invRes.success) setInvoice(invRes.data);
          if (traceRes.success) setTraceData(traceRes.data);
        })
        .catch(err => console.error("Failed to load invoice for printing", err))
        .finally(() => setLoading(false));
    }
  }, [id, audit.status]);

  if (audit.status !== "APPROVED") {
    return <AuditedPrintStatus status={audit.status} error={audit.error} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu chứng từ in...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/10 text-xl font-black text-rose-500">!</div>
          <h2 className="mt-4 text-lg font-black text-[var(--text-primary)]">Không tìm thấy hóa đơn</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Chứng từ có thể đã bị xóa, chưa được ghi nhận hoặc đường dẫn không hợp lệ.</p>
          <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--secondary)] p-2">
            <span className="text-xs text-[var(--text-tertiary)]">Mã/ID đang mở: </span>
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{id}</span>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.history.back()} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--secondary)]">Quay lại</button>
            <a href="/" className="rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]">Về Tổng quan</a>
          </div>
        </div>
      </div>
    );
  }

  const isPosted = invoice.status === "PAID" || invoice.approvalStatus === "APPROVED";
  
  let dateStr = "—";
  if (invoice.issuedDate) {
    const d = new Date(invoice.issuedDate);
    if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString("vi-VN");
  }
  
  let dueDateStr = "—";
  if (invoice.dueDate) {
    const d = new Date(invoice.dueDate);
    if (!isNaN(d.getTime())) dueDateStr = d.toLocaleDateString("vi-VN");
  }

  return (
    <PrintLayout>
      {/* 1. Header Banner & Warnings */}
      {isPosted && (
        <div className="mb-4">
          <ReadonlyPostedBanner status={invoice.status} />
        </div>
      )}

      {/* 2. Document Header */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle="PHIẾU KẾ TOÁN (JOURNAL VOUCHER)"
        documentNo={invoice.invoiceNumber}
        dateStr={dateStr}
        project={invoice.project?.name || `Mã dự án: ${invoice.projectId}`}
      />

      {/* 3. Document Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-zinc-700">Hạng mục thi công (WBS):</span>{" "}
            <span className="text-zinc-900 font-semibold">{invoice.wbs?.name || "Chung"}</span>
          </div>
          <div>
            <span className="font-bold text-zinc-700">Ngày đến hạn thanh toán:</span>{" "}
            <span className="text-zinc-900 font-semibold">{dueDateStr}</span>
          </div>
        </div>

        {/* 4. Ledger Double-Entry Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-zinc-800 tracking-wider">
            Chi tiết định khoản sổ cái (Double-Entry Ledger)
          </h3>
          <table className="w-full text-[11px] border-collapse border border-black text-left">
            <thead>
              <tr className="bg-zinc-100">
                <th className="border border-black p-2 font-bold text-center w-12">STT</th>
                <th className="border border-black p-2 font-bold">Tên tài khoản sổ cái</th>
                <th className="border border-black p-2 font-bold text-center w-24">Số hiệu TK</th>
                <th className="border border-black p-2 font-bold text-right w-36">Phát sinh Nợ (Dr)</th>
                <th className="border border-black p-2 font-bold text-right w-36">Phát sinh Có (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {traceData?.ledgerLines && traceData.ledgerLines.length > 0 ? (
                traceData.ledgerLines.map((line: any, idx: number) => (
                  <tr key={line.id || idx}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-semibold">
                      {line.account?.name || "Tài khoản kế toán"}
                    </td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-violet-700">
                      {line.account?.code}
                    </td>
                    <td className="border border-black p-2 text-right font-mono text-emerald-600 font-bold">
                      {line.type === "DEBIT" ? formatVnd(line.amount) : "—"}
                    </td>
                    <td className="border border-black p-2 text-right font-mono text-rose-600 font-bold">
                      {line.type === "CREDIT" ? formatVnd(line.amount) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="border border-black p-4 text-center text-zinc-400 italic">
                    Chưa phát sinh bút toán sổ cái cho hóa đơn này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Money Translation Block */}
        <MoneyTextLine amount={Number(invoice.amount)} />
      </div>

      {/* 6. Signature Block */}
      <SignatureBlock
        recipientTitle="Người giao hóa đơn"
      />

      {/* Print Action Helper (Visible only on screen, hidden in print) */}
      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 print:hidden select-none">
        <button
          onClick={audit.print}
          className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded shadow transition-colors cursor-pointer"
        >
          Thực hiện In Phiếu
        </button>
      </div>
    </PrintLayout>
  );
}
