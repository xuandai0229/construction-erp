/**
 * Theme-aware status styles mapping.
 * Avoids raw HEX color definitions and maps states to semantic classes.
 */

export const StatusStyleMap: Record<string, string> = {
  DRAFT: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  SUBMITTED: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  APPROVED: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  POSTED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  REVERSED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  REJECTED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  PAID: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  PARTIAL: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 border border-red-500/20",
  PENDING: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  FAILED: "bg-red-500/10 text-red-500 border border-red-500/20",
  SUCCESS: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  WARNING: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 border border-red-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
};

export function getStatusStyleClass(status: string): string {
  if (!status) return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
  return StatusStyleMap[status.toUpperCase()] || "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
}
