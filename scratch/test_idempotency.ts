import { RevenueService } from "@/services/revenue.service";
import { prisma } from "@/lib/prisma";

async function testIdempotency() {
  console.log("Starting Idempotency Test...");

  try {
    const invoice = await prisma.invoice.create({
      data: {
        projectId: (await prisma.project.findFirst())?.id || "",
        wbsId: (await prisma.wBSItem.findFirst())?.id || "",
        invoiceNumber: `INV-IDEM-${Date.now()}`,
        amount: 1000,
        remainingAmount: 1000,
        status: "SENT",
      }
    });

    const requestId = `unique-req-${Date.now()}`;

    console.log("Sending first payment request...");
    const p1 = await RevenueService.createPayment({
      invoiceId: invoice.id,
      amount: 100,
      requestId: requestId,
    });

    console.log(`Payment 1 created: ${p1.id}`);

    console.log("Sending second payment request with SAME requestId...");
    const p2 = await RevenueService.createPayment({
      invoiceId: invoice.id,
      amount: 100,
      requestId: requestId,
    });

    console.log(`Payment 2 result: ${p2.id}`);

    if (p1.id === p2.id) {
      console.log("✅ Idempotency check passed: Same payment ID returned.");
    } else {
      console.error("❌ CRITICAL: Idempotency failed! Duplicate payment created.");
    }

    const paymentCount = await prisma.payment.count({ where: { requestId: requestId } });
    console.log(`Payments in DB with this requestId: ${paymentCount}`);

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

testIdempotency().catch(console.error);
