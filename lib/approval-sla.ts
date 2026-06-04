export type ApprovalSlaStatus = "NORMAL" | "DUE_SOON" | "OVERDUE" | "HIGH_VALUE" | "NEEDS_FIX";

export interface ApprovalSlaInput {
  status: string;
  priority?: string | null;
  createdAt?: string | Date | null;
  submittedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  dueAt?: string | Date | null;
}

export interface ApprovalSlaInfo {
  status: ApprovalSlaStatus;
  label: string;
  waitingHours: number | null;
  waitingLabel: string;
  basisLabel: string;
  warning: string | null;
  recommendedHandler: string;
  suggestedApprovalLevel: string;
}

const HOUR_MS = 60 * 60 * 1000;

function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isRejected(status: string) {
  return ["REJECTED", "CANCELLED"].includes(status.toUpperCase());
}

export function calculateApprovalSla(input: ApprovalSlaInput, now = new Date()): ApprovalSlaInfo {
  const dueAt = parseDate(input.dueAt);
  const submittedAt = parseDate(input.submittedAt);
  const updatedAt = parseDate(input.updatedAt);
  const createdAt = parseDate(input.createdAt);
  const basisDate = submittedAt || updatedAt || createdAt;
  const waitingHours = basisDate ? Math.max(0, Math.floor((now.getTime() - basisDate.getTime()) / HOUR_MS)) : null;
  const usesFallbackDate = !submittedAt && Boolean(updatedAt || createdAt);
  const highValue = input.priority === "C\u1ea7n c\u1ea5p cao";

  let status: ApprovalSlaStatus = "NORMAL";
  if (isRejected(input.status)) {
    status = "NEEDS_FIX";
  } else if (highValue) {
    status = "HIGH_VALUE";
  } else if (dueAt && now > dueAt) {
    status = "OVERDUE";
  } else if (dueAt && dueAt.getTime() - now.getTime() <= 24 * HOUR_MS) {
    status = "DUE_SOON";
  } else if (waitingHours !== null && waitingHours > 48) {
    status = "OVERDUE";
  } else if (waitingHours !== null && waitingHours >= 24) {
    status = "DUE_SOON";
  }

  const labelByStatus: Record<ApprovalSlaStatus, string> = {
    NORMAL: "B\u00ecnh th\u01b0\u1eddng",
    DUE_SOON: "S\u1eafp qu\u00e1 h\u1ea1n",
    OVERDUE: "Qu\u00e1 h\u1ea1n",
    HIGH_VALUE: "C\u1ea7n c\u1ea5p cao",
    NEEDS_FIX: "C\u1ea7n b\u1ed5 sung",
  };

  return {
    status,
    label: labelByStatus[status],
    waitingHours,
    waitingLabel: waitingHours === null ? "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u" : waitingHours < 1 ? "D\u01b0\u1edbi 1 gi\u1edd" : `${waitingHours.toLocaleString("vi-VN")} gi\u1edd`,
    basisLabel: submittedAt ? "Ng\u00e0y g\u1eedi duy\u1ec7t" : updatedAt ? "Ng\u00e0y c\u1eadp nh\u1eadt g\u1ea7n nh\u1ea5t" : createdAt ? "Ng\u00e0y t\u1ea1o" : "Ch\u01b0a c\u00f3 m\u1ed1c t\u00ednh SLA",
    warning: usesFallbackDate
      ? "Th\u1eddi h\u1ea1n x\u1eed l\u00fd \u0111ang \u0111\u01b0\u1ee3c t\u00ednh theo ng\u00e0y c\u1eadp nh\u1eadt g\u1ea7n nh\u1ea5t ho\u1eb7c ng\u00e0y t\u1ea1o do ch\u1ee9ng t\u1eeb ch\u01b0a c\u00f3 th\u1eddi \u0111i\u1ec3m g\u1eedi duy\u1ec7t ri\u00eang."
      : null,
    recommendedHandler: status === "NEEDS_FIX" ? "Ng\u01b0\u1eddi t\u1ea1o b\u1ed5 sung h\u1ed3 s\u01a1" : highValue ? "Gi\u00e1m \u0111\u1ed1c ho\u1eb7c c\u1ea5p duy\u1ec7t cao h\u01a1n" : "K\u1ebf to\u00e1n tr\u01b0\u1edfng",
    suggestedApprovalLevel: highValue ? "C\u1ea5p duy\u1ec7t cao" : "C\u1ea5p duy\u1ec7t k\u1ebf to\u00e1n",
  };
}

export function getApprovalSlaClass(status: ApprovalSlaStatus) {
  if (status === "OVERDUE") return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (status === "DUE_SOON") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "HIGH_VALUE") return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  if (status === "NEEDS_FIX") return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}
