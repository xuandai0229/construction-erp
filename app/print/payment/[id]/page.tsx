'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { MoneyTextLine } from "@/app/components/accounting/MoneyTextLine";
import ReadonlyPostedBanner from "@/app/components/accounting/ReadonlyPostedBanner";
import { formatVnd } from "@/app/components/dashboard-data";

export default function PrintPaymentPage() {
  const params = useParams();
  const id = params?.id as string;

  const [payment, setPayment] = useState<any>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetch(`/api/payments/${id}`).then(res => res.json()),
        fetch(`/api/payments/${id}/financial-trace`).then(res => res.json())
      ])
        .then(([payRes, traceRes]) => {
          if (payRes.success) setPayment(payRes.data);
          if (traceRes.success) setTraceData(traceRes.data);
        })
        .catch(err => console.error("Failed to load payment for printing", err))
        .finally(() => setLoading(false));
    }
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu chứng từ in...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-rose-500 font-bold">
        Không tìm thấy chứng từ thanh toán hoặc có lỗi phát sinh.
      </div>
    );
  }

  const isPosted = payment.status === "POSTED";
  const dateStr = new Date(payment.date).toLocaleDateString("vi-VN");
  const isReceipt = payment.type === "RECEIPT";

  const docTitle = isReceipt ? "PHIẾU THU (RECEIPT VOUCHER)" : "PHIẾU CHI (PAYMENT VOUCHER)";
  const recipientTitle = isReceipt ? "Người nộp tiền" : "Người nhận tiền";

  return (
    <PrintLayout>
      {/* 1. Header Warnings */}
      {isPosted && (
        <div className="mb-4">
          <ReadonlyPostedBanner status={payment.status} />
        </div>
      )}

      {/* 2. Header Block */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle={docTitle}
        documentNo={payment.paymentNumber || payment.id}
        dateStr={dateStr}
        project={payment.project?.name || `Mã dự án: ${payment.projectId}`}
      />

      {/* 3. Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-zinc-700">Hình thức thanh toán:</span>{" "}
            <span className="text-zinc-900 font-semibold">{payment.method}</span>
          </div>
          <div>
            <span className="font-bold text-zinc-700">Diễn giải nội dung:</span>{" "}
            <span className="text-zinc-900 font-semibold">{payment.description || "N/A"}</span>
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
                    Chưa phát sinh hạch toán sổ cái cho phiếu này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Money Translation */}
        <MoneyTextLine amount={Number(payment.amount)} />
      </div>

      {/* 6. Signature Block */}
      <SignatureBlock
        recipientTitle={recipientTitle}
        chiefAccountant="Kế toán trưởng"
        director="Giám đốc công ty"
      />

      {/* Print Action Helper (Visible only on screen, hidden in print) */}
      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 print:hidden select-none">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded shadow transition-colors cursor-pointer"
        >
          Thực hiện In Phiếu
        </button>
      </div>
    </PrintLayout>
  );
}
