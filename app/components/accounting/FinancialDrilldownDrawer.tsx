"use client";

import { useEffect, useMemo, useState } from "react";
import { formatVnd } from "@/app/components/dashboard-data";
import { EnterpriseDataTable, EnterpriseTabs } from "@/app/components/ui-enterprise";
import AuditTrailPanel from "@/app/components/accounting/AuditTrailPanel";

export type FinancialMetricKey =
  | "revenue"
  | "cost"
  | "profit"
  | "receivables"
  | "payables"
  | "payments"
  | "advances"
  | "contractValue"
  | "budget";

interface FinancialDrilldownRequest {
  metric: FinancialMetricKey;
  title: string;
  projectId?: string | null;
  projectName?: string | null;
  amount?: number;
  sourceOfTruth?: string;
}

interface SourceDocumentRow {
  id: string;
  sourceType: string;
  date: string;
  number: string;
  projectName?: string | null;
  partnerName?: string | null;
  contractName?: string | null;
  description?: string | null;
  amount: number;
  status: string;
}

interface JournalLineRow {
  id: string;
  accountCode: string;
  accountName: string;
  type: "DEBIT" | "CREDIT" | string;
  amount: number;
  description?: string;
}

interface JournalEntryRow {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: string;
  sourceType?: string | null;
  sourceId?: string | null;
  projectName?: string;
  lines: JournalLineRow[];
}

interface DrilldownData {
  title: string;
  totalAmount: number;
  sourceOfTruth: string;
  project?: { id: string; name: string } | null;
  sourceDocuments: SourceDocumentRow[];
  journalEntries: JournalEntryRow[];
  auditTrail: unknown[];
  warnings: string[];
}

interface FinancialDrilldownDrawerProps {
  request: FinancialDrilldownRequest | null;
  onClose: () => void;
}

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "documents", label: "Chứng từ nguồn" },
  { id: "journals", label: "Bút toán" },
  { id: "contracts", label: "Hợp đồng/NCC" },
  { id: "audit", label: "Lịch sử thao tác" }
];

