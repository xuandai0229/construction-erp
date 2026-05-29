import React from "react";

interface AccountingDocumentHeaderProps {
  companyName: string;
  address?: string;
  documentTitle: string;
  documentNo: string;
  dateStr: string;
  project?: string;
}

export function AccountingDocumentHeader({
  companyName,
  address = "123 Đường Láng, Đống Đa, Hà Nội",
  documentTitle,
  documentNo,
  dateStr,
  project,
}: AccountingDocumentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between items-start border-b-2 border-black pb-4">
      {/* Left Column: Company Details */}
      <div className="space-y-1">
        <h3 className="font-extrabold uppercase text-xs tracking-wider text-zinc-900">
          {companyName}
        </h3>
        <p className="text-[10px] text-zinc-700 font-medium">
          Địa chỉ: {address}
        </p>
        {project && (
          <p className="text-[10px] text-zinc-700 font-bold">
            Dự án: <span className="underline">{project}</span>
          </p>
        )}
      </div>

      {/* Right Column: Document Details */}
      <div className="mt-4 sm:mt-0 text-left sm:text-right space-y-1">
        <h1 className="text-lg font-black uppercase text-zinc-900 tracking-wider">
          {documentTitle}
        </h1>
        <p className="text-[11px] font-bold text-zinc-800">
          Số chứng từ: <span className="font-mono">{documentNo}</span>
        </p>
        <p className="text-[10px] text-zinc-600 font-medium italic">
          Ngày lập: {dateStr}
        </p>
        <p className="text-[9px] text-zinc-500 font-bold border border-zinc-300 px-1 py-0.5 inline-block rounded">
          Mẫu biểu Thông tư 200/2014/TT-BTC
        </p>
      </div>
    </div>
  );
}
