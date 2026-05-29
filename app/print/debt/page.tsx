'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { formatVnd } from "@/app/components/dashboard-data";

function DebtPrintContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId") || "";

  const [invoices, setInvoices] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      Promise.all([
        fetch(`/api/invoices?projectId=${projectId}`).then(res => res.json()),
        fetch(`/api/projects/${projectId}`).then(res => res.json())
      ])
        .then(([invRes, projRes]) => {
          if (invRes.success) setInvoices(invRes.data);
          if (projRes.success) setProject(projRes.data);
        })
        .catch(err => console.error("Failed to load debt for printing", err))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu Công nợ...
      </div>
    );
  }

  const amountTotal = invoices.reduce((s, inv) => s + Number(inv.amount), 0);
  const paidTotal = invoices.reduce((s, inv) => s + Number(inv.paidAmount), 0);
  const remainingTotal = invoices.reduce((s, inv) => s + Number(inv.remainingAmount), 0);
  const dateStr = new Date().toLocaleDateString("vi-VN");

  return (
    <PrintLayout>
      {/* 1. Header */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle="BÁO CÁO TỔNG HỢP CÔNG NỢ PHẢI THU CHỦ ĐẦU TƯ (TK 131)"
        documentNo={`AR-${new Date().getFullYear()}`}
        dateStr={dateStr}
        project={project?.name || `Mã dự án: ${projectId}`}
      />

      {/* 2. Debt Lines Table */}
      <div className="space-y-4">
        <table className="w-full text-[11px] border-collapse border border-black text-left">
          <thead>
            <tr className="bg-zinc-100 text-center">
              <th className="border border-black p-2 font-bold w-12">STT</th>
              <th className="border border-black p-2 font-bold w-36">Mã hóa đơn</th>
              <th className="border border-black p-2 font-bold">Hạng mục WBS</th>
              <th className="border border-black p-2 font-bold w-24">Ngày phát hành</th>
              <th className="border border-black p-2 font-bold w-28 text-right">Tổng giá trị</th>
              <th className="border border-black p-2 font-bold w-28 text-right">Đã thanh toán</th>
              <th className="border border-black p-2 font-bold w-28 text-right">Còn phải thu</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv: any, idx: number) => (
                <tr key={inv.id || idx}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 text-center font-mono font-semibold">
                    {inv.invoiceNumber}
                  </td>
                  <td className="border border-black p-2 font-medium">
                    {inv.wbsName || "Chung"}
                  </td>
                  <td className="border border-black p-2 text-center">
                    {new Date(inv.issuedDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-zinc-900 font-medium">
                    {formatVnd(inv.amount)}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-emerald-600 font-semibold">
                    {formatVnd(inv.paidAmount)}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-rose-600 font-bold">
                    {formatVnd(inv.remainingAmount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border border-black p-4 text-center text-zinc-400 italic">
                  Không có công nợ phải thu phát sinh.
                </td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="bg-zinc-50 font-bold">
              <td colSpan={4} className="border border-black p-2 text-center uppercase">
                Tổng cộng toàn công trình
              </td>
              <td className="border border-black p-2 text-right font-mono text-zinc-900">
                {formatVnd(amountTotal)}
              </td>
              <td className="border border-black p-2 text-right font-mono text-emerald-600">
                {formatVnd(paidTotal)}
              </td>
              <td className="border border-black p-2 text-right font-mono text-rose-600">
                {formatVnd(remainingTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Signatures */}
      <SignatureBlock
        preparedBy="Kế toán viên lập biểu"
        chiefAccountant="Kế toán trưởng kiểm soát"
        director="Giám đốc ký duyệt"
      />

      {/* Print Trigger */}
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

export default function PrintDebtPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Đang khởi tạo luồng Công nợ...</div>}>
      <DebtPrintContent />
    </Suspense>
  );
}
