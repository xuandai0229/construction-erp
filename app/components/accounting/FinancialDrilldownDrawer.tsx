"use client";

import { useEffect, useMemo, useState } from "react";
import { formatVnd, formatProjectName } from "@/app/components/dashboard-data";
import { EnterpriseBadge, EnterpriseDataTable, EnterpriseTabs } from "@/app/components/ui-enterprise";

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
  projectName?: string;
  lines: JournalLineRow[];
}

interface DrilldownData {
  title: string;
  totalAmount: number;
  project?: { id: string; name: string } | null;
  sourceDocuments: SourceDocumentRow[];
  journalEntries: JournalEntryRow[];
}

interface FinancialDrilldownDrawerProps {
  request: FinancialDrilldownRequest | null;
  onClose: () => void;
}

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "documents", label: "Chứng từ" },
  { id: "journals", label: "Bút toán" },
  { id: "contracts", label: "Đối tượng" },
];

function formatDate(value?: string | Date | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
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
    REJECTED: "Bị trả lại",
    CANCELLED: "Đã hủy",
    POSTED: "Đã ghi sổ",
    DA_CAT: "Đã ghi sổ",
    FULLY_SETTLED: "Đã hoàn ứng",
    PARTIALLY_SETTLED: "Hoàn ứng một phần",
  };
  return map[normalized] || value || "Chưa xác định";
}

function statusVariant(value?: string | null): "success" | "warning" | "error" | "neutral" {
  const normalized = (value || "").toUpperCase();
  if (["APPROVED", "PAID", "POSTED", "FULLY_SETTLED", "SENT"].includes(normalized)) return "success";
  if (["PENDING", "SUBMITTED", "PARTIAL", "PARTIALLY_SETTLED"].includes(normalized)) return "warning";
  if (["OVERDUE", "REJECTED", "CANCELLED"].includes(normalized)) return "error";
  return "neutral";
}

function sourceTypeLabel(value?: string | null) {
  const normalized = (value || "").toUpperCase();
  const map: Record<string, string> = {
    INVOICE: "Hóa đơn",
    TAX_INVOICE: "Hóa đơn thuế",
    PAYMENT: "Phiếu thu/chi",
    COST: "Chi phí",
    ADVANCE: "Tạm ứng",
    ADVANCE_SETTLEMENT: "Hoàn ứng",
    BUDGET: "Dự toán",
    CONTRACT: "Hợp đồng",
    VENDOR_PAYMENT: "Thanh toán nhà cung cấp",
    CASH: "Thu/chi tiền mặt",
    BANK: "Thu/chi ngân hàng",
  };
  return map[normalized] || "Chứng từ";
}

function buildSourceUrl(row: SourceDocumentRow) {
  const type = row.sourceType.toUpperCase();
  if (type === "INVOICE") return `/print/invoice/${row.id}`;
  if (type === "PAYMENT") return `/print/payment/${row.id}`;
  if (type === "ADVANCE") return `/print/advance/${row.id}`;
  return "";
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)]/45 p-8 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--primary)]/10 text-lg font-black text-[var(--primary)]">i</div>
      <h3 className="mt-3 text-sm font-black text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm ${accent || ""}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-2 break-words font-mono text-xl font-black tabular-nums text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

