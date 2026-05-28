import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runReconciliation() {
  console.log("Running Payment Allocation Reconciliation...");

  // Find all active payments and invoices
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null },
    include: { allocations: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: { allocations: true }
  });

  let driftCount = 0;
  let totalPaymentsMatched = 0;
  const discrepancies: any[] = [];

  for (const inv of invoices) {
    const activeAllocations = inv.allocations.filter(a => a.status === "ACTIVE" && !a.isReversed);
    const sumAllocated = activeAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
    
    const paidAmount = Number(inv.paidAmount);
    const remainingAmount = Number(inv.remainingAmount);
    const expectedRemaining = Math.max(0, Number(inv.amount) - sumAllocated);

    const isMatch = Math.abs(sumAllocated - paidAmount) <= 0.01 && Math.abs(expectedRemaining - remainingAmount) <= 0.01;

    if (!isMatch) {
      driftCount++;
      discrepancies.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        storedPaid: paidAmount,
        allocatedPaid: sumAllocated,
        storedRemaining: remainingAmount,
        expectedRemaining: expectedRemaining,
      });
    } else {
      totalPaymentsMatched++;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalInvoicesChecked: invoices.length,
    totalPaymentsMatched,
    driftCount,
    discrepancies,
  };

  const dir = "D:/construction-erp/docs/audit";
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, "payment-allocation-reconciliation.json"),
    JSON.stringify(report, null, 2)
  );

  const mdContent = `# PAYMENT ALLOCATION RECONCILIATION REPORT

Generated At: ${report.generatedAt}

## Summary Metrics
- **Total Invoices Checked**: ${report.totalInvoicesChecked}
- **Successfully Reconciled Invoices**: ${report.totalPaymentsMatched}
- **Drifts / Discrepancies Detected**: ${report.driftCount}

## Status
${report.driftCount === 0 ? "✅ ALL MATCHED: No ledger drifts or invoice balance mismatches detected." : "⚠️ DRIFT DETECTED: Some invoice balances do not align with active allocations."}

## Discrepancies List
${report.discrepancies.length === 0 ? "*None*" : report.discrepancies.map(d => `- **Invoice**: ${d.invoiceNumber || d.invoiceId} | Stored Paid: ${d.storedPaid} | Allocated Paid: ${d.allocatedPaid}`).join("\n")}
`;

  fs.writeFileSync(path.join(dir, "payment-allocation-reconciliation.md"), mdContent);
  console.log("Reconciliation audit complete.");
}

runReconciliation()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
