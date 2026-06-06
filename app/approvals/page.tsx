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
import { formatVnd, formatProjectName } from "@/app/components/dashboard-data";
import { ApprovalSlaInfo, calculateApprovalSla, getApprovalSlaClass } from "@/lib/approval-sla";

type QueueTab = "pending" | "created" | "rejected" | "approved" | "posted" | "all";
type BulkMode = "approve" | "reject";
type SlaFilter = "all" | "dueSoon" | "overdue" | "highValue" | "needsFix";
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

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  isRead?: boolean;
  createdAt?: string;
  derived?: boolean;
}

interface BulkResultRow {
  id: string;
  documentType: string;
  docNo: string;
  amount: number;
  result: "Th\u00e0nh c\u00f4ng" | "Th\u1ea5t b\u1ea1i" | "B\u1ecf qua";
  reason: string;
}

const queueTabs: Array<{ id: QueueTab; label: string }> = [
  { id: "pending", label: "Ch\u1edd t\u00f4i x\u1eed l\u00fd" },
  { id: "created", label: "T\u00f4i \u0111\u00e3 g\u1eedi" },
  { id: "rejected", label: "B\u1ecb t\u1eeb ch\u1ed1i" },
  { id: "approved", label: "\u0110\u00e3 duy\u1ec7t" },
  { id: "posted", label: "\u0110\u00e3 ghi s\u1ed5" },
  { id: "all", label: "T\u1ea5t c\u1ea3" },
];

const slaFilters: Array<{ id: SlaFilter; label: string }> = [
  { id: "all", label: "T\u1ea5t c\u1ea3 SLA" },
  { id: "dueSoon", label: "S\u1eafp qu\u00e1 h\u1ea1n" },
  { id: "overdue", label: "Qu\u00e1 h\u1ea1n" },
  { id: "highValue", label: "C\u1ea7n c\u1ea5p cao" },
  { id: "needsFix", label: "B\u1ecb t\u1eeb ch\u1ed1i c\u1ea7n b\u1ed5 sung" },
];

const moduleOptions = [
  { value: "", label: "T\u1ea5t c\u1ea3 ph\u00e2n h\u1ec7" },
  { value: "INVOICE", label: "H\u00f3a \u0111\u01a1n" },
  { value: "COST", label: "Chi ph\u00ed" },
  { value: "ADVANCE", label: "T\u1ea1m \u1ee9ng" },
  { value: "SETTLEMENT", label: "Ho\u00e0n \u1ee9ng" },
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
  if (!value) return "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function isPendingStatus(status: string) {
  return ["PENDING", "SUBMITTED"].includes(status.toUpperCase());
}

function isInputLike(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function decodeEscapedUnicode(value: string) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function decodeApprovalDom(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    if (node.nodeValue?.includes("\\u")) node.nodeValue = decodeEscapedUnicode(node.nodeValue);
  }

  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    for (const attr of ["aria-label", "placeholder", "title"]) {
      const value = element.getAttribute(attr);
      if (value?.includes("\\u")) element.setAttribute(attr, decodeEscapedUnicode(value));
    }
  }
}

function getSla(item: ApprovalQueueItem) {
  return calculateApprovalSla({
    status: item.status,
    priority: item.priority,
    createdAt: item.createdAt,
    submittedAt: item.submittedAt,
    dueAt: item.dueAt,
  });
}

function matchesSlaFilter(sla: ApprovalSlaInfo, filter: SlaFilter) {
  if (filter === "all") return true;
  if (filter === "dueSoon") return sla.status === "DUE_SOON";
  if (filter === "overdue") return sla.status === "OVERDUE";
  if (filter === "highValue") return sla.status === "HIGH_VALUE";
  return sla.status === "NEEDS_FIX";
}

