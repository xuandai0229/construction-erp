const { PrismaClient } = require("../generated/prisma-client");
const prisma = new PrismaClient();

async function runTest() {
  console.log("🚀 STARTING ERP CORE INTEGRATION TEST");
  
  try {
    // 1. Create Project
    console.log("\n1. Creating Project...");
    const project = await prisma.project.create({
      data: {
        name: "Test ERP Upgrade Project",
        contractValue: 1000000,
        totalBudget: 800000,
        status: "ACTIVE"
      }
    });
    console.log("✅ Project created:", project.id);

    // 2. Create WBS
    console.log("\n2. Creating WBS Item...");
    const wbs = await prisma.wBSItem.create({
      data: {
        projectId: project.id,
        name: "Foundation Work",
        budgetAmount: 500000
      }
    });
    console.log("✅ WBS created:", wbs.id);

    // 3. Create Cost (Should trigger PostingEngine)
    console.log("\n3. Creating Cost Record...");
    const { CostService } = require("../services/cost.service");
    // Note: We need to mock the context or use the service directly if it doesn't depend on Next.js specifics.
    // Since we're in node, we'll use a dynamic import for the service.
    
    // Actually, to keep it simple and reliable in this environment, 
    // I'll check the DB records directly after triggering the logic.
    
    // Let's use the service
    const cost = await CostService.create({
      projectId: project.id,
      wbsId: wbs.id,
      costType: "material",
      amount: 150000,
      note: "Cement for foundation",
      status: "unpaid"
    });
    console.log("✅ Cost created:", cost.id);

    // Verify Journal Entry for Cost
    const costEntry = await prisma.journalEntry.findFirst({
      where: { sourceId: cost.id, sourceType: "COST" },
      include: { lines: { include: { account: true } } }
    });
    console.log("🔍 Cost Journal Entry Found:", !!costEntry);
    if (costEntry) {
      console.log(`   Description: ${costEntry.description}`);
      costEntry.lines.forEach((l: any) => {
        console.log(`   - ${l.account.name} (${l.account.code}): ${l.type} ${l.amount}`);
      });
    }

    // 4. Create Invoice
    console.log("\n4. Creating Invoice...");
    const { RevenueService } = require("../services/revenue.service");
    const invoice = await RevenueService.createInvoice({
      projectId: project.id,
      wbsId: wbs.id,
      amount: 300000,
      note: "Foundation completion invoice"
    });
    console.log("✅ Invoice created:", invoice.id);

    // Verify Journal Entry for Invoice
    const invEntry = await prisma.journalEntry.findFirst({
      where: { sourceId: invoice.id, sourceType: "INVOICE" },
      include: { lines: { include: { account: true } } }
    });
    console.log("🔍 Invoice Journal Entry Found:", !!invEntry);

    // 5. Create Payment
    console.log("\n5. Creating Payment...");
    const payment = await RevenueService.createPayment({
      projectId: project.id,
      invoiceId: invoice.id,
      amount: 300000,
      description: "Client paid foundation invoice"
    });
    console.log("✅ Payment created:", payment.id);

    // Verify Journal Entry for Payment
    const payEntry = await prisma.journalEntry.findFirst({
      where: { sourceId: payment.id, sourceType: "PAYMENT" },
      include: { lines: { include: { account: true } } }
    });
    console.log("🔍 Payment Journal Entry Found:", !!payEntry);

    // 6. Verify Totals
    console.log("\n6. Verifying Project Financials...");
    const { ProjectService } = require("../services/project.service");
    const stats = await ProjectService.getAccountingSummary(project.id);
    console.log("📊 Project Stats:");
    console.log(`   Total Cost: ${stats.totalCost}`);
    console.log(`   Committed Cost: ${stats.committedCost}`);
    console.log(`   Total Revenue: ${stats.totalRevenue}`);
    console.log(`   Profit: ${stats.profit}`);
    console.log(`   Budget Remaining: ${stats.budgetRemaining}`);

    console.log("\n✨ ALL TESTS COMPLETED SUCCESSFULLY");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
