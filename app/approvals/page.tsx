"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EnterpriseAppShell from "@/app/components/layout/EnterpriseAppShell";
import EnterpriseHeader from "@/app/components/layout/EnterpriseHeader";
import EnterprisePageContainer from "@/app/components/layout/EnterprisePageContainer";
import ApprovalWorkflowStepper from "@/app/components/approvals/ApprovalWorkflowStepper";
import ApprovalWorkQueueDrawer, { ApprovalQueueItem } from "@/app/components/approvals/ApprovalWorkQueueDrawer";
import { RejectReasonModal } from "@/app/components/approvals/RejectReasonModal";
import {
  EnterpriseActionMenu,
  EnterpriseDataTable,
  EnterpriseEmptyState,
  EnterpriseModal,
  EnterpriseTabs,
  getStatusLabel,
  getStatusStyleClass,
} from "@/app/components/ui-enterprise";
import { formatVnd } from "@/app/components/dashboard-data";

type QueueTab = "pending" | "created" | "rejected" | "approved" | "posted" | "all";
type BulkMode = "approve" | "reject";
type GuardCode = "ELIGIBLE" | "NO_PERMISSION" | "INVALID_STATUS" | "HIGH_VALUE_REQUIRES_HIGHER_ROLE" | "MISSING_REQUIRED_INFO";

interface WorkQueueSummary {
  pendingForMe: number;
  overdue: number;
  dueSoon: number;
  rejectedNeedsFix: number;
  approvedToday: number;
  postedToday: number;
  pendingAmount: number;
}

interface WorkQueuePayload {
  items: ApprovalQueueItem[];
  summary: WorkQueueSummary;
  role: string;
  roleBehavior: { canApprove: boolean; mode: string };
  total: number;
  hasMore: boolean;
  generatedAt: string | null;
}

interface BulkResultRow {
  id: string;
  documentType: string;
  docNo: string;
  amount: number;
  result: "Thành công" | "Thất bại" | "Bỏ qua";
  reason: string;
}

const tabs: Array<{ id: QueueTab; label: string }> = [
  { id: "pending", label: "Chờ tôi xử lý" },
  { id: "created", label: "Tôi đã gửi" },
  { id: "rejected", label: "Bị từ chối" },
  { id: "approved", label: "Đã duyệt" },
  { id: "posted", label: "Đã ghi sổ" },
  { id: "all", label: "Tất cả" },
];

const moduleOptions = [
  { value: "", label: "Tất cả phân hệ" },
  { value: "INVOICE", label: "Hóa đơn" },
  { value: "COST", label: "Chi phí" },
  { value: "ADVANCE", label: "Tạm ứng" },
  { value: "SETTLEMENT", label: "Hoàn ứng" },
];

const emptySummary: WorkQueueSummary = {
  pendingForMe: 0,
  overdue: 0,
  dueSoon: 0,
  rejectedNeedsFix: 0,
  approvedToday: 0,
  postedToday: 0,
  pendingAmount: 0,
};

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function priorityClass(priority: string) {
  if (priority === "Cần cấp cao") return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (priority === "Cao") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
}