function formatDate(value?: string | Date | null) {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function statusLabel(value?: string | null) {
  const normalized = (value || "").toUpperCase();
  const map: Record<string, string> = {
    DRAFT: "Nháp",
    PENDING: "Chờ duyệt",
    SUBMITTED: "Đã trình",
    APPROVED: "Đã duyệt",
    SENT: "Đã gửi",
    PARTIAL: "Thanh toán một phần",
    PAID: "Đã thanh toán",
    OVERDUE: "Quá hạn",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    DA_CAT: "Đã ghi sổ",
    POSTED: "Đã ghi sổ",
    FULLY_SETTLED: "Đã hoàn ứng",
    PARTIALLY_SETTLED: "Hoàn ứng một phần"
  };
  return map[normalized] || value || "---";
}

function sourceTypeLabel(value?: string | null) {
  const normalized = (value || "").toUpperCase();
  const map: Record<string, string> = {
    INVOICE: "Hóa đơn",
    PAYMENT: "Thanh toán",
    COST: "Chi phí",
    ADVANCE: "Tạm ứng",
    ADVANCE_SETTLEMENT: "Hoàn ứng",
    BUDGET: "Dự toán",
    CONTRACT: "Hợp đồng",
    VENDOR_PAYMENT: "Thanh toán NCC",
    CASH_BANK: "Thu/chi tiền"
  };
  return map[normalized] || value || "---";
}

function buildSourceUrl(row: SourceDocumentRow) {
  const type = row.sourceType.toUpperCase();
  if (type === "INVOICE") return `/print/invoice/${row.id}`;
  if (type === "PAYMENT") return `/print/payment/${row.id}`;
  if (type === "ADVANCE") return `/print/advance/${row.id}`;
  return "";
}

export default function FinancialDrilldownDrawer({ request, onClose }: FinancialDrilldownDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<DrilldownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;

    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const params = new URLSearchParams({ metric: request.metric });
        if (request.projectId) params.set("projectId", request.projectId);
        const response = await fetch(`/api/trace/financial-drilldown?${params.toString()}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "Không thể tải dữ liệu truy vết.");
        }
        setData(json.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu truy vết.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [request, onClose]);

  const journalLines = useMemo(
    () =>
      (data?.journalEntries || []).flatMap((entry) =>
        entry.lines.map((line) => ({
          ...line,
          journalDate: entry.date,
          journalCode: entry.reference,
          journalDescription: entry.description,
          status: entry.status,
          sourceType: entry.sourceType || "",
          sourceId: entry.sourceId || ""
        }))
      ),
    [data]
  );

  if (!request) return null;

  const totalAmount = data?.totalAmount ?? request.amount ?? 0;
  const projectName = data?.project?.name || request.projectName || "Toàn bộ phạm vi được phép";
  const sourceOfTruth = data?.sourceOfTruth || request.sourceOfTruth || "Pilot read-only";

  return (
    <div className="fixed inset-0 z-[600]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[var(--text-primary)]">{request.title}</h2>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  Pilot trace
                </span>
              </div>
              <div className="grid gap-2 text-[11px] font-semibold text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
                <span>Công trình: {projectName}</span>
                <span>Kỳ/filter: Theo màn hình hiện tại</span>
                <span className="font-mono tabular-nums">Tổng tiền: {formatVnd(totalAmount)}</span>
                <span>Nguồn số liệu: {sourceOfTruth}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-lg font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Đóng truy vết tài chính"
            >
              x
            </button>
          </div>
          {(data?.warnings || []).map((warning) => (
            <div key={warning} className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              {warning}
            </div>
          ))}
        </header>

        <EnterpriseTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
              <span className="text-xs font-bold">Đang tải dữ liệu truy vết...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {!loading && !error && activeTab === "overview" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Tổng tiền</div>
                <div className="mt-2 font-mono text-xl font-black text-[var(--text-primary)] tabular-nums">{formatVnd(totalAmount)}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Chứng từ nguồn</div>
                <div className="mt-2 text-xl font-black text-[var(--text-primary)]">{data?.sourceDocuments?.length || 0}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Bút toán liên quan</div>
                <div className="mt-2 text-xl font-black text-[var(--text-primary)]">{data?.journalEntries?.length || 0}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 md:col-span-3">
                <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Ghi chú pilot</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Drawer này chỉ dùng để truy vết nhanh chỉ tiêu tài chính. Nếu chưa có trace chi tiết cho chỉ tiêu này trong pilot, vui lòng xem báo cáo sổ cái hoặc chứng từ liên quan.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && activeTab === "documents" && (
            <EnterpriseDataTable
              data={data?.sourceDocuments || []}
              minWidth="1180px"
              columns={[
                { key: "date", header: "Ngày", render: (row) => formatDate(row.date), width: "120px" },
                { key: "sourceType", header: "Loại chứng từ", render: (row) => sourceTypeLabel(row.sourceType), width: "140px" },
                { key: "number", header: "Số chứng từ", render: (row) => row.number, width: "140px" },
                { key: "projectName", header: "Công trình", render: (row) => row.projectName || projectName, width: "180px" },
                { key: "partnerName", header: "Nhà cung cấp/Khách hàng", render: (row) => row.partnerName || "---", width: "190px" },
                { key: "contractName", header: "Hợp đồng", render: (row) => row.contractName || "---", width: "180px" },
                { key: "description", header: "Diễn giải", render: (row) => row.description || "---", width: "220px" },
                { key: "amount", header: "Số tiền", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                { key: "status", header: "Trạng thái", render: (row) => statusLabel(row.status), align: "center", width: "140px" },
                {
                  key: "action",
                  header: "Thao tác",
                  render: (row) => {
                    const url = buildSourceUrl(row);
                    return url ? (
                      <a className="text-[11px] font-bold text-[var(--primary)] hover:underline" href={url} target="_blank" rel="noreferrer">
                        Mở chứng từ
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--text-tertiary)]">Chưa có route in</span>
                    );
                  },
                  align: "center",
                  width: "130px"
                }
              ]}
              emptyState={<div className="text-sm font-semibold text-[var(--text-secondary)]">Chưa tìm thấy chứng từ nguồn phù hợp với số liệu này.</div>}
            />
          )}

          {!loading && !error && activeTab === "journals" && (
            <EnterpriseDataTable
              data={journalLines}
              minWidth="1040px"
              columns={[
                { key: "journalDate", header: "Ngày ghi sổ", render: (row) => formatDate(row.journalDate), width: "120px" },
                { key: "journalCode", header: "Mã bút toán", render: (row) => row.journalCode, width: "140px" },
                { key: "debit", header: "Tài khoản Nợ", render: (row) => (row.type === "DEBIT" ? `${row.accountCode} - ${row.accountName}` : "---"), width: "180px" },
                { key: "credit", header: "Tài khoản Có", render: (row) => (row.type === "CREDIT" ? `${row.accountCode} - ${row.accountName}` : "---"), width: "180px" },
                { key: "journalDescription", header: "Diễn giải", render: (row) => row.description || row.journalDescription || "---", width: "260px" },
                { key: "amount", header: "Số tiền", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                { key: "status", header: "Trạng thái", render: (row) => statusLabel(row.status), align: "center", width: "120px" },
                { key: "sourceType", header: "SourceType", render: (row) => row.sourceType || "---", width: "130px" },
                { key: "sourceId", header: "SourceId", render: (row) => row.sourceId || "---", width: "180px" }
              ]}
              emptyState={<div className="text-sm font-semibold text-[var(--text-secondary)]">Chưa tìm thấy bút toán sổ cái phù hợp với chỉ tiêu này.</div>}
            />
          )}

          {!loading && !error && activeTab === "contracts" && (
            <EnterpriseDataTable
              data={data?.sourceDocuments.filter((row) => row.contractName || row.partnerName) || []}
              minWidth="760px"
              columns={[
                { key: "sourceType", header: "Nguồn", render: (row) => sourceTypeLabel(row.sourceType), width: "150px" },
                { key: "contractName", header: "Hợp đồng", render: (row) => row.contractName || "---", width: "260px" },
                { key: "partnerName", header: "Nhà cung cấp/Khách hàng", render: (row) => row.partnerName || "---", width: "240px" },
                { key: "amount", header: "Giá trị", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                { key: "status", header: "Trạng thái", render: (row) => statusLabel(row.status), align: "center", width: "140px" }
              ]}
              emptyState={<div className="text-sm font-semibold text-[var(--text-secondary)]">Chưa có dữ liệu hợp đồng/NCC cho chỉ tiêu này trong pilot.</div>}
            />
          )}

          {!loading && !error && activeTab === "audit" && (
            <AuditTrailPanel
              entityType={data?.project?.id || request.projectId ? "Project" : undefined}
              entityId={data?.project?.id || request.projectId}
              recent={!data?.project?.id && !request.projectId}
              limit={20}
              title="Lịch sử thao tác liên quan"
              description="Hiển thị audit log đọc-only theo công trình đang truy vết. Nếu chưa có bản ghi audit, hệ thống giữ empty state và không tạo dữ liệu giả."
            />
          )}

          {!loading && !error && activeTab === "__legacy_audit" && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="text-sm font-bold text-[var(--text-primary)]">Audit/Trace</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Chưa có trace chi tiết cho chỉ tiêu này trong pilot. Vui lòng xem báo cáo sổ cái hoặc chứng từ liên quan.
              </p>
            </div>
          )}
        </main>
      </aside>
    </div>
  );
}
