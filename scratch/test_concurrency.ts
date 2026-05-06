import { RevenueService } from "@/services/revenue.service";
import { prisma } from "@/lib/prisma";

async function testConcurrency() {
  console.log("Starting Concurrency Test...");

  try {
    // 1. Setup a test project and invoice
    const project = await prisma.project.create({
      data: {
        name: "Concurrency Test Project",
        status: "ACTIVE",
      }
    });

    const wbs = await prisma.wBSItem.create({
      data: {
        projectId: project.id,
        name: "Test Work",
        budgetAmount: 1000,
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        projectId: project.id,
        wbsId: wbs.id,
        invoiceNumber: `INV-CONC-${Date.now()}`,
        amount: 1000,
        remainingAmount: 1000,
        status: "SENT",
      }
    });

    console.log(`Created Invoice ${invoice.id} with amount 1000`);

    // 2. Simulate 5 concurrent payments of 300 each
    const paymentAmount = 300;
    console.log("Sending 5 concurrent payments of 300 each...");
    
    const requests = Array(5).fill(null).map((_, i) => {
      return RevenueService.createPayment({
        invoiceId: invoice.id,
        amount: paymentAmount,
        date: new Date().toISOString(),
        description: `Concurrent Payment ${i+1}`,
        requestId: `req-${i+1}-${Date.now()}`
      }).catch(err => {
        return { error: err.message };
      });
    });

    const results = await Promise.all(requests);

    const successes = results.filter(r => r && !(r as any).error).length;
    const failures = results.filter(r => r && (r as any).error).length;

    console.log(`Results: ${successes} successes, ${failures} failures`);
    
    const finalInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    console.log(`Final Invoice Paid Amount: ${finalInvoice?.paidAmount}`);
    console.log(`Final Invoice Remaining Amount: ${finalInvoice?.remainingAmount}`);

    if (Number(finalInvoice?.paidAmount) > 1000) {
      console.error("❌ CRITICAL: Overpayment detected! Concurrency bug is present.");
    } else {
      console.log("✅ Concurrency check passed (or no overlap occurred - sometimes sequential execution happens).");
    }

  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    process.exit(0);
  }
}

testConcurrency().catch(console.error);