function guardFor(item: ApprovalQueueItem, mode: BulkMode): { code: GuardCode; reason: string } {
  const sla = getSla(item);
  if (!item.id || !item.module) return { code: "MISSING_REQUIRED_INFO", reason: "Thi\u1ebfu th\u00f4ng tin ch\u1ee9ng t\u1eeb b\u1eaft bu\u1ed9c." };
  if (!isPendingStatus(item.status)) return { code: "INVALID_STATUS", reason: "Ch\u1ee9ng t\u1eeb ch\u01b0a \u1edf tr\u1ea1ng th\u00e1i ch\u1edd duy\u1ec7t." };
  if (sla.status === "HIGH_VALUE") return { code: "HIGH_VALUE_REQUIRES_HIGHER_ROLE", reason: "Ch\u1ee9ng t\u1eeb gi\u00e1 tr\u1ecb l\u1edbn c\u1ea7n c\u1ea5p ph\u00ea duy\u1ec7t cao h\u01a1n." };
  if (mode === "approve" && !item.canApprove) return { code: "NO_PERMISSION", reason: "B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n ph\u00ea duy\u1ec7t ho\u1eb7c b\u1ecb ch\u1eb7n b\u1ea5t ki\u00eam nhi\u1ec7m." };
  if (mode === "reject" && !item.canReject) return { code: "NO_PERMISSION", reason: "B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n t\u1eeb ch\u1ed1i ho\u1eb7c b\u1ecb ch\u1eb7n b\u1ea5t ki\u00eam nhi\u1ec7m." };
  return { code: "ELIGIBLE", reason: "H\u1ee3p l\u1ec7 \u0111\u1ec3 x\u1eed l\u00fd." };
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("pending");
  const [documentType, setDocumentType] = useState("");
  const [slaFilter, setSlaFilter] = useState<SlaFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<WorkQueuePayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
        if (!response.ok || !payload?.success) throw new Error(payload?.error || "Kh\u00f4ng th\u1ec3 t\u1ea3i h\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t.");
        setData(payload.data);
        setSelectedIds(new Set());
        setFocusedIndex(0);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Kh\u00f4ng th\u1ec3 t\u1ea3i h\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t.");
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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/workspace/notifications", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (response.ok && payload?.success && Array.isArray(payload.data)) setNotifications(payload.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const summary = data?.summary || emptySummary;
  const itemsWithSla = useMemo(() => (data?.items || []).map((item) => ({ item, sla: getSla(item) })), [data?.items]);
  const slaSummary = useMemo(() => {
    const waiting = itemsWithSla.map((row) => row.sla.waitingHours).filter((value): value is number => typeof value === "number");
    return {
      dueSoon: itemsWithSla.filter((row) => row.sla.status === "DUE_SOON").length,
      overdue: itemsWithSla.filter((row) => row.sla.status === "OVERDUE").length,
      highValue: itemsWithSla.filter((row) => row.sla.status === "HIGH_VALUE").length,
      needsFix: itemsWithSla.filter((row) => row.sla.status === "NEEDS_FIX").length,
      averageWaiting: waiting.length ? Math.round(waiting.reduce((sum, value) => sum + value, 0) / waiting.length) : null,
    };
  }, [itemsWithSla]);
  const allKpisZero = summary.pendingForMe === 0 && slaSummary.dueSoon === 0 && slaSummary.overdue === 0 && slaSummary.highValue === 0 && slaSummary.needsFix === 0;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return itemsWithSla
      .filter((row) => matchesSlaFilter(row.sla, slaFilter))
      .map((row) => row.item)
      .filter((item) => {
        if (!query) return true;
        return [item.docNo, item.documentType, item.projectName, item.partnerName, item.creatorName, item.status].join(" ").toLowerCase().includes(query);
      });
  }, [itemsWithSla, searchQuery, slaFilter]);

  const derivedNotifications = useMemo<NotificationItem[]>(() => {
    const now = new Date().toISOString();
    const list: NotificationItem[] = [];
    if (summary.pendingForMe > 0) list.push({ id: "derived-pending", title: "Ch\u1ee9ng t\u1eeb ch\u1edd duy\u1ec7t", message: `C\u00f3 ${summary.pendingForMe.toLocaleString("vi-VN")} ch\u1ee9ng t\u1eeb \u0111ang ch\u1edd duy\u1ec7t trong ph\u1ea1m vi vai tr\u00f2.`, severity: "INFO", createdAt: now, derived: true });
    if (slaSummary.overdue > 0) list.push({ id: "derived-overdue", title: "SLA qu\u00e1 h\u1ea1n", message: `C\u00f3 ${slaSummary.overdue.toLocaleString("vi-VN")} ch\u1ee9ng t\u1eeb qu\u00e1 h\u1ea1n x\u1eed l\u00fd.`, severity: "ERROR", createdAt: now, derived: true });
    if (slaSummary.needsFix > 0) list.push({ id: "derived-rejected", title: "C\u1ea7n b\u1ed5 sung h\u1ed3 s\u01a1", message: `C\u00f3 ${slaSummary.needsFix.toLocaleString("vi-VN")} ch\u1ee9ng t\u1eeb b\u1ecb t\u1eeb ch\u1ed1i c\u1ea7n ng\u01b0\u1eddi t\u1ea1o b\u1ed5 sung.`, severity: "WARNING", createdAt: now, derived: true });
    if (slaSummary.highValue > 0) list.push({ id: "derived-high-value", title: "C\u1ea7n c\u1ea5p cao xem x\u00e9t", message: `C\u00f3 ${slaSummary.highValue.toLocaleString("vi-VN")} ch\u1ee9ng t\u1eeb gi\u00e1 tr\u1ecb l\u1edbn c\u1ea7n c\u1ea5p duy\u1ec7t cao h\u01a1n.`, severity: "CRITICAL", createdAt: now, derived: true });
    return list;
  }, [summary.pendingForMe, slaSummary.highValue, slaSummary.needsFix, slaSummary.overdue]);

  const notificationItems = notifications.length > 0 ? notifications : derivedNotifications;
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
      const response = await fetch(`/api/approvals/${item.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: item.module }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Kh\u00f4ng th\u1ec3 ph\u00ea duy\u1ec7t ch\u1ee9ng t\u1eeb.");
      setApproveItem(null);
      setSelectedItem(null);
      showToast("\u0110\u00e3 ph\u00ea duy\u1ec7t ch\u1ee9ng t\u1eeb.");
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kh\u00f4ng th\u1ec3 ph\u00ea duy\u1ec7t ch\u1ee9ng t\u1eeb.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectItem) return;
    setActionBusy(true);
    try {
      const response = await fetch(`/api/approvals/${rejectItem.id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: rejectItem.module, reason }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Kh\u00f4ng th\u1ec3 t\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb.");
      setRejectItem(null);
      setSelectedItem(null);
      showToast("\u0110\u00e3 t\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb.");
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kh\u00f4ng th\u1ec3 t\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb.");
    } finally {
      setActionBusy(false);
    }
  };

  const runBulkAction = async () => {
    if (!bulkMode || selectedItems.length === 0) return;
    const guards = bulkMode === "approve" ? approveGuards : rejectGuards;
    if (guards.some((row) => row.guard.code !== "ELIGIBLE")) {
      showToast("Vui l\u00f2ng b\u1ecf c\u00e1c d\u00f2ng kh\u00f4ng h\u1ee3p l\u1ec7 tr\u01b0\u1edbc khi x\u1eed l\u00fd h\u00e0ng lo\u1ea1t.");
      return;
    }
    if (bulkMode === "reject" && bulkRejectReason.trim().length < 5) {
      showToast("T\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t b\u1eaft bu\u1ed9c nh\u1eadp l\u00fd do t\u1ed1i thi\u1ec3u 5 k\u00fd t\u1ef1.");
      return;
    }

    setActionBusy(true);
    const results: BulkResultRow[] = [];
    for (const item of selectedItems) {
      try {
        const response = await fetch(`/api/approvals/${item.id}/${bulkMode === "approve" ? "approve" : "reject"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: item.module, reason: bulkRejectReason.trim() || undefined }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) throw new Error(payload?.error || "API x\u1eed l\u00fd ch\u1ee9ng t\u1eeb th\u1ea5t b\u1ea1i.");
        results.push({ id: item.id, documentType: item.documentType, docNo: item.docNo, amount: item.amount, result: "Th\u00e0nh c\u00f4ng", reason: "\u0110\u00e3 x\u1eed l\u00fd qua API hi\u1ec7n h\u1eefu." });
      } catch (err) {
        results.push({ id: item.id, documentType: item.documentType, docNo: item.docNo, amount: item.amount, result: "Th\u1ea5t b\u1ea1i", reason: err instanceof Error ? err.message : "Kh\u00f4ng r\u00f5 nguy\u00ean nh\u00e2n." });
      }
    }
    setBulkResults(results);
    setBulkMode(null);
    setBulkRejectReason("");
    setSelectedIds(new Set());
    setActionBusy(false);
    showToast("\u0110\u00e3 ho\u00e0n t\u1ea5t x\u1eed l\u00fd h\u00e0ng lo\u1ea1t. Vui l\u00f2ng xem b\u1ea3ng k\u1ebft qu\u1ea3.");
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

  useEffect(() => {
    const root = document.querySelector("[data-approval-page]");
    if (root) decodeApprovalDom(root);
  });

  return (
    <EnterpriseAppShell activeItem="approvals">
      <EnterpriseHeader title={"H\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t k\u1ebf to\u00e1n"} subtitle={"Theo dõi chứng từ chờ duyệt, thời hạn xử lý và các hồ sơ cần ưu tiên."} />
      <EnterprisePageContainer>
        <div className="min-w-0 space-y-6 overflow-hidden" data-approval-page>
          <ApprovalWorkflowStepper status={summary.pendingForMe > 0 ? "SUBMITTED" : summary.approvedToday > 0 ? "APPROVED" : "DRAFT"} pendingCount={summary.pendingForMe} processedCount={summary.approvedToday + summary.postedToday} />

          {!allKpisZero && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="S\u1eafp qu\u00e1 h\u1ea1n" value={slaSummary.dueSoon.toLocaleString("vi-VN")} tone="amber" />
            <KpiCard label="\u0110\u00e3 qu\u00e1 h\u1ea1n" value={slaSummary.overdue.toLocaleString("vi-VN")} tone="rose" />
            <KpiCard label="C\u1ea7n c\u1ea5p cao x\u1eed l\u00fd" value={slaSummary.highValue.toLocaleString("vi-VN")} tone="violet" />
            <KpiCard label="B\u1ecb t\u1eeb ch\u1ed1i c\u1ea7n b\u1ed5 sung" value={slaSummary.needsFix.toLocaleString("vi-VN")} tone="blue" />
            <KpiCard label="Th\u1eddi gian ch\u1edd trung b\u00ecnh" value={slaSummary.averageWaiting === null ? "\u2014" : `${slaSummary.averageWaiting.toLocaleString("vi-VN")} gi\u1edd`} tone="slate" />
          </div>
          )}

          {allKpisZero && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Không có công việc nào đang chờ bạn xử lý lúc này.</p>
            </div>
          )}

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-700 dark:text-blue-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold">i</span>
                <span>Dữ liệu được lọc theo vai trò kế toán hiện tại. Dùng phím <kbd className="mx-1 rounded bg-blue-500/20 px-1 font-mono font-bold">/</kbd> để tìm kiếm nhanh chứng từ.</span>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-[var(--text-primary)]">H\u00e0ng \u0111\u1ee3i theo vai tr\u00f2</div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">
                      Vai tr\u00f2 hi\u1ec7n t\u1ea1i: <span className="font-bold">{formatRoleLabel(data?.role)}</span> - {data?.roleBehavior?.mode || "\u0110ang x\u00e1c \u0111\u1ecbnh ph\u1ea1m vi x\u1eed l\u00fd"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => setShortcutHelpOpen(true)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)]">
                      Ph\u00edm t\u1eaft
                    </button>
                    <label className="flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-bold text-[var(--text-secondary)]">
                      <input type="checkbox" checked={shortcutEnabled} onChange={(event) => setShortcutEnabled(event.target.checked)} />
                      B\u1eadt ph\u00edm t\u1eaft
                    </label>
                    <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="T\u00ecm s\u1ed1 ch\u1ee9ng t\u1eeb, c\u00f4ng tr\u00ecnh, ng\u01b0\u1eddi t\u1ea1o..." className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] sm:w-72" />
                    <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                      {moduleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <EnterpriseTabs tabs={queueTabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as QueueTab)} />
              <SlaFilterBar active={slaFilter} onChange={setSlaFilter} />

              {selectedItems.length > 0 && (
                <BulkToolbar selectedCount={selectedItems.length} totalAmount={selectedTotal} approveEligible={approveEligible} approveBlocked={approveBlocked} rejectEligible={rejectEligible} rejectBlocked={rejectBlocked} onClear={() => setSelectedIds(new Set())} onApprove={() => setBulkMode("approve")} onReject={() => setBulkMode("reject")} />
              )}

              <EnterpriseDataTable
                data={filteredItems}
                loading={loading}
                minWidth="1600px"
                density="compact"
                getRowKey={(row) => row.id}
                onRowClick={(row) => {
                  const index = filteredItems.findIndex((item) => item.id === row.id);
                  setFocusedIndex(Math.max(index, 0));
                  setSelectedItem(row);
                }}
                rowClassName={(row, index) => (index === safeFocusedIndex ? "outline outline-2 outline-[var(--primary)]/40 outline-offset-[-2px] bg-[var(--primary)]/5" : selectedIds.has(row.id) ? "bg-blue-500/5" : "")}
                errorState={error ? <div className="text-sm font-bold text-rose-500">{error}</div> : undefined}
                emptyState={<EnterpriseEmptyState title="Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p" description="Hi\u1ec7n ch\u01b0a c\u00f3 ch\u1ee9ng t\u1eeb trong h\u00e0ng \u0111\u1ee3i n\u00e0y ho\u1eb7c b\u1ed9 l\u1ecdc \u0111ang qu\u00e1 h\u1eb9p." iconType="generic" />}
                columns={[
                  { key: "selection", header: "", render: (row) => <input type="checkbox" checked={selectedIds.has(row.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelection(row.id)} aria-label={`Ch\u1ecdn ch\u1ee9ng t\u1eeb ${row.docNo}`} className="h-4 w-4" />, width: "44px", align: "center", headerClassName: "text-center" },
                  { key: "documentType", header: "Lo\u1ea1i ch\u1ee9ng t\u1eeb", render: (row) => row.documentType, width: "130px" },
                  { key: "docNo", header: "S\u1ed1 ch\u1ee9ng t\u1eeb", render: (row) => <span className="font-mono font-bold text-[var(--primary)]">{row.docNo}</span>, width: "130px" },
                  { key: "projectName", header: "C\u00f4ng tr\u00ecnh", render: (row) => formatProjectName(row.projectName), minWidth: "190px", truncate: true },
                  { key: "partnerName", header: "Nh\u00e0 cung c\u1ea5p/Kh\u00e1ch h\u00e0ng", render: (row) => row.partnerName, minWidth: "190px", truncate: true },
                  { key: "creatorName", header: "Ng\u01b0\u1eddi t\u1ea1o", render: (row) => row.creatorName, width: "150px" },
                  { key: "submittedAt", header: "M\u1ed1c t\u00ednh SLA", render: (row) => formatDateTime(row.submittedAt || row.createdAt), width: "145px" },
                  { key: "amount", header: "S\u1ed1 ti\u1ec1n", render: (row) => formatVnd(row.amount), align: "right", width: "155px" },
                  { key: "status", header: "Tr\u1ea1ng th\u00e1i", render: (row) => <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${getStatusStyleClass(row.status)}`}>{getStatusLabel(row.status)}</span>, align: "center", width: "130px" },
                  { key: "sla", header: "SLA", render: (row) => <SlaBadge sla={getSla(row)} />, align: "center", width: "135px" },
                  { key: "currentHandler", header: "Ng\u01b0\u1eddi n\u00ean x\u1eed l\u00fd", render: (row) => getSla(row).recommendedHandler, width: "170px" },
                  { key: "actions", header: "Thao t\u00e1c", render: (row) => <EnterpriseActionMenu actions={[{ label: "Xem chi ti\u1ebft", onClick: () => setSelectedItem(row) }, { label: row.canApprove ? "Ph\u00ea duy\u1ec7t" : "Ch\u01b0a \u0111\u1ee7 quy\u1ec1n duy\u1ec7t", onClick: () => row.canApprove && setApproveItem(row) }, { label: row.canReject ? "T\u1eeb ch\u1ed1i" : "Ch\u01b0a \u0111\u1ee7 quy\u1ec1n t\u1eeb ch\u1ed1i", onClick: () => row.canReject && setRejectItem(row), variant: row.canReject ? "danger" : "default" }]} />, align: "center", width: "90px" },
                ]}
              />

              {filteredItems.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <button type="button" onClick={() => setAllVisibleSelection(selectedIds.size !== filteredItems.length)} className="font-bold text-[var(--primary)]">
                    {selectedIds.size === filteredItems.length ? "B\u1ecf ch\u1ecdn t\u1ea5t c\u1ea3" : "Ch\u1ecdn t\u1ea5t c\u1ea3 tr\u00ean trang"}
                  </button>
                  <span>J/K ho\u1eb7c m\u0169i t\u00ean \u0111\u1ec3 \u0111\u1ed5i d\u00f2ng focus, Space \u0111\u1ec3 ch\u1ecdn d\u00f2ng, Enter \u0111\u1ec3 m\u1edf chi ti\u1ebft.</span>
                </div>
              )}
            </div>

            <aside className="min-w-0 space-y-4">
              <NotificationPanel notifications={notificationItems} derived={notifications.length === 0} />
              <DelegationPanel role={formatRoleLabel(data?.role)} averageWaiting={slaSummary.averageWaiting} />
            </aside>
          </div>
          <ApprovalWorkQueueDrawer isOpen={Boolean(selectedItem)} item={selectedItem} onClose={() => setSelectedItem(null)} onApprove={setApproveItem} onReject={setRejectItem} />
          <EnterpriseModal isOpen={Boolean(approveItem)} onClose={() => setApproveItem(null)} title="X\u00e1c nh\u1eadn ph\u00ea duy\u1ec7t" maxWidth="md">
            <SingleApproveConfirm item={approveItem} actionBusy={actionBusy} onCancel={() => setApproveItem(null)} onConfirm={() => approveItem && handleApprove(approveItem)} />
          </EnterpriseModal>
          <RejectReasonModal isOpen={Boolean(rejectItem)} docNo={rejectItem?.docNo || ""} onClose={() => setRejectItem(null)} onSubmit={handleReject} />
          <BulkPreviewModal mode={bulkMode} items={selectedItems} guards={bulkMode === "approve" ? approveGuards : rejectGuards} rejectReason={bulkRejectReason} setRejectReason={setBulkRejectReason} actionBusy={actionBusy} onClose={() => setBulkMode(null)} onRun={runBulkAction} />
          <BulkResultModal results={bulkResults} onClose={() => setBulkResults(null)} />
          <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
          {toast && <div className="fixed bottom-5 right-5 z-[900] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] shadow-xl">{toast}</div>}
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

