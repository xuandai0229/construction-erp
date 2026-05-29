import React from "react";

interface SignatureBlockProps {
  preparedBy?: string;
  recipientTitle?: string; // e.g. "Người nhận tiền", "Người giao tiền", "Thủ kho"
  chiefAccountant?: string;
  director?: string;
}

export function SignatureBlock({
  preparedBy = "Kế toán lập biểu",
  recipientTitle,
  chiefAccountant = "Kế toán trưởng",
  director = "Giám đốc",
}: SignatureBlockProps) {
  return (
    <div className="pt-8 border-t border-dashed border-zinc-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {/* Column 1: Prepared By */}
        <div className="space-y-12">
          <div>
            <h4 className="text-[11px] font-extrabold uppercase text-zinc-900">
              Người lập biểu
            </h4>
            <p className="text-[9px] text-zinc-500 italic">(Ký, họ tên)</p>
          </div>
          <div className="text-zinc-800 font-bold text-xs">{preparedBy}</div>
        </div>

        {/* Column 2: Recipient / Customer */}
        {recipientTitle && (
          <div className="space-y-12">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase text-zinc-900">
                {recipientTitle}
              </h4>
              <p className="text-[9px] text-zinc-500 italic">(Ký, họ tên)</p>
            </div>
            <div className="h-6" />
          </div>
        )}

        {/* Column 3: Chief Accountant */}
        <div className="space-y-12">
          <div>
            <h4 className="text-[11px] font-extrabold uppercase text-zinc-900">
              {chiefAccountant}
            </h4>
            <p className="text-[9px] text-zinc-500 italic">(Ký, họ tên)</p>
          </div>
          <div className="h-6" />
        </div>

        {/* Column 4: Director */}
        <div className="space-y-12 col-span-2 md:col-span-1">
          <div>
            <h4 className="text-[11px] font-extrabold uppercase text-zinc-900">
              {director}
            </h4>
            <p className="text-[9px] text-zinc-500 italic">(Ký, đóng dấu)</p>
          </div>
          <div className="h-6" />
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-zinc-400 italic">
        Sử dụng chứng từ điện tử nội bộ — Construction ERP Authority
      </div>
    </div>
  );
}
