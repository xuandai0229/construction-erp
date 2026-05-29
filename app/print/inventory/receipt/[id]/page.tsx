'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { MoneyTextLine } from "@/app/components/accounting/MoneyTextLine";

export default function PrintInventoryReceiptPage() {
  const params = useParams();
  const id = params?.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/inventory/documents/${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setDoc(res.data);
          }
        })
        .catch(err => console.error("Failed to load inventory document for printing", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu phiếu nhập kho...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-rose-500 font-bold">
        Không tìm thấy phiếu nhập kho hoặc có lỗi phát sinh.
      </div>
    );
  }

  const dateStr = new Date(doc.documentDate).toLocaleDateString("vi-VN");
  const totalAmount = doc.lines?.reduce((sum: number, line: any) => sum + (Number(line.quantity) * Number(line.unitCost)), 0) || 0;
  const totalPayment = doc.lines?.reduce((sum: number, line: any) => {
    const cost = Number(line.quantity) * Number(line.unitCost);
    const vat = cost * (Number(line.vatRate || 0) / 100);
    return sum + cost + vat;
  }, 0) || 0;

  return (
    <PrintLayout>
      {/* Header Block */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle="PHIẾU NHẬP KHO VẬT TƯ (INVENTORY RECEIPT)"
        documentNo={doc.documentNo}
        dateStr={dateStr}
        project={doc.project?.name || "Kho tổng"}
      />

      <div className="space-y-6 text-zinc-900 font-sans">
        {/* Metadata info */}
        <div className="border border-black p-4 rounded text-xs space-y-2">
          <div>
            <span className="font-bold text-zinc-700 font-sans">Lập theo dự án:</span>{" "}
            <span className="text-zinc-900 font-bold">{doc.project?.name || "N/A"}</span>
          </div>
          {doc.supplier && (
            <div>
              <span className="font-bold text-zinc-700 font-sans">Nhà cung cấp (Đơn vị giao):</span>{" "}
              <span className="text-zinc-900 font-bold">{doc.supplier.name}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-zinc-700 font-sans">Lý do nhập kho:</span>{" "}
            <span className="text-zinc-900 font-medium italic">{doc.description || "Nhập kho vật tư xây dựng"}</span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="border border-black rounded overflow-hidden">
          <table className="w-full text-xs text-left font-sans border-collapse">
            <thead className="bg-zinc-100 font-bold border-b border-black">
              <tr>
                <th className="p-2 border-r border-black w-8 text-center">STT</th>
                <th className="p-2 border-r border-black">Tên, nhãn hiệu vật tư</th>
                <th className="p-2 border-r border-black w-20 text-center">Mã số</th>
                <th className="p-2 border-r border-black w-16 text-center">ĐVT</th>
                <th className="p-2 border-r border-black w-24 text-center">Kho đích</th>
                <th className="p-2 border-r border-black w-20 text-right">Số lượng</th>
                <th className="p-2 border-r border-black w-24 text-right">Đơn giá</th>
                <th className="p-2 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {doc.lines?.map((line: any, idx: number) => {
                const lineTotal = Number(line.quantity) * Number(line.unitCost);
                return (
                  <tr key={idx}>
                    <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-black">{line.material.name}</td>
                    <td className="p-2 border-r border-black text-center font-mono">{line.material.code}</td>
                    <td className="p-2 border-r border-black text-center">{line.material.unit}</td>
                    <td className="p-2 border-r border-black text-center font-semibold">{line.targetWarehouse?.code || "-"}</td>
                    <td className="p-2 border-r border-black text-right font-mono">{Number(line.quantity).toLocaleString("vi-VN")}</td>
                    <td className="p-2 border-r border-black text-right font-mono">{Number(line.unitCost).toLocaleString("vi-VN")}</td>
                    <td className="p-2 text-right font-mono font-bold">{lineTotal.toLocaleString("vi-VN")}</td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-zinc-50 font-bold border-t border-black">
                <td colSpan={7} className="p-2 border-r border-black text-right">CỘNG TIỀN HÀNG:</td>
                <td className="p-2 text-right font-mono">{totalAmount.toLocaleString("vi-VN")}</td>
              </tr>
              <tr className="bg-zinc-100 font-bold">
                <td colSpan={7} className="p-2 border-r border-black text-right">TỔNG THANH TOÁN (CẢ VAT):</td>
                <td className="p-2 text-right font-mono text-blue-800">{totalPayment.toLocaleString("vi-VN")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Word Translation */}
        <MoneyTextLine amount={totalPayment} />
      </div>

      {/* Signature block */}
      <SignatureBlock
        recipientTitle="Người giao hàng"
        chiefAccountant="Kế toán trưởng"
        director="Thủ kho nhận"
      />

      {/* Print Action Helper */}
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
