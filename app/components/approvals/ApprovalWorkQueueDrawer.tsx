"use client";

import { useState } from "react";
import AuditTrailPanel from "@/app/components/accounting/AuditTrailPanel";
import ApprovalWorkflowStepper from "@/app/components/approvals/ApprovalWorkflowStepper";
import { EnterpriseTabs } from "@/app/components/ui-enterprise";
import { formatVnd } from "@/app/components/dashboard-data";
import { calculateApprovalSla, getApprovalSlaClass } from "@/lib/approval-sla";

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
  { id: "overview", label: "T\u1ed5ng quan" },
  { id: "sla", label: "SLA" },
  { id: "workflow", label: "Workflow" },
  { id: "audit", label: "L\u1ecbch s\u1eed thao t\u00e1c" },
  { id: "source", label: "Ch\u1ee9ng t\u1eeb ngu\u1ed3n" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function getSourceLink(item: ApprovalQueueItem) {
  if (item.module === "INVOICE") return `/revenue?invoiceId=${item.id}`;
  if (item.module === "COST") return `/costs?costId=${item.id}`;
  if (item.module === "ADVANCE") return `/settings?tab=advance&id=${item.id}`;
  if (item.module === "SETTLEMENT") return `/settings?tab=settlement&id=${item.id}`;
  return "#";
}

function getEscalationMessage(slaStatus: string) {
  if (slaStatus === "OVERDUE") return "Ch\u1ee9ng t\u1eeb n\u00e0y \u0111\u00e3 qu\u00e1 h\u1ea1n x\u1eed l\u00fd.";
  if (slaStatus === "HIGH_VALUE") return "Ch\u1ee9ng t\u1eeb n\u00e0y c\u00f3 gi\u00e1 tr\u1ecb l\u1edbn, c\u1ea7n c\u1ea5p duy\u1ec7t cao h\u01a1n.";
  if (slaStatus === "NEEDS_FIX") return "Ch\u1ee9ng t\u1eeb n\u00e0y b\u1ecb t\u1eeb ch\u1ed1i, c\u1ea7n ng\u01b0\u1eddi t\u1ea1o b\u1ed5 sung.";
  if (slaStatus === "DUE_SOON") return "Ch\u1ee9ng t\u1eeb n\u00e0y s\u1eafp qu\u00e1 h\u1ea1n x\u1eed l\u00fd.";
  return "Ch\u1ee9ng t\u1eeb \u0111ang ch\u1edd \u0111\u1ed1i so\u00e1t d\u1eef li\u1ec7u, kh\u00f4ng d\u00f9ng l\u00e0m s\u1ed5 k\u1ebf to\u00e1n th\u1eadt.";
}

export default function ApprovalWorkQueueDrawer({ isOpen, item, onClose, onApprove, onReject }: ApprovalWorkQueueDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  if (!isOpen || !item) return null;
  const sla = calculateApprovalSla({ status: item.status, priority: item.priority, createdAt: item.createdAt, submittedAt: item.submittedAt, dueAt: item.dueAt });

  return (
    <div className="fixed inset-0 z-[650]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[var(--text-primary)]">Chi ti\u1ebft c\u00f4ng vi\u1ec7c duy\u1ec7t</h2>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">{item.documentType}</span>
                <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${getApprovalSlaClass(sla.status)}`}>{sla.label}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">S\u1ed1 ch\u1ee9ng t\u1eeb: <span className="font-mono text-[var(--text-primary)]">{item.docNo}</span></p>
            </div>
            <button type="button" onClick={onClose} aria-label="\u0110\u00f3ng chi ti\u1ebft c\u00f4ng vi\u1ec7c duy\u1ec7t" className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-lg font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)]">x</button>
          </div>
        </header>

        <EnterpriseTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Lo\u1ea1i ch\u1ee9ng t\u1eeb" value={item.documentType} />
                <Info label="Tr\u1ea1ng th\u00e1i" value={item.status} />
                <Info label="C\u00f4ng tr\u00ecnh" value={item.projectName} />
                <Info label="Nh\u00e0 cung c\u1ea5p/Kh\u00e1ch h\u00e0ng" value={item.partnerName} />
                <Info label="Ng\u01b0\u1eddi t\u1ea1o" value={item.creatorName} />
                <Info label="Ng\u01b0\u1eddi \u0111ang x\u1eed l\u00fd" value={item.currentHandler} />
                <Info label="Ng\u00e0y t\u1ea1o" value={formatDateTime(item.createdAt)} />
                <Info label="Ng\u00e0y g\u1eedi duy\u1ec7t" value={formatDateTime(item.submittedAt)} />
                <Info label="H\u1ea1n x\u1eed l\u00fd" value={formatDateTime(item.dueAt)} />
                <Info label="\u01afu ti\u00ean" value={item.priority} />
              </div>
              <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
                <div className="text-[10px] font-black uppercase text-[var(--primary)]">S\u1ed1 ti\u1ec1n ch\u1ee9ng t\u1eeb</div>
                <div className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--primary)]">{formatVnd(item.amount)}</div>
              </div>
              <WarningBox text="D\u1eef li\u1ec7u \u0111\u1ed1i so\u00e1t c\u00f4ng tr\u00ecnh/c\u00f4ng n\u1ee3 c\u00f2n ch\u1edd k\u1ebf to\u00e1n x\u00e1c nh\u1eadn. Kh\u00f4ng d\u00f9ng l\u00e0m s\u1ed5 k\u1ebf to\u00e1n th\u1eadt." />
            </div>
          )}

          {activeTab === "sla" && (
            <div className="space-y-4">
              <WarningBox text={getEscalationMessage(sla.status)} />
              {sla.warning && <WarningBox text={sla.warning} />}
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Th\u1eddi gian ch\u1edd x\u1eed l\u00fd" value={sla.waitingLabel} />
                <Info label="M\u1ed1c t\u00ednh SLA" value={sla.basisLabel} />
                <Info label="Tr\u1ea1ng th\u00e1i SLA" value={sla.label} />
                <Info label="Ng\u01b0\u1eddi n\u00ean x\u1eed l\u00fd" value={sla.recommendedHandler} />
                <Info label="C\u1ea5p duy\u1ec7t \u0111\u1ec1 xu\u1ea5t" value={sla.suggestedApprovalLevel} />
                <Info label="H\u1ea1n x\u1eed l\u00fd" value={formatDateTime(item.dueAt)} />
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-sm font-black text-[var(--text-primary)]">\u1ee6y quy\u1ec1n duy\u1ec7t</div>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">\u1ee6y quy\u1ec1n duy\u1ec7t \u0111ang \u1edf ch\u1ebf \u0111\u1ed9 pilot read-only. Ch\u01b0a cho ph\u00e9p thao t\u00e1c th\u1eadt v\u00ec c\u1ea7n backend assignment/delegation/audit guard \u0111\u1ea7y \u0111\u1ee7.</p>
                <button type="button" disabled className="mt-3 h-9 cursor-not-allowed rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-secondary)] opacity-70">Ch\u01b0a k\u00edch ho\u1ea1t \u1ee7y quy\u1ec1n th\u1eadt</button>
              </div>
            </div>
          )}

          {activeTab === "workflow" && <ApprovalWorkflowStepper status={item.status} pendingCount={item.status === "PENDING" || item.status === "SUBMITTED" ? 1 : 0} processedCount={item.status === "APPROVED" ? 1 : 0} />}

          {activeTab === "audit" && (
            <AuditTrailPanel entityType={item.sourceEntity} entityId={item.id} title="L\u1ecbch s\u1eed thao t\u00e1c ch\u1ee9ng t\u1eeb" description="Audit log \u0111\u1ecdc-only theo ch\u1ee9ng t\u1eeb \u0111ang \u0111\u01b0\u1ee3c xem. N\u1ebfu ch\u01b0a c\u00f3 l\u1ecbch s\u1eed, h\u1ec7 th\u1ed1ng hi\u1ec3n th\u1ecb empty state v\u00e0 kh\u00f4ng t\u1ea1o d\u1eef li\u1ec7u gi\u1ea3." limit={20} />
          )}

          {activeTab === "source" && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-black text-[var(--text-primary)]">Ch\u1ee9ng t\u1eeb ngu\u1ed3n</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">M\u1edf m\u00e0n h\u00ecnh nghi\u1ec7p v\u1ee5 g\u1ed1c \u0111\u1ec3 ki\u1ec3m tra \u0111\u1ea7y \u0111\u1ee7 n\u1ed9i dung, h\u1ee3p \u0111\u1ed3ng, c\u00f4ng tr\u00ecnh v\u00e0 s\u1ed1 ti\u1ec1n tr\u01b0\u1edbc khi duy\u1ec7t.</p>
              <a href={getSourceLink(item)} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--muted)]">M\u1edf ch\u1ee9ng t\u1eeb ngu\u1ed3n</a>
            </div>
          )}
        </main>

        <footer className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--card)] px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => item.canReject && onReject(item)} disabled={!item.canReject} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-4 text-xs font-bold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50" title={!item.canReject ? "Ch\u1ee9c n\u0103ng s\u1ebd \u0111\u01b0\u1ee3c k\u00edch ho\u1ea1t sau khi ho\u00e0n t\u1ea5t ki\u1ec3m tra workflow backend ho\u1eb7c ph\u00e2n quy\u1ec1n." : "T\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb"}>T\u1eeb ch\u1ed1i</button>
          <button type="button" onClick={() => item.canApprove && onApprove(item)} disabled={!item.canApprove} className="h-9 rounded-md bg-emerald-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" title={!item.canApprove ? "B\u1ea1n ch\u01b0a c\u00f3 quy\u1ec1n duy\u1ec7t ch\u1ee9ng t\u1eeb n\u00e0y ho\u1eb7c b\u1ecb ch\u1eb7n b\u1ea5t ki\u00eam nhi\u1ec7m." : "Ph\u00ea duy\u1ec7t ch\u1ee9ng t\u1eeb"}>Ph\u00ea duy\u1ec7t</button>
        </footer>
      </aside>
    </div>
  );
}

function WarningBox({ text }: { text: string }) {
  return <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">{text}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="text-[10px] font-black uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]" title={value}>{value || "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u"}</div>
    </div>
  );
}
