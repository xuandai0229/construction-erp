import { prisma } from "@/lib/prisma";
import { RevenueService } from "@/services/revenue.service";
import { CostType } from "@prisma/client";

async function main() {
  console.log("Setting up data for concurrency test...");
  
  // 1. Create User
  const user = await prisma.user.create({
    data: { name: "Test User", email: "test-" + Date.now() + "@test.com" }
  });

  // 2. Create Project
  const project = await prisma.project.create({
    data: {
      name: "Concurrency Test Project",
      ownerId: user.id
    }
  });

  // 3. Create WBS
  const wbs = await prisma.wBSItem.create({
    data: {
      projectId: project.id,
      name: "Phase 1",
      sortOrder: 1
    }
  });

  // 4. Create Invoice using the service
  const invoice = await RevenueService.createInvoice({
    projectId: project.id,
    wbsId: wbs.id,
    amount: 1000,
    createdById: user.id,
    invoiceNumber: "INV-" + Date.now()
  });

  console.log(`Created Invoice ${invoice.id} with amount 1000`);

  // 5. Fire 5 concurrent payment requests of 1000 each!
  console.log("Firing 5 concurrent payments of 1000...");
  
  const paymentPromises = Array.from({ length: 5 }).map(async (_, i) => {
    try {
      await RevenueService.createPayment({
        invoiceId: invoice.id,
        amount: 1000,
        date: new Date(),
        description: "Concurrent Payment " + i
      });
      return "SUCCESS";
    } catch (e: any) {
      return "FAILED: " + e.message;
    }
  });

  const results = await Promise.all(paymentPromises);
  console.log("Payment Results:");
  console.table(results);

  // 6. Verify Invoice state
  const finalInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id }});
  console.log("Final Invoice State:");
  console.log({
    amount: finalInvoice?.amount,
    paidAmount: finalInvoice?.paidAmount,
    remainingAmount: finalInvoice?.remainingAmount,
    status: finalInvoice?.status
  });

  // Cleanup
  await prisma.payment.deleteMany({ where: { invoiceId: invoice.id } });
  await prisma.revenue.deleteMany({ where: { invoiceId: invoice.id } });
  await prisma.journalEntry.deleteMany({ where: { description: { contains: invoice.id } } });
  await prisma.invoice.deleteMany({ where: { id: invoice.id } });
  await prisma.wBSItem.deleteMany({ where: { id: wbs.id } });
  await prisma.project.deleteMany({ where: { id: project.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