function KpiCard({ label, value, tone, wide = false }: { label: string; value: string; tone: "blue" | "rose" | "amber" | "emerald" | "slate" | "violet"; wide?: boolean }) {
  const toneClass: Record<string, string> = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };
  return <div className={`rounded-lg border p-4 ${toneClass[tone]} ${wide ? "xl:col-span-2" : ""}`}><div className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</div><div className="mt-2 font-mono text-xl font-black tabular-nums">{value}</div></div>;
}

function SlaBadge({ sla }: { sla: ApprovalSlaInfo }) {
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${getApprovalSlaClass(sla.status)}`}>{sla.label}</span>;
}

function SlaFilterBar({ active, onChange }: { active: SlaFilter; onChange: (value: SlaFilter) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
      {slaFilters.map((filter) => (
        <button key={filter.id} type="button" onClick={() => onChange(filter.id)} className={`h-8 rounded-md px-3 text-xs font-bold ${active === filter.id ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--text-secondary)]"}`}>
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function NotificationPanel({ notifications, derived }: { notifications: NotificationItem[]; derived: boolean }) {
  const severityClass: Record<string, string> = { CRITICAL: "text-rose-600", ERROR: "text-rose-600", WARNING: "text-amber-600", INFO: "text-blue-600" };
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[var(--text-primary)]">Trung t\u00e2m th\u00f4ng b\u00e1o duy\u1ec7t</h2>
          <p className="mt-1 text-[11px] font-semibold text-[var(--text-secondary)]">{derived ? "Thông báo được tổng hợp từ hàng đợi phê duyệt hiện tại." : "Thông báo từ hệ thống."}</p>
        </div>
        <span className="rounded bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-600">{notifications.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-xs font-semibold text-[var(--text-secondary)]">Không có thông báo phê duyệt cần xử lý.</div>
        ) : (
          notifications.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
              <div className={`text-xs font-black ${severityClass[item.severity] || "text-[var(--text-primary)]"}`}>{item.title}</div>
              <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{item.message}</p>
              <div className="mt-2 text-[10px] font-semibold text-[var(--text-tertiary)]">{item.derived ? "Tổng hợp từ hàng đợi" : formatDateTime(item.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DelegationPanel({ role, averageWaiting }: { role: string; averageWaiting: number | null }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-black text-[var(--text-primary)]">\u1ee6y quy\u1ec1n x\u1eed l\u00fd</h2>
      <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
        Ưu tiên xử lý chứng từ quá hạn, chứng từ giá trị lớn và hồ sơ bị trả lại để giảm tồn đọng cuối ngày.
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        <InfoLine label="Ng\u01b0\u1eddi x\u1eed l\u00fd hi\u1ec7n t\u1ea1i" value={role} />
        <InfoLine label="Ng\u01b0\u1eddi \u0111\u01b0\u1ee3c \u0111\u1ec1 xu\u1ea5t thay th\u1ebf" value="K\u1ebf to\u00e1n tr\u01b0\u1edfng/Gi\u00e1m \u0111\u1ed1c theo gi\u00e1 tr\u1ecb ch\u1ee9ng t\u1eeb" />
        <InfoLine label="Th\u1eddi gian \u1ee7y quy\u1ec1n" value="Ch\u01b0a k\u00edch ho\u1ea1t" />
        <InfoLine label="Tr\u1ea1ng th\u00e1i" value="Chưa kích hoạt" />
      </div>
      <button type="button" disabled className="mt-3 h-9 w-full cursor-not-allowed rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-secondary)] opacity-70">
        Ch\u01b0a cho ph\u00e9p \u1ee7y quy\u1ec1n th\u1eadt
      </button>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-2"><div className="text-[10px] font-black uppercase text-[var(--text-tertiary)]">{label}</div><div className="mt-1 font-bold text-[var(--text-primary)]">{value}</div></div>;
}

function BulkToolbar({ selectedCount, totalAmount, approveEligible, approveBlocked, rejectEligible, rejectBlocked, onClear, onApprove, onReject }: { selectedCount: number; totalAmount: number; approveEligible: number; approveBlocked: number; rejectEligible: number; rejectBlocked: number; onClear: () => void; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="sticky top-2 z-30 rounded-lg border border-blue-500/30 bg-[var(--card)] p-3 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2 text-xs font-bold text-[var(--text-secondary)] sm:grid-cols-4">
          <span>\u0110\u00e3 ch\u1ecdn: {selectedCount} ch\u1ee9ng t\u1eeb</span>
          <span>T\u1ed5ng gi\u00e1 tr\u1ecb: {formatVnd(totalAmount)}</span>
          <span>C\u00f3 th\u1ec3 duy\u1ec7t: {approveEligible}</span>
          <span>C\u1ea7n xem l\u1ea1i: {Math.max(approveBlocked, rejectBlocked)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onApprove} disabled={approveEligible === 0 || approveBlocked > 0} className="h-8 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Duy\u1ec7t h\u00e0ng lo\u1ea1t</button>
          <button type="button" onClick={onReject} disabled={rejectEligible === 0 || rejectBlocked > 0} className="h-8 rounded-md bg-rose-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">T\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t</button>
          <button type="button" onClick={onClear} className="h-8 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--text-primary)]">B\u1ecf ch\u1ecdn</button>
        </div>
      </div>
      {(approveBlocked > 0 || rejectBlocked > 0) && <div className="mt-2 text-[11px] font-semibold text-amber-600">C\u00f3 d\u00f2ng kh\u00f4ng h\u1ee3p l\u1ec7. Vui l\u00f2ng b\u1ecf c\u00e1c d\u00f2ng b\u1ecb ch\u1eb7n tr\u01b0\u1edbc khi x\u1eed l\u00fd h\u00e0ng lo\u1ea1t.</div>}
    </div>
  );
}

function SingleApproveConfirm({ item, actionBusy, onCancel, onConfirm }: { item: ApprovalQueueItem | null; actionBusy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="leading-6 text-[var(--text-secondary)]">B\u1ea1n s\u1eafp ph\u00ea duy\u1ec7t ch\u1ee9ng t\u1eeb <span className="font-bold text-[var(--text-primary)]">{item?.docNo}</span>. Vui l\u00f2ng ki\u1ec3m tra ch\u1ee9ng t\u1eeb ngu\u1ed3n, c\u00f4ng tr\u00ecnh v\u00e0 s\u1ed1 ti\u1ec1n tr\u01b0\u1edbc khi th\u1ef1c hi\u1ec7n.</p>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">Ghi s\u1ed5 s\u1ebd \u1ea3nh h\u01b0\u1edfng s\u1ed1 li\u1ec7u k\u1ebf to\u00e1n. Sprint n\u00e0y ch\u1ec9 ph\u00ea duy\u1ec7t theo API hi\u1ec7n h\u1eefu, kh\u00f4ng t\u1ef1 ghi s\u1ed5.</div>
      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button className="rounded-md border border-[var(--border)] px-4 py-2 text-xs font-bold" onClick={onCancel} disabled={actionBusy}>H\u1ee7y</button>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60" onClick={onConfirm} disabled={actionBusy}>X\u00e1c nh\u1eadn ph\u00ea duy\u1ec7t</button>
      </div>
    </div>
  );
}

function BulkPreviewModal({ mode, items, guards, rejectReason, setRejectReason, actionBusy, onClose, onRun }: { mode: BulkMode | null; items: ApprovalQueueItem[]; guards: Array<{ item: ApprovalQueueItem; guard: { code: GuardCode; reason: string } }>; rejectReason: string; setRejectReason: (value: string) => void; actionBusy: boolean; onClose: () => void; onRun: () => void }) {
  const blocked = guards.filter((row) => row.guard.code !== "ELIGIBLE");
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const canRun = mode !== null && items.length > 0 && blocked.length === 0 && (mode === "approve" || rejectReason.trim().length >= 5);
  return (
    <EnterpriseModal isOpen={Boolean(mode)} onClose={onClose} title={mode === "approve" ? "X\u00e1c nh\u1eadn duy\u1ec7t h\u00e0ng lo\u1ea1t" : "X\u00e1c nh\u1eadn t\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t"} maxWidth="4xl">
      <div className="space-y-4">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">B\u1ea1n s\u1eafp {mode === "approve" ? "ph\u00ea duy\u1ec7t" : "t\u1eeb ch\u1ed1i"} {items.length} ch\u1ee9ng t\u1eeb v\u1edbi t\u1ed5ng gi\u00e1 tr\u1ecb {formatVnd(total)}. Thao t\u00e1c n\u00e0y s\u1ebd g\u1ecdi API hi\u1ec7n h\u1eefu theo t\u1eebng ch\u1ee9ng t\u1eeb \u0111\u1ec3 backend ghi audit ri\u00eang.</div>
        {mode === "reject" && <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Nh\u1eadp l\u00fd do t\u1eeb ch\u1ed1i \u00e1p d\u1ee5ng cho to\u00e0n b\u1ed9 ch\u1ee9ng t\u1eeb \u0111\u00e3 ch\u1ecdn..." className="h-24 w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" />}
        <div className="max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[760px] text-xs"><thead className="bg-[var(--secondary)] text-[var(--text-secondary)]"><tr><th className="p-2 text-left">Lo\u1ea1i</th><th className="p-2 text-left">S\u1ed1 ch\u1ee9ng t\u1eeb</th><th className="p-2 text-right">S\u1ed1 ti\u1ec1n</th><th className="p-2 text-left">Guard</th><th className="p-2 text-left">L\u00fd do</th></tr></thead><tbody>{guards.map(({ item, guard }) => <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-2">{item.documentType}</td><td className="p-2 font-mono">{item.docNo}</td><td className="p-2 text-right font-mono">{formatVnd(item.amount)}</td><td className={guard.code === "ELIGIBLE" ? "p-2 font-bold text-emerald-600" : "p-2 font-bold text-rose-600"}>{guard.code}</td><td className="p-2">{guard.reason}</td></tr>)}</tbody></table>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4"><button type="button" onClick={onClose} disabled={actionBusy} className="rounded-md border border-[var(--border)] px-4 py-2 text-xs font-bold">H\u1ee7y</button><button type="button" onClick={onRun} disabled={!canRun || actionBusy} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">X\u00e1c nh\u1eadn x\u1eed l\u00fd</button></div>
      </div>
    </EnterpriseModal>
  );
}

function BulkResultModal({ results, onClose }: { results: BulkResultRow[] | null; onClose: () => void }) {
  const success = results?.filter((row) => row.result === "Th\u00e0nh c\u00f4ng").length || 0;
  const failed = results?.filter((row) => row.result === "Th\u1ea5t b\u1ea1i").length || 0;
  const skipped = results?.filter((row) => row.result === "B\u1ecf qua").length || 0;
  return (
    <EnterpriseModal isOpen={Boolean(results)} onClose={onClose} title="K\u1ebft qu\u1ea3 x\u1eed l\u00fd h\u00e0ng lo\u1ea1t" maxWidth="4xl">
      <div className="space-y-4">
        <div className="grid gap-3 text-sm font-bold sm:grid-cols-3"><div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700">Th\u00e0nh c\u00f4ng: {success}</div><div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-rose-700">Th\u1ea5t b\u1ea1i: {failed}</div><div className="rounded-md border border-slate-500/20 bg-slate-500/10 p-3 text-slate-700">B\u1ecf qua: {skipped}</div></div>
        <div className="max-h-72 overflow-auto rounded-lg border border-[var(--border)]"><table className="w-full min-w-[720px] text-xs"><thead className="bg-[var(--secondary)]"><tr><th className="p-2 text-left">Lo\u1ea1i ch\u1ee9ng t\u1eeb</th><th className="p-2 text-left">S\u1ed1 ch\u1ee9ng t\u1eeb</th><th className="p-2 text-right">S\u1ed1 ti\u1ec1n</th><th className="p-2 text-left">K\u1ebft qu\u1ea3</th><th className="p-2 text-left">L\u00fd do</th></tr></thead><tbody>{(results || []).map((row) => <tr key={row.id} className="border-t border-[var(--border)]"><td className="p-2">{row.documentType}</td><td className="p-2 font-mono">{row.docNo}</td><td className="p-2 text-right font-mono">{formatVnd(row.amount)}</td><td className="p-2 font-bold">{row.result}</td><td className="p-2">{row.reason}</td></tr>)}</tbody></table></div>
        <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white">\u0110\u00f3ng</button></div>
      </div>
    </EnterpriseModal>
  );
}

function ShortcutHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const rows = [["J / ArrowDown", "Xu\u1ed1ng d\u00f2ng ti\u1ebfp theo"], ["K / ArrowUp", "L\u00ean d\u00f2ng tr\u01b0\u1edbc"], ["Enter", "M\u1edf chi ti\u1ebft d\u00f2ng \u0111ang focus"], ["Esc", "\u0110\u00f3ng drawer ho\u1eb7c modal"], ["A", "M\u1edf x\u00e1c nh\u1eadn ph\u00ea duy\u1ec7t n\u1ebfu c\u00f3 quy\u1ec1n"], ["R", "M\u1edf modal t\u1eeb ch\u1ed1i n\u1ebfu c\u00f3 quy\u1ec1n"], ["/", "Focus \u00f4 t\u00ecm ki\u1ebfm"], ["Space", "Ch\u1ecdn ho\u1eb7c b\u1ecf ch\u1ecdn d\u00f2ng \u0111ang focus"], ["?", "M\u1edf tr\u1ee3 gi\u00fap ph\u00edm t\u1eaft"]];
  return <EnterpriseModal isOpen={isOpen} onClose={onClose} title="Ph\u00edm t\u1eaft" maxWidth="lg"><div className="space-y-2">{rows.map(([key, desc]) => <div key={key} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"><kbd className="rounded bg-[var(--secondary)] px-2 py-1 font-mono text-xs font-bold">{key}</kbd><span className="text-[var(--text-secondary)]">{desc}</span></div>)}</div></EnterpriseModal>;
}


function formatRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    "Quản trị hệ thống": "Quản trị hệ thống",
    ADMIN: "Quản trị doanh nghiệp",
    CFO: "Giám đốc tài chính",
    GROUP_DIRECTOR: "Ban giám đốc",
    ACCOUNTANT: "Kế toán",
    MANAGER: "Quản lý công trình",
    AUDITOR: "Kiểm soát nội bộ",
    VIEWER: "Người xem",
  };
  return role ? labels[role] || "Người xử lý" : "Đang tải";
}
