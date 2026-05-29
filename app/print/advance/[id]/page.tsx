'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintLayout } from "@/app/components/accounting/PrintLayout";
import { AccountingDocumentHeader } from "@/app/components/accounting/AccountingDocumentHeader";
import { SignatureBlock } from "@/app/components/accounting/SignatureBlock";
import { MoneyTextLine } from "@/app/components/accounting/MoneyTextLine";
import ReadonlyPostedBanner from "@/app/components/accounting/ReadonlyPostedBanner";


export default function PrintAdvancePage() {
  const params = useParams();
  const id = params?.id as string;

  const [advance, setAdvance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/advances/${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) setAdvance(res.data);
        })
        .catch(err => console.error("Failed to load advance for printing", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Đang tải dữ liệu chứng từ tạm ứng...
      </div>
    );
  }

  if (!advance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-rose-500 font-bold">
        Không tìm thấy chứng từ tạm ứng hoặc có lỗi phát sinh.
      </div>
    );
  }

  const isPosted = advance.status === "PAID" || advance.status === "PARTIALLY_SETTLED" || advance.status === "SETTLED";
  const dateStr = new Date(advance.createdAt).toLocaleDateString("vi-VN");

  return (
    <PrintLayout>
      {/* 1. Header Warnings */}
      {isPosted && (
        <div className="mb-4">
          <ReadonlyPostedBanner status={advance.status} />
        </div>
      )}

      {/* 2. Header Block */}
      <AccountingDocumentHeader
        companyName="CÔNG TY CỔ PHẦN XÂY DỰNG ERPAUTHORITY"
        address="123 Đường Láng, Đống Đa, Hà Nội"
        documentTitle="GIẤY ĐỀ NGHỊ TẠM ỨNG (ADVANCE REQUEST)"
        documentNo={advance.requestNumber || advance.id}
        dateStr={dateStr}
        project={advance.project?.name || `Mã dự án: ${advance.projectId}`}
      />

      {/* 3. Details */}
      <div className="space-y-6">
        <div className="border border-black p-4 rounded space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-zinc-700">Người đề nghị tạm ứng:</span>{" "}
              <span className="text-zinc-900 font-extrabold">{advance.employee?.name || advance.employeeName || "Cán bộ công trình"}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-700">Bộ phận / Tổ đội:</span>{" "}
              <span className="text-zinc-900 font-semibold">Ban điều hành dự án</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-zinc-700">Nhà cung cấp / Đối tác liên kết:</span>{" "}
              <span className="text-zinc-900 font-semibold">{advance.supplier?.name || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-700">Hợp đồng xây dựng:</span>{" "}
              <span className="text-zinc-900 font-semibold">{advance.contract?.contractNumber || "N/A"}</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-2">
            <span className="font-bold text-zinc-700">Lý do đề nghị tạm ứng:</span>{" "}
            <p className="text-zinc-900 font-medium italic mt-1 bg-zinc-50 p-2 rounded">
              {advance.reason || "Tạm ứng chi phí mua vật tư công trình dở dang."}
            </p>
          </div>
        </div>

        {/* 4. Money Translation */}
        <MoneyTextLine amount={Number(advance.amount)} />
      </div>

      {/* 5. Signature Block */}
      <SignatureBlock
        recipientTitle="Người đề nghị"
        chiefAccountant="Kế toán trưởng duyệt"
        director="Giám đốc duyệt"
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
