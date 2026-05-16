const { PrismaClient } = require('../generated/prisma-client');
const Decimal = require('decimal.js');

const prisma = new PrismaClient();

async function auditRounding() {
  console.log("--- STARTING FINANCIAL ROUNDING DRIFT AUDIT ---");
  
  const projects = await prisma.project.findMany({ select: { id: true, name: true, totalBudget: true } });

  for (const project of projects) {
    console.log(`\nAuditing Project: ${project.name} (${project.id})`);
    
    // 1. Raw DB Sum vs Project Total
    const budgets = await prisma.budgetRecord.findMany({ where: { projectId: project.id, deletedAt: null } });
    const sumRaw = budgets.reduce((acc, b) => acc.add(new Decimal(b.estimatedAmount.toString())), new Decimal(0));
    const projectTotal = new Decimal(project.totalBudget.toString());
    
    console.log(`- Budget Integrity: DB Sum: ${sumRaw.toString()} | Project Field: ${projectTotal.toString()}`);
    if (!sumRaw.equals(projectTotal)) {
      console.warn(`  ⚠️ MISMATCH DETECTED: Diff = ${sumRaw.minus(projectTotal).toString()}`);
    }

    // 2. Cost Aggregation Drift
    const costs = await prisma.costRecord.findMany({ where: { projectId: project.id, deletedAt: null, approvalStatus: "APPROVED" } });
    const sumCosts = costs.reduce((acc, c) => acc.add(new Decimal(c.amount.toString())), new Decimal(0));
    
    // Simulate iterative rounding (Floating point drift test)
    let floatSum = 0;
    costs.forEach(c => floatSum += Number(c.amount));
    const floatDiff = sumCosts.minus(new Decimal(floatSum.toFixed(2))).abs();
    
    console.log(`- Cost Precision: Decimal Sum: ${sumCosts.toString()} | Float Sum: ${floatSum.toFixed(2)}`);
    if (floatDiff.gt(0)) {
       console.warn(`  ⚠️ PRECISION DRIFT (Float vs Decimal): ${floatDiff.toString()}`);
    }

    // 3. Tax Rounding Consistency
    // netAmount + vatAmount should == amount
    const taxDrift = costs.filter(c => {
      const net = new Decimal(c.netAmount.toString());
      const vat = new Decimal(c.vatAmount.toString());
      const total = new Decimal(c.amount.toString());
      return !net.add(vat).equals(total);
    });

    console.log(`- Tax Integrity: ${taxDrift.length} records with mismatching Net+VAT totals.`);
    if (taxDrift.length > 0) {
      console.warn(`  ⚠️ CRITICAL: Tax components do not reconcile for ${taxDrift.length} records!`);
    }
  }

  console.log("\n--- AUDIT COMPLETE ---");
}

auditRounding().catch(console.error).finally(() => prisma.$disconnect());
