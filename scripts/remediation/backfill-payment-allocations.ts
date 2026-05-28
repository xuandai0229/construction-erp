import { PrismaClient } from "@prisma/client";
import { AuditService } from "../../services/audit.service";

const prisma = new PrismaClient();

async function runRemediation() {
  const isApply = process.env.ALLOW_ACCOUNTING_REMEDIATION === "true" && 
                  process.env.REMEDIATION_CONFIRMATION === "BACKFILL_PAYMENT_ALLOCATIONS";

  console.log(`Starting Payment Allocation Backfill... [Mode: ${isApply ? "REAL APPLY" : "DRY RUN"}]`);

  // Find a default company ID in case invoice.companyId is null
  const defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) {
    throw new Error("No company found in database to use as fallback.");
  }
  const fallbackCompanyId = defaultCompany.id;
  console.log(`Using fallback companyId: ${fallbackCompanyId}`);

  // Find all approved payments that have invoiceId
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId: { not: null },
      deletedAt: null,
      approvalStatus: "APPROVED",
    },
    include: {
      invoice: true,
      allocations: true,
    },
  });

  console.log(`Found ${payments.length} APPROVED payments with invoiceId.`);

  let createdCount = 0;

  for (const payment of payments) {
    const hasActiveAllocation = payment.allocations.some(a => !a.isReversed && a.status !== "REVERSED");
    
    if (hasActiveAllocation) {
      console.log(`Payment ${payment.id} already has allocation. Skipping.`);
      continue;
    }

    const invoice = payment.invoice;
    if (!invoice) continue;

    const companyId = invoice.companyId || fallbackCompanyId;

    console.log(`Backfilling allocation for Payment ${payment.id} (Amount: ${payment.amount}) to Invoice ${invoice.id} (Number: ${invoice.invoiceNumber}) with companyId: ${companyId}`);

    if (isApply) {
      await prisma.$transaction(async (tx) => {
        // Create the allocation
        const allocation = await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            amount: payment.amount,
            companyId: companyId,
            contractId: invoice.contractId,
            status: "ACTIVE",
            createdBy: "SYSTEM_BACKFILL",
          },
        });

        // Sum up active allocations for this invoice to update its paid/remaining amounts
        const allInvoiceAllocations = await tx.paymentAllocation.findMany({
          where: { invoiceId: invoice.id, status: "ACTIVE", isReversed: false },
        });

        const newPaidAmount = allInvoiceAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
        const newRemainingAmount = Math.max(0, Number(invoice.amount) - newPaidAmount);

        let newStatus = "PARTIAL";
        if (newRemainingAmount <= 0.01) newStatus = "PAID";

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus as any,
          },
        });

        // Log audit
        await AuditService.log({
          userId: "SYSTEM_BACKFILL",
          action: "CREATE",
          entity: "PaymentAllocation",
          entityId: allocation.id,
          newData: allocation,
          reason: "System backfill of missing payment allocation.",
        });
      });
      createdCount++;
    } else {
      createdCount++;
    }
  }

  console.log(`\n=== Backfill Summary ===`);
  console.log(`Total processed payments: ${payments.length}`);
  console.log(`Allocations to create: ${createdCount}`);
  console.log(`Status: ${isApply ? "Successfully Applied" : "Dry-run only, no database changes made."}`);
}

runRemediation()
  .catch(e => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
