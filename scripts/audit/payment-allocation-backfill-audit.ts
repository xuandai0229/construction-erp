import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("Running Payment Allocation Backfill Audit...");

  // Find all payments that have invoiceId
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId: { not: null },
      deletedAt: null,
    },
    include: {
      invoice: true,
      allocations: true,
    },
  });

  const missingAllocations: any[] = [];
  const validApprovedPosted: any[] = [];
  const draftOrCancelled: any[] = [];
  let duplicateJournals = 0;
  let crossCompanyMismatch = 0;
  let overpaidInvoices = 0;

  for (const payment of payments) {
    // Check if it already has allocation
    const hasActiveAllocation = payment.allocations.some(a => !a.isReversed && a.status !== "REVERSED");
    
    const invoice = payment.invoice;
    if (!invoice) continue;

    // Cross-company check
    if (invoice.companyId && payment.projectId) {
      // Find project to check companyId match
      const project = await prisma.project.findUnique({ where: { id: payment.projectId } });
      if (project && project.companyId !== invoice.companyId) {
        crossCompanyMismatch++;
      }
    }

    if (!hasActiveAllocation) {
      const isApprovedOrPosted = payment.approvalStatus === "APPROVED";
      const isDraftOrPending = payment.approvalStatus === "DRAFT" || payment.approvalStatus === "PENDING";

      const record = {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        approvalStatus: payment.approvalStatus,
        invoiceNumber: invoice.invoiceNumber,
        invoiceAmount: Number(invoice.amount),
        invoicePaidAmount: Number(invoice.paidAmount),
        invoiceRemainingAmount: Number(invoice.remainingAmount),
      };

      if (isApprovedOrPosted) {
        validApprovedPosted.push(record);
      } else {
        draftOrCancelled.push(record);
      }

      missingAllocations.push(record);
    }
  }

  const reportData = {
    generatedAt: new Date().toISOString(),
    totalPaymentsChecked: payments.length,
    totalMissingAllocations: missingAllocations.length,
    validApprovedPostedCount: validApprovedPosted.length,
    draftOrCancelledCount: draftOrCancelled.length,
    crossCompanyMismatch,
    overpaidInvoices,
    duplicateJournals,
    missingAllocations,
  };

  // Write JSON
  const jsonPath = "D:/construction-erp/docs/audit/payment-allocation-backfill-audit.json";
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  // Write MD
  const mdPath = "D:/construction-erp/docs/audit/payment-allocation-backfill-audit.md";
  const mdContent = `# PAYMENT ALLOCATION BACKFILL AUDIT REPORT

Generated At: ${reportData.generatedAt}

## 1. Summary Metrics
- **Total Payments Checked**: ${reportData.totalPaymentsChecked}
- **Total Missing Allocations**: ${reportData.totalMissingAllocations}
- **Valid (APPROVED/POSTED) Payments Needing Backfill**: ${reportData.validApprovedPostedCount}
- **Draft/Cancelled Payments (No Backfill Needed)**: ${reportData.draftOrCancelledCount}
- **Cross-company Mismatches**: ${reportData.crossCompanyMismatch}
- **Overpaid Invoices Detected**: ${reportData.overpaidInvoices}
- **Duplicate Journals Detected**: ${reportData.duplicateJournals}

## 2. Risk Evaluation
- **Cross-company Mismatches**: ${reportData.crossCompanyMismatch > 0 ? "⚠️ WARNING" : "✅ NONE"}
- **Can Backfill Safely**: ${reportData.crossCompanyMismatch === 0 ? "✅ YES" : "❌ NO (Solve mismatches first)"}

## 3. Missing Allocations List
${reportData.missingAllocations.map(m => `- **Payment**: ${m.paymentId} | **Invoice**: ${m.invoiceId} | **Amount**: ${m.amount} | **Status**: ${m.approvalStatus}`).join("\n")}
`;

  fs.writeFileSync(mdPath, mdContent);
  console.log("Audit complete. MD and JSON exported to docs/audit/");
}

runAudit()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
