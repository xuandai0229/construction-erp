'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { MoneyTextLine } from "@/app/components/accounting/MoneyTextLine";

export default function PrintBankTransferPage() {
  const params = useParams();
  const id = params?.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/cash-bank/documents/${id}`)
        .then(res => res.json())
        .then(res => {
          setDoc(res);
        })
        .catch(err => console.error("Failed to load bank document for printing", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu ủy nhiệm chi...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-rose-500 font-bold">
        Không tìm thấy ủy nhiệm chi hoặc có lỗi phát sinh.
      </div>
    );
  }

  const dateStr = new Date(doc.accountingDate).toLocaleDateString("vi-VN");

  return (
    <PrintLayout>
      {/* Header Block */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle="ỦY NHIỆM CHI (BANK TRANSFER ORDER)"
        documentNo={doc.documentNo}
        dateStr={dateStr}
        project={doc.project?.name || "Không thuộc dự án"}
      />

      {/* Details */}
      <div className="space-y-6 text-zinc-900 font-sans">
        <div className="border border-black p-4 rounded space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-zinc-700">Đơn vị trả tiền (Bên A):</span>{" "}
              <span className="text-zinc-900 font-extrabold">{doc.company?.name || "CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-700">Tại ngân hàng:</span>{" "}
              <span className="text-zinc-900 font-semibold">Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-zinc-700">Đơn vị nhận tiền (Bên B):</span>{" "}
              <span className="text-zinc-900 font-extrabold">{doc.partnerName || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-700">Tại tài khoản đối ứng:</span>{" "}
              <span className="text-zinc-900 font-bold font-mono">TK số {doc.partnerName ? "9999-XXXX-888" : "Chưa cập nhật"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-zinc-700">Số tài khoản ghi Nợ:</span>{" "}
              <span className="text-zinc-900 font-bold font-mono">{doc.debitAccount?.code}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-700">Số tài khoản ghi Có:</span>{" "}
              <span className="text-zinc-900 font-bold font-mono">{doc.creditAccount?.code}</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-2">
            <span className="font-bold text-zinc-700">Nội dung thanh toán:</span>{" "}
            <p className="text-zinc-900 font-medium italic mt-1 bg-zinc-50 p-2 rounded">
              {doc.description}
            </p>
          </div>
        </div>

        {/* Money Translation */}
        <MoneyTextLine amount={Number(doc.amount)} />
      </div>

      {/* Signature Block */}
      <SignatureBlock
        recipientTitle="Kế toán viên lập"
        chiefAccountant="Kế toán trưởng"
        director="Chủ tài khoản (Giám đốc)"
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