function dueClass(status: string) {
  if (status === "Quá hạn") return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (status === "Sắp đến hạn") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

function isPendingStatus(status: string) {
  return ["PENDING", "SUBMITTED"].includes(status.toUpperCase());
}

function isInputLike(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function guardFor(item: ApprovalQueueItem, mode: BulkMode): { code: GuardCode; reason: string } {
  if (!item.id || !item.module) return { code: "MISSING_REQUIRED_INFO", reason: "Thiếu thông tin chứng từ bắt buộc." };
  if (!isPendingStatus(item.status)) return { code: "INVALID_STATUS", reason: "Chứng từ chưa ở trạng thái chờ duyệt." };
  if (item.priority === "Cần cấp cao") return { code: "HIGH_VALUE_REQUIRES_HIGHER_ROLE", reason: "Chứng từ giá trị lớn cần cấp phê duyệt cao hơn." };
  if (mode === "approve" && !item.canApprove) return { code: "NO_PERMISSION", reason: "Bạn không có quyền phê duyệt hoặc bị chặn bất kiêm nhiệm." };
  if (mode === "reject" && !item.canReject) return { code: "NO_PERMISSION", reason: "Bạn không có quyền từ chối hoặc bị chặn bất kiêm nhiệm." };
  return { code: "ELIGIBLE", reason: "Hợp lệ để xử lý." };
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("pending");
  const [documentType, setDocumentType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<WorkQueuePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ApprovalQueueItem | null>(null);
  const [approveItem, setApproveItem] = useState<ApprovalQueueItem | null>(null);
  const [rejectItem, setRejectItem] = useState<ApprovalQueueItem | null>(null);
  const [bulkMode, setBulkMode] = useState<BulkMode | null>(null);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResultRow[] | null>(null);
  const [shortcutEnabled, setShortcutEnabled] = useState(true);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const fetchQueue = useCallback(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ tab: activeTab, limit: "50" });
    if (documentType) params.set("documentType", documentType);

    setLoading(true);
    setError(null);
    fetch(`/api/approvals/work-queue?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Không thể tải hộp việc phê duyệt.");
        }
        setData(payload.data);
        setSelectedIds(new Set());
        setFocusedIndex(0);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không thể tải hộp việc phê duyệt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeTab, documentType]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    Promise.resolve().then(() => {
      cleanup = fetchQueue();
    });
    return () => cleanup?.();
  }, [fetchQueue]);

  const summary = data?.summary || emptySummary;
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = data?.items || [];
    if (!query) return items;
    return items.filter((item) =>
      [item.docNo, item.documentType, item.projectName, item.partnerName, item.creatorName, item.status]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data?.items, searchQuery]);

  const safeFocusedIndex = Math.min(focusedIndex, Math.max(filteredItems.length - 1, 0));
  const focusedItem = filteredItems[safeFocusedIndex] || null;
  const selectedItems = useMemo(() => filteredItems.filter((item) => selectedIds.has(item.id)), [filteredItems, selectedIds]);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const approveGuards = selectedItems.map((item) => ({ item, guard: guardFor(item, "approve") }));
  const rejectGuards = selectedItems.map((item) => ({ item, guard: guardFor(item, "reject") }));
  const approveEligible = approveGuards.filter((row) => row.guard.code === "ELIGIBLE").length;
  const rejectEligible = rejectGuards.filter((row) => row.guard.code === "ELIGIBLE").length;
  const approveBlocked = selectedItems.length - approveEligible;
  const rejectBlocked = selectedItems.length - rejectEligible;

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAllVisibleSelection = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredItems.map((item) => item.id)) : new Set());
  };

  const handleApprove = async (item: ApprovalQueueItem) => {
    setActionBusy(true);
    try {
      const response = await fetch(`/api/approvals/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: item.module }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Không thể phê duyệt chứng từ.");
      setApproveItem(null);
      setSelectedItem(null);
      showToast("Đã phê duyệt chứng từ.");
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể phê duyệt chứng từ.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectItem) return;
    setActionBusy(true);
    try {
      const response = await fetch(`/api/approvals/${rejectItem.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: rejectItem.module, reason }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Không thể từ chối chứng từ.");
      setRejectItem(null);
      setSelectedItem(null);
      showToast("Đã từ chối chứng từ.");
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể từ chối chứng từ.");
    } finally {
      setActionBusy(false);
    }
  };

  const runBulkAction = async () => {
    if (!bulkMode || selectedItems.length === 0) return;
    const guards = bulkMode === "approve" ? approveGuards : rejectGuards;
    const blocked = guards.filter((row) => row.guard.code !== "ELIGIBLE");
    if (blocked.length > 0) {
      showToast("Vui lòng bỏ các dòng không hợp lệ trước khi xử lý hàng loạt.");
      return;
    }
    if (bulkMode === "reject" && bulkRejectReason.trim().length < 5) {
      showToast("Từ chối hàng loạt bắt buộc nhập lý do tối thiểu 5 ký tự.");
      return;
    }

    setActionBusy(true);
    const results: BulkResultRow[] = [];
    for (const item of selectedItems) {
      try {
        const response = await fetch(`/api/approvals/${item.id}/${bulkMode === "approve" ? "approve" : "reject"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module: item.module, reason: bulkRejectReason.trim() || undefined }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) throw new Error(payload?.error || "API xử lý chứng từ thất bại.");
        results.push({ id: item.id, documentType: item.documentType, docNo: item.docNo, amount: item.amount, result: "Thành công", reason: "Đã xử lý qua API hiện hữu." });
      } catch (err) {
        results.push({
          id: item.id,
          documentType: item.documentType,
          docNo: item.docNo,
          amount: item.amount,
          result: "Thất bại",
          reason: err instanceof Error ? err.message : "Không rõ nguyên nhân.",
        });
      }
    }
    setBulkResults(results);
    setBulkMode(null);
    setBulkRejectReason("");
    setSelectedIds(new Set());
    setActionBusy(false);
    showToast("Đã hoàn tất xử lý hàng loạt. Vui lòng xem bảng kết quả.");
    fetchQueue();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shortcutEnabled || isInputLike(event.target)) return;
      if (selectedItem || approveItem || rejectItem || bulkMode || bulkResults || shortcutHelpOpen) {
        if (event.key === "Escape") {
          setSelectedItem(null);
          setApproveItem(null);
          setRejectItem(null);
          setBulkMode(null);
          setBulkResults(null);
          setShortcutHelpOpen(false);
        }
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutHelpOpen(true);
        return;
      }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "j") {
        event.preventDefault();
        setFocusedIndex((index) => Math.min(index + 1, Math.max(filteredItems.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "k") {
        event.preventDefault();
        setFocusedIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter" && focusedItem) {
        event.preventDefault();
        setSelectedItem(focusedItem);
        return;
      }
      if (event.key === " " && focusedItem) {
        event.preventDefault();
        toggleSelection(focusedItem.id);
        return;
      }
      if (event.key.toLowerCase() === "a" && focusedItem?.canApprove) {
        event.preventDefault();
        setApproveItem(focusedItem);
        return;
      }
      if (event.key.toLowerCase() === "r" && focusedItem?.canReject) {
        event.preventDefault();
        setRejectItem(focusedItem);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [approveItem, bulkMode, bulkResults, filteredItems.length, focusedItem, rejectItem, selectedItem, shortcutEnabled, shortcutHelpOpen, toggleSelection]);

  return (
    <EnterpriseAppShell activeItem="approvals">
      <EnterpriseHeader title="Hộp việc phê duyệt kế toán" subtitle="Duyệt nhanh bằng bàn phím, chọn nhiều dòng và xử lý hàng loạt có kiểm soát" />
      <EnterprisePageContainer>
        <div className="space-y-6">
          <ApprovalWorkflowStepper status={summary.pendingForMe > 0 ? "SUBMITTED" : summary.approvedToday > 0 ? "APPROVED" : "DRAFT"} pendingCount={summary.pendingForMe} processedCount={summary.approvedToday + summary.postedToday} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Chờ tôi xử lý" value={summary.pendingForMe.toLocaleString("vi-VN")} tone="blue" />
            <KpiCard label="Quá hạn" value={summary.overdue.toLocaleString("vi-VN")} tone="rose" />
            <KpiCard label="Sắp đến hạn" value={summary.dueSoon.toLocaleString("vi-VN")} tone="amber" />
            <KpiCard label="Bị từ chối cần bổ sung" value={summary.rejectedNeedsFix.toLocaleString("vi-VN")} tone="slate" />
            <KpiCard label="Đã duyệt hôm nay" value={summary.approvedToday.toLocaleString("vi-VN")} tone="emerald" />
            <KpiCard label="Đã ghi sổ hôm nay" value={summary.postedToday.toLocaleString("vi-VN")} tone="emerald" />
            <KpiCard label="Giá trị đang chờ duyệt" value={formatVnd(summary.pendingAmount)} tone="blue" wide />
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
            Dữ liệu đối soát công trình/công nợ còn chờ kế toán xác nhận. Không dùng làm sổ kế toán thật.
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-black text-[var(--text-primary)]">Hàng đợi theo vai trò</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Vai trò hiện tại: <span className="font-bold">{data?.role || "Đang tải"}</span> - {data?.roleBehavior?.mode || "Đang xác định phạm vi xử lý"}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => setShortcutHelpOpen(true)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)]">
                  Phím tắt
                </button>
                <label className="flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-bold text-[var(--text-secondary)]">
                  <input type="checkbox" checked={shortcutEnabled} onChange={(event) => setShortcutEnabled(event.target.checked)} />
                  Bật phím tắt
                </label>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm số chứng từ, công trình, người tạo..."
                  className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] sm:w-72"
                />
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  {moduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <EnterpriseTabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as QueueTab)} />

          {selectedItems.length > 0 && (
            <BulkToolbar
              selectedCount={selectedItems.length}
              totalAmount={selectedTotal}
              approveEligible={approveEligible}
              approveBlocked={approveBlocked}
              rejectEligible={rejectEligible}
              rejectBlocked={rejectBlocked}
              onClear={() => setSelectedIds(new Set())}
              onApprove={() => setBulkMode("approve")}
              onReject={() => setBulkMode("reject")}
            />
          )}

          <EnterpriseDataTable
            data={filteredItems}
            loading={loading}
            minWidth="1480px"
            density="compact"
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              const index = filteredItems.findIndex((item) => item.id === row.id);
              setFocusedIndex(Math.max(index, 0));
              setSelectedItem(row);
            }}
            rowClassName={(row, index) => (index === safeFocusedIndex ? "outline outline-2 outline-[var(--primary)]/40 outline-offset-[-2px] bg-[var(--primary)]/5" : selectedIds.has(row.id) ? "bg-blue-500/5" : "")}
            errorState={error ? <div className="text-sm font-bold text-rose-500">{error}</div> : undefined}
            emptyState={<EnterpriseEmptyState title="Không có công việc phù hợp" description="Hiện chưa có chứng từ trong hàng đợi này hoặc bộ lọc đang quá hẹp." iconType="generic" />}
            columns={[
              {
                key: "selection",
                header: "",
                render: (row) => (
                  <input type="checkbox" checked={selectedIds.has(row.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelection(row.id)} aria-label={`Chọn chứng từ ${row.docNo}`} className="h-4 w-4" />
                ),
                width: "44px",
                align: "center",
                headerClassName: "text-center",
              },
              { key: "documentType", header: "Loại chứng từ", render: (row) => row.documentType, width: "130px" },
              { key: "docNo", header: "Số chứng từ", render: (row) => <span className="font-mono font-bold text-[var(--primary)]">{row.docNo}</span>, width: "130px" },
              { key: "projectName", header: "Công trình", render: (row) => row.projectName, minWidth: "190px", truncate: true },
              { key: "partnerName", header: "Nhà cung cấp/Khách hàng", render: (row) => row.partnerName, minWidth: "190px", truncate: true },
              { key: "creatorName", header: "Người tạo", render: (row) => row.creatorName, width: "150px" },
              { key: "createdAt", header: "Ngày tạo", render: (row) => formatDateTime(row.createdAt), width: "145px" },
              { key: "submittedAt", header: "Ngày gửi duyệt", render: (row) => formatDateTime(row.submittedAt), width: "145px" },
              { key: "amount", header: "Số tiền", render: (row) => formatVnd(row.amount), align: "right", width: "155px" },
              {
                key: "status",
                header: "Trạng thái",
                render: (row) => <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${getStatusStyleClass(row.status)}`}>{getStatusLabel(row.status)}</span>,
                align: "center",
                width: "130px",
              },
              { key: "priority", header: "Ưu tiên", render: (row) => <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${priorityClass(row.priority)}`}>{row.priority}</span>, align: "center", width: "120px" },
              { key: "dueStatus", header: "Hạn xử lý", render: (row) => <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${dueClass(row.dueStatus)}`}>{row.dueStatus}</span>, align: "center", width: "120px" },
              { key: "currentHandler", header: "Người đang xử lý", render: (row) => row.currentHandler, width: "150px" },
              {
                key: "actions",
                header: "Thao tác",
                render: (row) => (
                  <EnterpriseActionMenu
                    actions={[
                      { label: "Xem chi tiết", onClick: () => setSelectedItem(row) },
                      { label: row.canApprove ? "Phê duyệt" : "Chưa đủ quyền duyệt", onClick: () => row.canApprove && setApproveItem(row) },
                      { label: row.canReject ? "Từ chối" : "Chưa đủ quyền từ chối", onClick: () => row.canReject && setRejectItem(row), variant: row.canReject ? "danger" : "default" },
                    ]}
                  />
                ),
                align: "center",
                width: "90px",
              },
            ]}
          />

          {filteredItems.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <button type="button" onClick={() => setAllVisibleSelection(selectedIds.size !== filteredItems.length)} className="font-bold text-[var(--primary)]">
                {selectedIds.size === filteredItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả trên trang"}
              </button>
              <span>J/K hoặc mũi tên để đổi dòng focus, Space để chọn dòng, Enter để mở chi tiết.</span>
            </div>
          )}
        </div>

        <ApprovalWorkQueueDrawer isOpen={Boolean(selectedItem)} item={selectedItem} onClose={() => setSelectedItem(null)} onApprove={setApproveItem} onReject={setRejectItem} />
        <EnterpriseModal isOpen={Boolean(approveItem)} onClose={() => setApproveItem(null)} title="Xác nhận phê duyệt" maxWidth="md">
          <SingleApproveConfirm item={approveItem} actionBusy={actionBusy} onCancel={() => setApproveItem(null)} onConfirm={() => approveItem && handleApprove(approveItem)} />
        </EnterpriseModal>
        <RejectReasonModal isOpen={Boolean(rejectItem)} docNo={rejectItem?.docNo || ""} onClose={() => setRejectItem(null)} onSubmit={handleReject} />
        <BulkPreviewModal mode={bulkMode} items={selectedItems} guards={bulkMode === "approve" ? approveGuards : rejectGuards} rejectReason={bulkRejectReason} setRejectReason={setBulkRejectReason} actionBusy={actionBusy} onClose={() => setBulkMode(null)} onRun={runBulkAction} />
        <BulkResultModal results={bulkResults} onClose={() => setBulkResults(null)} />
        <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
        {toast && <div className="fixed bottom-5 right-5 z-[900] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] shadow-xl">{toast}</div>}
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

function KpiCard({ label, value, tone, wide = false }: { label: string; value: string; tone: "blue" | "rose" | "amber" | "emerald" | "slate"; wide?: boolean }) {
  const toneClass: Record<"blue" | "rose" | "amber" | "emerald" | "slate", string> = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone]} ${wide ? "xl:col-span-2" : ""}`}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-mono text-xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function BulkToolbar({
  selectedCount,
  totalAmount,
  approveEligible,
  approveBlocked,
  rejectEligible,
  rejectBlocked,
  onClear,
  onApprove,
  onReject,
}: {
  selectedCount: number;
  totalAmount: number;
  approveEligible: number;
  approveBlocked: number;
  rejectEligible: number;
  rejectBlocked: number;
  onClear: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="sticky top-2 z-30 rounded-lg border border-blue-500/30 bg-[var(--card)] p-3 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2 text-xs font-bold text-[var(--text-secondary)] sm:grid-cols-4">
          <span>Đã chọn: {selectedCount} chứng từ</span>
          <span>Tổng giá trị: {formatVnd(totalAmount)}</span>
          <span>Có thể duyệt: {approveEligible}</span>
          <span>Cần xem lại: {Math.max(approveBlocked, rejectBlocked)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onApprove} disabled={approveEligible === 0 || approveBlocked > 0} className="h-8 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Duyệt hàng loạt
          </button>
          <button type="button" onClick={onReject} disabled={rejectEligible === 0 || rejectBlocked > 0} className="h-8 rounded-md bg-rose-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Từ chối hàng loạt
          </button>
          <button type="button" onClick={onClear} className="h-8 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--text-primary)]">
            Bỏ chọn
          </button>
        </div>
      </div>
      {(approveBlocked > 0 || rejectBlocked > 0) && <div className="mt-2 text-[11px] font-semibold text-amber-600">Có dòng không hợp lệ. Vui lòng bỏ các dòng bị chặn trước khi xử lý hàng loạt.</div>}
    </div>
  );
}

function SingleApproveConfirm({ item, actionBusy, onCancel, onConfirm }: { item: ApprovalQueueItem | null; actionBusy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="leading-6 text-[var(--text-secondary)]">
        Bạn sắp phê duyệt chứng từ <span className="font-bold text-[var(--text-primary)]">{item?.docNo}</span>. Vui lòng kiểm tra chứng từ nguồn, công trình và số tiền trước khi thực hiện.
      </p>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
        Ghi sổ sẽ ảnh hưởng số liệu kế toán. Sprint này chỉ phê duyệt theo API hiện hữu, không tự ghi sổ.
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button className="rounded-md border border-[var(--border)] px-4 py-2 text-xs font-bold" onClick={onCancel} disabled={actionBusy}>
          Hủy
        </button>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60" onClick={onConfirm} disabled={actionBusy}>
          Xác nhận phê duyệt
        </button>
      </div>
    </div>
  );
}

function BulkPreviewModal({
  mode,
  items,
  guards,
  rejectReason,
  setRejectReason,
  actionBusy,
  onClose,
  onRun,
}: {
  mode: BulkMode | null;
  items: ApprovalQueueItem[];
  guards: Array<{ item: ApprovalQueueItem; guard: { code: GuardCode; reason: string } }>;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  actionBusy: boolean;
  onClose: () => void;
  onRun: () => void;
}) {
  const blocked = guards.filter((row) => row.guard.code !== "ELIGIBLE");
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const canRun = mode !== null && items.length > 0 && blocked.length === 0 && (mode === "approve" || rejectReason.trim().length >= 5);

  return (
    <EnterpriseModal isOpen={Boolean(mode)} onClose={onClose} title={mode === "approve" ? "Xác nhận duyệt hàng loạt" : "Xác nhận từ chối hàng loạt"} maxWidth="4xl">
      <div className="space-y-4">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
          Bạn sắp {mode === "approve" ? "phê duyệt" : "từ chối"} {items.length} chứng từ với tổng giá trị {formatVnd(total)}. Thao tác này sẽ gọi API hiện hữu theo từng chứng từ để backend ghi audit riêng.
        </div>
        {mode === "reject" && (
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Nhập lý do từ chối áp dụng cho toàn bộ chứng từ đã chọn..."
            className="h-24 w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
        )}
        <div className="max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="bg-[var(--secondary)] text-[var(--text-secondary)]">
              <tr>
                <th className="p-2 text-left">Loại</th>
                <th className="p-2 text-left">Số chứng từ</th>
                <th className="p-2 text-right">Số tiền</th>
                <th className="p-2 text-left">Guard</th>
                <th className="p-2 text-left">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {guards.map(({ item, guard }) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="p-2">{item.documentType}</td>
                  <td className="p-2 font-mono">{item.docNo}</td>
                  <td className="p-2 text-right font-mono">{formatVnd(item.amount)}</td>
                  <td className={guard.code === "ELIGIBLE" ? "p-2 font-bold text-emerald-600" : "p-2 font-bold text-rose-600"}>{guard.code}</td>
                  <td className="p-2">{guard.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} disabled={actionBusy} className="rounded-md border border-[var(--border)] px-4 py-2 text-xs font-bold">
            Hủy
          </button>
          <button type="button" onClick={onRun} disabled={!canRun || actionBusy} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Xác nhận xử lý
          </button>
        </div>
      </div>
    </EnterpriseModal>
  );
}

function BulkResultModal({ results, onClose }: { results: BulkResultRow[] | null; onClose: () => void }) {
  const success = results?.filter((row) => row.result === "Thành công").length || 0;
  const failed = results?.filter((row) => row.result === "Thất bại").length || 0;
  const skipped = results?.filter((row) => row.result === "Bỏ qua").length || 0;

  return (
    <EnterpriseModal isOpen={Boolean(results)} onClose={onClose} title="Kết quả xử lý hàng loạt" maxWidth="4xl">
      <div className="space-y-4">
        <div className="grid gap-3 text-sm font-bold sm:grid-cols-3">
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700">Thành công: {success}</div>
          <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-rose-700">Thất bại: {failed}</div>
          <div className="rounded-md border border-slate-500/20 bg-slate-500/10 p-3 text-slate-700">Bỏ qua: {skipped}</div>
        </div>
        <div className="max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="p-2 text-left">Loại chứng từ</th>
                <th className="p-2 text-left">Số chứng từ</th>
                <th className="p-2 text-right">Số tiền</th>
                <th className="p-2 text-left">Kết quả</th>
                <th className="p-2 text-left">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {(results || []).map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="p-2">{row.documentType}</td>
                  <td className="p-2 font-mono">{row.docNo}</td>
                  <td className="p-2 text-right font-mono">{formatVnd(row.amount)}</td>
                  <td className="p-2 font-bold">{row.result}</td>
                  <td className="p-2">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white">
            Đóng
          </button>
        </div>
      </div>
    </EnterpriseModal>
  );
}

function ShortcutHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const rows = [
    ["J / ArrowDown", "Xuống dòng tiếp theo"],
    ["K / ArrowUp", "Lên dòng trước"],
    ["Enter", "Mở chi tiết dòng đang focus"],
    ["Esc", "Đóng drawer hoặc modal"],
    ["A", "Mở xác nhận phê duyệt nếu có quyền"],
    ["R", "Mở modal từ chối nếu có quyền"],
    ["/", "Focus ô tìm kiếm"],
    ["Space", "Chọn hoặc bỏ chọn dòng đang focus"],
    ["?", "Mở trợ giúp phím tắt"],
  ];

  return (
    <EnterpriseModal isOpen={isOpen} onClose={onClose} title="Phím tắt" maxWidth="lg">
      <div className="space-y-2">
        {rows.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <kbd className="rounded bg-[var(--secondary)] px-2 py-1 font-mono text-xs font-bold">{key}</kbd>
            <span className="text-[var(--text-secondary)]">{desc}</span>
          </div>
        ))}
      </div>
    </EnterpriseModal>
  );
}
