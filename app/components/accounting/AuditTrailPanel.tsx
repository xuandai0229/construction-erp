"use client";

import { useEffect, useMemo, useState } from "react";
import { formatVnd } from "@/app/components/dashboard-data";

interface AuditUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AuditItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData: unknown;
  newData: unknown;
  reason: string | null;
  severity: string;
  correlationId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: AuditUser | null;
}

interface AuditTrailPanelProps {
  entityType?: string | null;
  entityId?: string | null;
  recent?: boolean;
  scope?: "financial-reports";
  title?: string;
  description?: string;
  limit?: number;
  className?: string;
}

const actionLabels: Record<string, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  ARCHIVE: "Lưu trữ",
  SUBMIT: "Gửi duyệt",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  POST: "Ghi sổ",
  POST_PAYMENT: "Ghi sổ thanh toán",
  UNPOST: "Hủy ghi sổ",
  REVERSE: "Đảo bút toán",
  RESTORE: "Khôi phục",
  LOCK: "Khóa",
  UNLOCK: "Mở khóa",
  EXPORT: "Xuất báo cáo",
  PRINT: "In chứng từ",
  LOGIN: "Đăng nhập",
  SECURITY_ALERT: "Cảnh báo bảo mật",
  ALLOCATE: "Phân bổ",
};

const entityLabels: Record<string, string> = {
  Project: "Công trình",
  CostRecord: "Chi phí",
  Invoice: "Hóa đơn",
  Payment: "Thanh toán",
  AdvanceRequest: "Tạm ứng",
  AdvanceSettlement: "Hoàn ứng",
  CashBankDocument: "Phiếu thu/chi",
  InventoryDocument: "Chứng từ kho",
  JournalEntry: "Bút toán",
  FinancialExport: "Xuất báo cáo",
  FinancialPrint: "In báo cáo",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Quản trị tối cao",
  ADMIN: "Quản trị",
  CFO: "Giám đốc tài chính",
  ACCOUNTANT: "Kế toán",
  AUDITOR: "Kiểm toán",
  MANAGER: "Quản lý",
  VIEWER: "Chỉ xem",
  BRANCH_DIRECTOR: "Giám đốc chi nhánh",
  GROUP_DIRECTOR: "Giám đốc tập đoàn",
};

const sensitiveKeyPattern = /(password|token|secret|apiKey|accessKey|refreshToken|privateKey|authorization)/i;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "---";
  if (typeof value === "number") return Math.abs(value) >= 1000 ? formatVnd(value) : String(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") {
    const date = new Date(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("vi-VN").format(date);
    }
    return value;
  }
  return "Dữ liệu kỹ thuật";
}

function flattenPreview(value: unknown, maxItems = 6) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKeyPattern.test(key))
    .slice(0, maxItems)
    .map(([key, entryValue]) => ({ key, value: formatValue(entryValue) }));
}

function stringifyPayload(value: unknown) {
  if (!value) return "Không có dữ liệu";
  return JSON.stringify(value, null, 2);
}

