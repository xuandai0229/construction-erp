import React from "react";
import { formatVnd } from "@/app/components/dashboard-data";
import { numberToVietnameseWords } from "@/lib/utils/numberToWords";

interface MoneyTextLineProps {
  amount: number | bigint;
}

export function MoneyTextLine({ amount }: MoneyTextLineProps) {
  const words = numberToVietnameseWords(amount);
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 uppercase">
          Tổng số tiền thanh toán:
        </span>
        <span className="text-base font-extrabold text-zinc-900 tabular-nums">
          {formatVnd(Number(amount))}
        </span>
      </div>
      <div className="text-xs text-zinc-600 font-semibold italic border-t border-zinc-200 pt-2 flex items-start gap-1">
        <span className="text-zinc-700 shrink-0 font-bold not-italic">
          Bằng chữ:
        </span>
        <span className="text-zinc-900">{words}</span>
      </div>
    </div>
  );
}
