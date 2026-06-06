"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatVnd, formatProjectName } from "../dashboard-data";
import { EnterpriseBadge } from "../ui-enterprise";

function severityLabel(severity: string) {
  if (severity === "HIGH") return "Cao";
  if (severity === "MEDIUM") return "Trung bình";
  return "Theo dõi";
}

function severityVariant(severity: string): "error" | "warning" | "neutral" {
  if (severity === "HIGH") return "error";
  if (severity === "MEDIUM") return "warning";
  return "neutral";
}

function moduleLabel(module: string) {
  if (module === "INVOICE") return "Quá hạn thanh toán";
  if (module === "ADVANCE") return "Tạm ứng chưa hoàn ứng";
  if (module === "COST") return "Vượt dự toán chi phí";
  if (module === "CONTRACT") return "Vượt giá trị hợp đồng";
  return "Cảnh báo kiểm soát";
}

type RiskAlertRow = {
  severity: string;
  module: string;
  documentNo?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  amount?: number | null;
  reason?: string | null;
  action?: string | null;
};

function RiskSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--secondary)]" />
      ))}
    </div>
  );
}

export function RiskAlertsPanel({ data, isLoading }: { data: RiskAlertRow[]; isLoading: boolean }) {
  const router = useRouter();
  const alerts = data || [];

  if (isLoading) return <RiskSkeleton />;

  if (!alerts.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)]/45 p-4">
        <div className="text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm font-black text-[var(--primary)]">✓</div>
          <div className="mt-3 text-sm font-black text-[var(--text-primary)]">Không có cảnh báo rủi ro</div>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
            Chưa phát hiện chứng từ vượt ngưỡng kiểm soát trong phạm vi dữ liệu hiện tại.
          </p>
        </div>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={() => router.push("/reports")} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--muted)]">
            Xem quy tắc kiểm soát
          </button>
          <button type="button" onClick={() => router.refresh()} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--muted)]">
            Kiểm tra lại dữ liệu
          </button>
          <button type="button" onClick={() => router.push("/reports")} className="h-9 rounded-md bg-[var(--primary)] px-3 text-xs font-bold text-white transition hover:opacity-90">
            Xem tất cả cảnh báo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 8).map((row, index) => (
        <article
          key={`${row.module}-${row.documentNo || index}`}
          className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/35 hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <EnterpriseBadge variant={severityVariant(row.severity)}>{severityLabel(row.severity)}</EnterpriseBadge>
                <span className="text-sm font-black text-[var(--text-primary)]">{moduleLabel(row.module)}</span>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{row.reason || "Cần kế toán rà soát chứng từ liên quan."}</p>
            </div>
            <div className="font-mono text-sm font-black tabular-nums text-[var(--text-primary)]">{formatVnd(row.amount || 0)}</div>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
            <div className="rounded-md bg-[var(--secondary)] px-3 py-2">
              <div className="font-bold text-[var(--text-tertiary)]">Công trình</div>
              <div className="mt-1 font-semibold text-[var(--text-primary)]">
                {row.projectCode ? `${row.projectCode} - ${formatProjectName(row.projectName)}` : formatProjectName(row.projectName)}
              </div>
            </div>
            <div className="rounded-md bg-[var(--secondary)] px-3 py-2">
              <div className="font-bold text-[var(--text-tertiary)]">Chứng từ liên quan</div>
              <div className="mt-1 font-semibold text-[var(--text-primary)]">{row.documentNo || "Chưa có số chứng từ"}</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => row.action && router.push(row.action)}
              disabled={!row.action}
              className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
            >
              Xem chi tiết
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
