'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { formatVnd } from "@/app/components/dashboard-data";

function LedgerPrintContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId") || "";
  const accountCode = searchParams?.get("accountCode") || "";

  const [lines, setLines] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      // Fetch ledger data and project details
      Promise.all([
        fetch(`/api/reports/ledger-lines?projectId=${projectId}&accountCode=${accountCode}&page=1&limit=500`).then(res => res.json()),
        fetch(`/api/projects/${projectId}`).then(res => res.json())
      ])
        .then(([ledgerRes, projRes]) => {
          if (ledgerRes.success) setLines(ledgerRes.data.lines);
          if (projRes.success) setProject(projRes.data);
        })
        .catch(err => console.error("Failed to load ledger for printing", err))
        .finally(() => setLoading(false));
    }
  }, [projectId, accountCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu Sổ cái...
      </div>
    );
  }

  const debitTotal = lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
  const creditTotal = lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
  const dateStr = new Date().toLocaleDateString("vi-VN");

  return (
    <PrintLayout>
      {/* 1. Header */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle={`SỔ CÁI CHI TIẾT TÀI KHOẢN: ${accountCode || "TẤT CẢ"}`}
        documentNo={`SC-${accountCode || "ALL"}-${new Date().getFullYear()}`}
        dateStr={dateStr}
        project={project?.name || `Mã dự án: ${projectId}`}
      />

      {/* 2. Ledger Lines Table */}
      <div className="space-y-4">
        <table className="w-full text-[11px] border-collapse border border-black text-left">
          <thead>
            <tr className="bg-zinc-100 text-center">
              <th className="border border-black p-2 font-bold w-20">Ngày</th>
              <th className="border border-black p-2 font-bold w-28">Số CT</th>
              <th className="border border-black p-2 font-bold">Diễn giải / Chi tiết nghiệp vụ</th>
              <th className="border border-black p-2 font-bold w-24">Mã TK</th>
              <th className="border border-black p-2 font-bold w-28 text-right">Phát sinh Nợ (Dr)</th>
              <th className="border border-black p-2 font-bold w-28 text-right">Phát sinh Có (Cr)</th>
            </tr>
          </thead>
          <tbody>
            {lines.length > 0 ? (
              lines.map((line: any, idx: number) => (
                <tr key={line.id || idx}>
                  <td className="border border-black p-2 text-center">
                    {new Date(line.journalEntry.date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="border border-black p-2 text-center font-mono font-semibold">
                    {line.journalEntry.reference}
                  </td>
                  <td className="border border-black p-2 font-medium">
                    {line.description || line.journalEntry.description}
                  </td>
                  <td className="border border-black p-2 text-center font-mono font-bold">
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
                <td colSpan={6} className="border border-black p-4 text-center text-zinc-400 italic">
                  Không có phát sinh nào trong kỳ hạch toán này.
                </td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="bg-zinc-50 font-bold">
              <td colSpan={4} className="border border-black p-2 text-center uppercase">
                Tổng phát sinh trong kỳ
              </td>
              <td className="border border-black p-2 text-right font-mono text-emerald-600">
                {formatVnd(debitTotal)}
              </td>
              <td className="border border-black p-2 text-right font-mono text-rose-600">
                {formatVnd(creditTotal)}
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

export default function PrintLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Đang khởi tạo luồng Sổ cái...</div>}>
      <LedgerPrintContent />
    </Suspense>
  );
}
