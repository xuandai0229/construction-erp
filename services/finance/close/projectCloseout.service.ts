import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { CloseManagementService } from "./closeManagement.service";

export class ProjectCloseoutService {
  /**
   * Final Account Reconciliation for a project closeout.
   * Validates all financial obligations are settled before archiving the project.
   * This is the definitive pre-closeout gate for construction projects.
   */
  static async runFinalAccountCheck(projectId: string) {
    const issues: { severity: "BLOCKING" | "WARNING"; category: string; detail: string }[] = [];

    // ── 1. Open Subcontracts ─────────────────────────────────────────────────
    const openSubcontracts = await prisma.subcontract.count({
      where: { projectId, status: { notIn: ["COMPLETED", "TERMINATED"] }, deletedAt: null },
    });
    if (openSubcontracts > 0) {
      issues.push({ severity: "BLOCKING", category: "Subcontract", detail: `${openSubcontracts} subcontract(s) not COMPLETED or TERMINATED` });
    }

    // ── 2. Unpaid Invoices ───────────────────────────────────────────────────
    const unpaidInvoices = await prisma.invoice.findMany({
      where: { projectId, status: { in: ["SENT", "PARTIAL", "OVERDUE"] }, deletedAt: null },
      select: { id: true, remainingAmount: true },
    });
    const unpaidTotal = unpaidInvoices.reduce((s, i) => s.add(i.remainingAmount), new Decimal(0));
    if (unpaidInvoices.length > 0) {
      issues.push({ severity: "BLOCKING", category: "AR", detail: `${unpaidInvoices.length} invoice(s) outstanding — ${unpaidTotal.toFixed(0)} VND uncollected` });
    }

    // ── 3. Retention Not Released ────────────────────────────────────────────
    const retentionTotal = await prisma.invoice.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { retentionAmount: true },
    });
    const retentionHeld = retentionTotal._sum.retentionAmount ?? new Decimal(0);
    if (retentionHeld.gt(0)) {
      issues.push({ severity: "WARNING", category: "Retention", detail: `${retentionHeld.toFixed(0)} VND retention not yet released — verify warranty period` });
    }

    // ── 4. Pending Variation Orders ──────────────────────────────────────────
    const pendingVOs = await prisma.contractChange.count({
      where: { contract: { projectId }, status: "PENDING" },
    });
    if (pendingVOs > 0) {
      issues.push({ severity: "BLOCKING", category: "VO/Claim", detail: `${pendingVOs} Variation Order(s) not settled` });
    }

    // ── 5. Open Approval Requests ────────────────────────────────────────────
    const openApprovals = await prisma.approvalRequest.count({
      where: { projectId, status: "PENDING" },
    });
    if (openApprovals > 0) {
      issues.push({ severity: "BLOCKING", category: "Governance", detail: `${openApprovals} approval(s) still PENDING` });
    }

    // ── 6. Cost Records after project end date ───────────────────────────────
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { endDate: true, name: true } });
    if (project?.endDate) {
      const latePostings = await prisma.costRecord.count({
        where: { projectId, date: { gt: project.endDate }, deletedAt: null },
      });
      if (latePostings > 0) {
        issues.push({ severity: "WARNING", category: "Cost Control", detail: `${latePostings} cost record(s) posted after project end date` });
      }
    }

    const blockers = issues.filter(i => i.severity === "BLOCKING");
    const warnings = issues.filter(i => i.severity === "WARNING");

    return {
      projectId,
      projectName: project?.name ?? "Unknown",
      readyToClose: blockers.length === 0,
      blockers,
      warnings,
      summary: blockers.length === 0 && warnings.length === 0
        ? "ALL CLEAR — Project is ready for final close."
        : `${blockers.length} blocker(s), ${warnings.length} warning(s) — action required.`,
    };
  }

  /**
   * Executes the final retention release journal entry.
   * Double-entry: Debit Accrued Liabilities (Retention Payable) / Credit Cash/Bank
   */
  static async releaseRetention(params: { projectId: string; invoiceId: string; releasedById: string }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      select: { id: true, retentionAmount: true, projectId: true },
    });
    if (!invoice || invoice.projectId !== params.projectId) throw new Error("Invoice not found.");
    if (invoice.retentionAmount.lte(0)) throw new Error("No retention to release.");

    const retentionPayable = await prisma.ledgerAccount.findFirst({ where: { code: "3310", isActive: true } });
    const bankAccount      = await prisma.ledgerAccount.findFirst({ where: { code: "1120", isActive: true } });

    if (!retentionPayable || !bankAccount) {
      throw new Error("Accounts 3310 (Retention Payable) and 1120 (Bank) must exist in Chart of Accounts.");
    }

    return prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.create({
        data: {
          projectId:   params.projectId,
          description: `[RETENTION RELEASE] Invoice ${params.invoiceId}`,
          reference:   `RET-REL-${params.invoiceId.slice(0, 8)}`,
          sourceType:  "RETENTION_RELEASE",
          sourceId:    params.invoiceId,
          isPosted:    true,
          lines: {
            create: [
              { accountId: retentionPayable.id, amount: invoice.retentionAmount, type: "DEBIT",  description: "Retention Released" },
              { accountId: bankAccount.id,       amount: invoice.retentionAmount, type: "CREDIT", description: "Retention Payment" },
            ],
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId:   params.releasedById,
          action:   "RETENTION_RELEASE",
          entity:   "Invoice",
          entityId: params.invoiceId,
          newData:  { amount: invoice.retentionAmount, journalId: journal.id },
          severity: "CRITICAL",
          reason:   "Retention release on project closeout",
        },
      });

      return journal;
    });
  }
}
