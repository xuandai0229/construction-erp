"use client";

import { useState } from "react";
import AuditTrailPanel from "@/app/components/accounting/AuditTrailPanel";
import ApprovalWorkflowStepper from "@/app/components/approvals/ApprovalWorkflowStepper";
import { EnterpriseTabs } from "@/app/components/ui-enterprise";
import { formatVnd } from "@/app/components/dashboard-data";

export interface ApprovalQueueItem {
  id: string;
  module: "INVOICE" | "COST" | "ADVANCE" | "SETTLEMENT";
  documentType: string;
  docNo: string;
  projectId: string | null;
  projectName: string;
  partnerName: string;
  creatorId: string | null;
  creatorName: string;
  createdAt: string;
  submittedAt: string | null;
  amount: number;
  status: string;
  priority: string;
  dueStatus: string;
  dueAt: string;
  assignedRole: string;
  currentHandler: string;
  canApprove: boolean;
  canReject: boolean;
  sourceEntity: string;
}

interface ApprovalWorkQueueDrawerProps {
  isOpen: boolean;
  item: ApprovalQueueItem | null;
  onClose: () => void;
  onApprove: (item: ApprovalQueueItem) => void;
  onReject: (item: ApprovalQueueItem) => void;
}

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "workflow", label: "Workflow" },
  { id: "audit", label: "Lịch sử thao tác" },
  { id: "source", label: "Chứng từ nguồn" },
];

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

function getSourceLink(item: ApprovalQueueItem) {
  if (item.module === "INVOICE") return `/revenue?invoiceId=${item.id}`;
  if (item.module === "COST") return `/costs?costId=${item.id}`;
  if (item.module === "ADVANCE") return `/settings?tab=advance&id=${item.id}`;
  if (item.module === "SETTLEMENT") return `/settings?tab=settlement&id=${item.id}`;
  return "#";
}

export default function ApprovalWorkQueueDrawer({ isOpen, item, onClose, onApprove, onReject }: ApprovalWorkQueueDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[650]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[var(--text-primary)]">Chi tiết công việc duyệt</h2>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                  {item.documentType}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                Số chứng từ: <span className="font-mono text-[var(--text-primary)]">{item.docNo}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết công việc duyệt"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-lg font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              x
            </button>
          </div>
        </header>

        <EnterpriseTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Loại chứng từ" value={item.documentType} />
                <Info label="Trạng thái" value={item.status} />
                <Info label="Công trình" value={item.projectName} />
                <Info label="Nhà cung cấp/Khách hàng" value={item.partnerName} />
                <Info label="Người tạo" value={item.creatorName} />
                <Info label="Người đang xử lý" value={item.currentHandler} />
                <Info label="Ngày tạo" value={formatDateTime(item.createdAt)} />
                <Info label="Ngày gửi duyệt" value={formatDateTime(item.submittedAt)} />
                <Info label="Hạn xử lý" value={formatDateTime(item.dueAt)} />
                <Info label="Ưu tiên" value={item.priority} />
              </div>

              <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
                <div className="text-[10px] font-black uppercase text-[var(--primary)]">Số tiền chứng từ</div>
                <div className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--primary)]">{formatVnd(item.amount)}</div>
              </div>

              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                Dữ liệu đối soát công trình/công nợ còn chờ kế toán xác nhận. Không dùng làm sổ kế toán thật.
              </div>
            </div>
          )}

          {activeTab === "workflow" && (
            <ApprovalWorkflowStepper status={item.status} pendingCount={item.status === "PENDING" || item.status === "SUBMITTED" ? 1 : 0} processedCount={item.status === "APPROVED" ? 1 : 0} />
          )}

          {activeTab === "audit" && (
            <AuditTrailPanel
              entityType={item.sourceEntity}
              entityId={item.id}
              title="Lịch sử thao tác chứng từ"
              description="Audit log đọc-only theo chứng từ đang được xem. Nếu chưa có lịch sử, hệ thống hiển thị empty state và không tạo dữ liệu giả."
              limit={20}
            />
          )}

          {activeTab === "source" && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-black text-[var(--text-primary)]">Chứng từ nguồn</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Mở màn hình nghiệp vụ gốc để kiểm tra đầy đủ nội dung, hợp đồng, công trình và số tiền trước khi duyệt.
              </p>
              <a href={getSourceLink(item)} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--muted)]">
                Mở chứng từ nguồn
              </a>
            </div>
          )}
        </main>

        <footer className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--card)] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => item.canReject && onReject(item)}
            disabled={!item.canReject}
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-4 text-xs font-bold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            title={!item.canReject ? "Chức năng sẽ được kích hoạt sau khi hoàn tất kiểm tra workflow backend hoặc phân quyền." : "Từ chối chứng từ"}
          >
            Từ chối
          </button>
          <button
            type="button"
            onClick={() => item.canApprove && onApprove(item)}
            disabled={!item.canApprove}
            className="h-9 rounded-md bg-emerald-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            title={!item.canApprove ? "Bạn chưa có quyền duyệt chứng từ này hoặc bị chặn bất kiêm nhiệm." : "Phê duyệt chứng từ"}
          >
            Phê duyệt
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="text-[10px] font-black uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]" title={value}>
        {value || "Chưa có dữ liệu"}
      </div>
    </div>
  );
}
