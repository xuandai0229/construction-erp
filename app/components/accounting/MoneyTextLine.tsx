import React from "react";
import { formatVnd } from "@/app/components/dashboard-data";
import { numberToVietnameseWords } from "@/lib/utils/numberToWords";

interface MoneyTextLineProps {
  amount: number | bigint;
}

export function MoneyTextLine({ amount }: MoneyTextLineProps) {
  const words = numberToVietnameseWords(amount);
  return (
    <div className="bg-[var(--secondary)]/40 border border-[var(--border)] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
          Tổng số tiền thanh toán:
        </span>
        <span className="text-base font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
          {formatVnd(Number(amount))}
        </span>
      </div>
      <div className="text-xs text-[var(--text-muted)] font-semibold italic border-t border-[var(--border)] pt-2 flex items-start gap-1">
        <span className="text-[var(--text-secondary)] shrink-0 font-bold not-italic">
          Bằng chữ:
        </span>
        <span className="text-[var(--text-primary)]">{words}</span>
      </div>
    </div>
  );
}