export default function AuditTrailPanel({
  entityType,
  entityId,
  recent = false,
  scope,
  title = "Lịch sử thao tác",
  description,
  limit = 20,
  className = "",
}: AuditTrailPanelProps) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canFetchEntity = Boolean(entityType && entityId);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (recent) {
      if (scope) params.set("scope", scope);
      return `/api/audit/recent?${params.toString()}`;
    }
    if (!canFetchEntity) return "";
    params.set("entityType", entityType || "");
    params.set("entityId", entityId || "");
    return `/api/audit/entity?${params.toString()}`;
  }, [canFetchEntity, entityId, entityType, limit, recent, scope]);

  useEffect(() => {
    if (!endpoint) {
      return;
    }

    const controller = new AbortController();

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return fetch(endpoint, { signal: controller.signal });
      })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Không thể tải lịch sử thao tác.");
        }
        setItems(payload.data?.items || []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không thể tải lịch sử thao tác.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [endpoint]);

  const visibleItems = endpoint ? items : [];

  return (
    <section className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            {description || "Dữ liệu audit chỉ đọc, phục vụ theo dõi thao tác và đối chiếu trách nhiệm."}
          </p>
        </div>
        <span className="w-fit rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
          Read-only
        </span>
      </div>

      {loading && (
        <div className="mt-4 flex h-28 items-center justify-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
          <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
          Đang tải lịch sử thao tác...
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-5 text-center text-sm font-semibold text-[var(--text-secondary)]">
          Chưa có lịch sử thao tác cho dữ liệu này.
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="mt-4 space-y-3">
          {visibleItems.map((item) => {
            const oldPreview = flattenPreview(item.oldData);
            const newPreview = flattenPreview(item.newData);
            const actor = item.user?.name || item.user?.email || "Hệ thống";
            const role = item.user?.role ? roleLabels[item.user.role] || item.user.role : "Chưa có dữ liệu";

            return (
              <article key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                        {actionLabels[item.action] || item.action}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{entityLabels[item.entity] || item.entity}</span>
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{item.entityId}</span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-bold text-[var(--text-primary)]">{actor}</span>
                      <span> - {role}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-semibold text-[var(--text-tertiary)]">
                    {formatDateTime(item.timestamp)}
                  </div>
                </div>

                {item.reason && <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Lý do/ghi chú: {item.reason}</p>}

                {(oldPreview.length > 0 || newPreview.length > 0) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-[var(--border)] p-3">
                      <div className="text-[10px] font-black uppercase text-[var(--text-tertiary)]">Dữ liệu trước</div>
                      <dl className="mt-2 space-y-1">
                        {oldPreview.length === 0 ? (
                          <div className="text-xs text-[var(--text-tertiary)]">Không có dữ liệu</div>
                        ) : (
                          oldPreview.map((entry) => (
                            <div key={entry.key} className="flex justify-between gap-3 text-xs">
                              <dt className="text-[var(--text-tertiary)]">{entry.key}</dt>
                              <dd className="max-w-[60%] truncate text-right font-semibold text-[var(--text-secondary)]">{entry.value}</dd>
                            </div>
                          ))
                        )}
                      </dl>
                    </div>
                    <div className="rounded-md border border-[var(--border)] p-3">
                      <div className="text-[10px] font-black uppercase text-[var(--text-tertiary)]">Dữ liệu sau</div>
                      <dl className="mt-2 space-y-1">
                        {newPreview.length === 0 ? (
                          <div className="text-xs text-[var(--text-tertiary)]">Không có dữ liệu</div>
                        ) : (
                          newPreview.map((entry) => (
                            <div key={entry.key} className="flex justify-between gap-3 text-xs">
                              <dt className="text-[var(--text-tertiary)]">{entry.key}</dt>
                              <dd className="max-w-[60%] truncate text-right font-semibold text-[var(--text-secondary)]">{entry.value}</dd>
                            </div>
                          ))
                        )}
                      </dl>
                    </div>
                  </div>
                )}

                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-bold text-[var(--primary)]">Xem chi tiết kỹ thuật</summary>
                  <div className="mt-2 grid gap-2 text-[11px] text-[var(--text-secondary)] md:grid-cols-2">
                    <div>IP: {item.ipAddress || "Chưa có dữ liệu"}</div>
                    <div>UserAgent: {item.userAgent || "Chưa có dữ liệu"}</div>
                    <div>RequestId: {item.requestId || "Chưa có dữ liệu"}</div>
                    <div>CorrelationId: {item.correlationId || "Chưa có dữ liệu"}</div>
                  </div>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-black/80 p-3 text-[11px] leading-5 text-zinc-100">
                    {stringifyPayload({ oldData: item.oldData, newData: item.newData })}
                  </pre>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