export default function FinancialDrilldownDrawer({ request, onClose }: FinancialDrilldownDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<DrilldownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailModalDoc, setDetailModalDoc] = useState<any>(null);

  useEffect(() => {
    if (!request) return;

    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setActiveTab("overview");

      try {
        const params = new URLSearchParams({ metric: request.metric });
        if (request.projectId) params.set("projectId", request.projectId);
        const response = await fetch(`/api/trace/financial-drilldown?${params.toString()}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "Không thể tải dữ liệu chi tiết.");
        }
        setData(json.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu chi tiết.");
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
          projectName: entry.projectName,
          status: entry.status,
        }))
      ),
    [data]
  );

  if (!request) return null;

  const totalAmount = data?.totalAmount ?? request.amount ?? 0;
  // Ưu tiên request.projectName vì thường có dấu và chuẩn hơn từ màn hình Dashboard
  const projectName = formatProjectName(request.projectName || data?.project?.name);
  const sourceDocuments = data?.sourceDocuments || [];
  const journalEntries = data?.journalEntries || [];
  const relatedObjects = sourceDocuments.filter((row) => row.contractName || row.partnerName);

  const metricFormulas: Record<string, string> = {
    profit: "Lợi nhuận gộp tạm tính = Doanh thu hạch toán - Chi phí sản xuất trực tiếp.",
    revenue: "Doanh thu hạch toán = Tổng giá trị các Biên bản nghiệm thu đã được phê duyệt.",
    cost: "Chi phí sản xuất = Tổng giá trị chi phí vật tư, nhân công, máy thi công đã tập hợp.",
    receivables: "Công nợ phải thu (AR) = Doanh thu hạch toán - Thu tiền khách hàng.",
    payables: "Công nợ phải trả (AP) = Chi phí sản xuất (hóa đơn) - Chi tiền cho nhà cung cấp.",
    payments: "Dòng tiền thuần = Tiền thu vào - Tiền chi ra thực tế.",
    advances: "Tạm ứng tồn đọng = Tổng tạm ứng đã chi - Các khoản hoàn ứng đã duyệt.",
    budget: "Ngân sách = Tổng dự toán chi phí được duyệt ban đầu cho dự án."
  };
  const currentFormula = metricFormulas[request.metric];

  return (
    <div className="fixed inset-0 z-[600]">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Phân tích chỉ tiêu kế toán</div>
              <h2 className="mt-1 text-lg font-black leading-7 text-[var(--text-primary)]">{request.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1">Công trình: {projectName}</span>
                <span className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1">Theo bộ lọc hiện tại</span>
                <span className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 font-mono tabular-nums">{formatVnd(totalAmount)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-lg font-black text-[var(--text-secondary)] transition hover:bg-[var(--muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
              aria-label="Đóng chi tiết chỉ tiêu"
            >
              x
            </button>
          </div>
        </header>

        <EnterpriseTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--secondary)]" />
              ))}
              <div className="h-56 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--secondary)] md:col-span-3" />
            </div>
          )}

          {error && (
            <EmptyPanel
              title="Chưa tải được dữ liệu chi tiết"
              description={`${error} Vui lòng làm mới màn hình hoặc kiểm tra lại bộ lọc công trình và thời gian đang áp dụng.`}
            />
          )}

          {!loading && !error && activeTab === "overview" && (
            <div className="space-y-5">
              {currentFormula && (
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">Công thức & Định nghĩa</h3>
                  <p className="mt-1 text-sm font-medium text-sky-800 dark:text-sky-200">{currentFormula}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryTile label="Giá trị đang xem" value={formatVnd(totalAmount)} accent="border-l-4 border-l-[var(--primary)]" />
                <SummaryTile label="Chứng từ gốc tham chiếu" value={(sourceDocuments.length || 0).toLocaleString("vi-VN")} />
                <SummaryTile label="Bút toán ghi nhận" value={(journalEntries.length || 0).toLocaleString("vi-VN")} />
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-black text-[var(--text-primary)]">Hướng dẫn rà soát số liệu</h3>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                  <li>Số liệu chi tiết được tổng hợp từ chứng từ đã phê duyệt và các bút toán đã ghi nhận.</li>
                  <li>Nếu số liệu bị thiếu, hãy kiểm tra <span className="font-bold">Hộp việc phê duyệt</span> xem có chứng từ nào đang chờ duyệt hay không.</li>
                  <li>Sử dụng tab <span className="font-bold">Chứng từ</span> để đối chiếu chứng từ gốc và xem bản in.</li>
                  <li>Sử dụng tab <span className="font-bold">Bút toán</span> để xem các định khoản nợ/có chi tiết.</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && activeTab === "documents" && (
            <EnterpriseDataTable
              data={sourceDocuments}
              minWidth="980px"
              columns={[
                { key: "date", header: "Ngày", render: (row) => formatDate(row.date), width: "110px" },
                { key: "sourceType", header: "Loại chứng từ", render: (row) => sourceTypeLabel(row.sourceType), width: "145px" },
                { key: "number", header: "Số chứng từ", render: (row) => row.number || "Chưa có", width: "140px" },
                { key: "projectName", header: "Công trình", render: (row) => formatProjectName(row.projectName) || projectName, width: "190px" },
                { key: "partnerName", header: "Nhà cung cấp/Khách hàng", render: (row) => row.partnerName || "Chưa có", width: "210px" },
                { key: "contractName", header: "Hợp đồng", render: (row) => row.contractName || "Chưa gắn", width: "180px" },
                { key: "amount", header: "Số tiền", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                {
                  key: "status",
                  header: "Trạng thái",
                  render: (row) => <EnterpriseBadge variant={statusVariant(row.status)}>{statusLabel(row.status)}</EnterpriseBadge>,
                  align: "center",
                  width: "140px",
                },
                {
                  key: "action",
                  header: "Hành động",
                  render: (row) => {
                    const url = buildSourceUrl(row);
                    if (url) {
                      return (
                        <a className="text-xs font-bold text-[var(--primary)] hover:underline" href={url} target="_blank" rel="noreferrer">
                          Mở chứng từ
                        </a>
                      );
                    }
                    return (
                      <button type="button" onClick={() => setDetailModalDoc(row)} className="text-xs font-bold text-[var(--primary)] hover:underline">
                        Xem chi tiết
                      </button>
                    );
                  },
                  align: "center",
                  width: "130px",
                },
              ]}
              emptyState={<EmptyPanel title="Chưa có chứng từ phù hợp" description="Không tìm thấy chứng từ đã phê duyệt cho chỉ tiêu này trong phạm vi đang xem. Hãy kiểm tra lại công trình, thời gian hoặc trạng thái phê duyệt." />}
            />
          )}

          {!loading && !error && activeTab === "journals" && (
            <EnterpriseDataTable
              data={journalLines}
              minWidth="980px"
              columns={[
                { key: "journalDate", header: "Ngày ghi sổ", render: (row) => formatDate(row.journalDate), width: "120px" },
                { key: "journalCode", header: "Số bút toán", render: (row) => row.journalCode || "Chưa có", width: "140px" },
                { key: "debit", header: "Tài khoản Nợ", render: (row) => (row.type === "DEBIT" ? `${row.accountCode} - ${row.accountName}` : "Không phát sinh"), width: "210px" },
                { key: "credit", header: "Tài khoản Có", render: (row) => (row.type === "CREDIT" ? `${row.accountCode} - ${row.accountName}` : "Không phát sinh"), width: "210px" },
                { key: "journalDescription", header: "Diễn giải", render: (row) => row.description || row.journalDescription || "Chưa có diễn giải", width: "260px" },
                { key: "amount", header: "Số tiền", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                {
                  key: "status",
                  header: "Trạng thái",
                  render: (row) => <EnterpriseBadge variant={statusVariant(row.status)}>{statusLabel(row.status)}</EnterpriseBadge>,
                  align: "center",
                  width: "130px",
                },
              ]}
              emptyState={<EmptyPanel title="Chưa có bút toán liên quan" description="Chưa tìm thấy bút toán đã ghi nhận cho chỉ tiêu này. Nếu chứng từ vừa được duyệt, dữ liệu có thể xuất hiện sau khi sổ kế toán được cập nhật." />}
            />
          )}

          {!loading && !error && activeTab === "contracts" && (
            <EnterpriseDataTable
              data={relatedObjects}
              minWidth="760px"
              columns={[
                { key: "sourceType", header: "Nguồn nghiệp vụ", render: (row) => sourceTypeLabel(row.sourceType), width: "160px" },
                { key: "contractName", header: "Hợp đồng", render: (row) => row.contractName || "Chưa gắn", width: "250px" },
                { key: "partnerName", header: "Nhà cung cấp/Khách hàng", render: (row) => row.partnerName || "Chưa có", width: "240px" },
                { key: "amount", header: "Giá trị", render: (row) => formatVnd(row.amount), align: "right", width: "150px" },
                {
                  key: "status",
                  header: "Trạng thái",
                  render: (row) => <EnterpriseBadge variant={statusVariant(row.status)}>{statusLabel(row.status)}</EnterpriseBadge>,
                  align: "center",
                  width: "140px",
                },
              ]}
              emptyState={<EmptyPanel title="Chưa có đối tượng liên quan" description="Chỉ tiêu này chưa có hợp đồng, nhà cung cấp hoặc khách hàng đủ thông tin để hiển thị trong phạm vi đang xem." />}
            />
          )}
        </main>
      
          {/* Fallback Document Modal */}
          {detailModalDoc && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
                <h3 className="text-lg font-black text-[var(--text-primary)]">Chi tiết chứng từ</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Không có bản in trực tiếp cho loại chứng từ này.</p>
                
                <div className="mt-6 space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Loại chứng từ:</span>
                    <span className="col-span-2 font-bold text-[var(--text-primary)]">{sourceTypeLabel(detailModalDoc.sourceType)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Số chứng từ:</span>
                    <span className="col-span-2 font-mono text-[var(--text-primary)]">{detailModalDoc.number || 'Chưa có'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Số tiền:</span>
                    <span className="col-span-2 font-mono font-bold text-emerald-600">{formatVnd(detailModalDoc.amount)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Trạng thái:</span>
                    <span className="col-span-2 font-bold">{detailModalDoc.status}</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={() => setDetailModalDoc(null)} className="h-9 rounded-md bg-[var(--primary)] px-4 text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]">
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

      </aside>
    </div>
  );
}
