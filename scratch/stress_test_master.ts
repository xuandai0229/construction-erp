import { RevenueService } from "../services/revenue.service";
import { CostService } from "../services/cost.service";
import { OperationalService } from "../services/operational.service";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function runMasterStressTest() {
  console.log("🚀 STARTING PHASE 6: MASTER STRESS TEST...");
  const startTime = Date.now();

  try {
    const user = await prisma.user.findFirst() || await prisma.user.create({ data: { email: `stress-${Date.now()}@test.com`, role: UserRole.ADMIN } });
    const project = await prisma.project.create({ data: { name: `STRESS PROJECT ${Date.now()}`, ownerId: user.id } });
    const wbs = await prisma.wBSItem.create({ data: { name: "Root WBS", projectId: project.id } });

    // 1. DATA SEEDING
    console.log("Step 1: Seeding 200 cost records to measure throughput...");
    const seedStart = Date.now();
    for (let i = 0; i < 200; i++) {
      // @ts-ignore
      await CostService.create({
        projectId: project.id,
        wbsId: wbs.id,
        amount: 100,
        costType: "material",
        createdById: user.id
      });
    }
    const seedDuration = Date.now() - seedStart;
    console.log(`✅ Seeded 200 costs in ${seedDuration}ms`);

    // 2. CONCURRENCY TEST
    console.log("Step 2: Running 10 concurrent payments on one invoice...");
    const invoice = await prisma.invoice.create({
        data: {
            projectId: project.id,
            wbsId: wbs.id,
            amount: 5000,
            remainingAmount: 5000,
            status: "SENT",
            version: 1,
            invoiceNumber: `INV-STRESS-${Date.now()}`
        }
    });

    const paymentStart = Date.now();
    const paymentResults = await Promise.allSettled(
        Array.from({ length: 10 }).map((_, i) => 
            // @ts-ignore
            RevenueService.createPayment({
                invoiceId: invoice.id,
                amount: 100,
                userId: user.id,
                userRole: UserRole.ADMIN,
                requestId: `stress-req-${Date.now()}-${i}`
            })
        )
    );
    const paymentDuration = Date.now() - paymentStart;
    
    const successes = paymentResults.filter(r => r.status === "fulfilled").length;
    const failures = paymentResults.filter(r => r.status === "rejected").length;
    console.log(`✅ Concurrency Test: ${successes} Success, ${failures} Failures in ${paymentDuration}ms`);

    // 3. RECONCILIATION TEST
    console.log("Step 3: Running Ledger Reconciliation...");
    const recon = await OperationalService.reconcileLedger();
    console.log(`✅ Reconciliation Balanced: ${recon.isBalanced}`);

  } catch (err) {
    console.error("❌ STRESS TEST FAILED:", err);
  } finally {
    const totalTime = Date.now() - startTime;
    console.log(`\n🏁 MASTER STRESS TEST COMPLETE in ${totalTime}ms`);
    process.exit(0);
  }
}

runMasterStressTest().catch(console.error);
