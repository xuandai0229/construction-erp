
import { FinancialAggregationService } from "./services/financial-aggregation.service";
import { ProjectService } from "./services/project.service";
import { prisma } from "./lib/prisma";

async function runAudit() {
  console.log("=== FINANCIAL AGGREGATION AUDIT REPORT ===");
  const projects = await prisma.project.findMany({ where: { deletedAt: null }, take: 5 });

  for (const p of projects) {
    console.log(`\nProject: ${p.name} (${p.id.slice(0, 8)})`);
    
    // Old Method
    const oldSummary = await ProjectService.getAccountingSummary(p.id);
    
    // New Method (SSoT)
    const newSnapshot = await FinancialAggregationService.getProjectSnapshot(p.id);

    console.log("  KPI: Actual Cost");
    console.log(`    Old: ${oldSummary.totalCost}`);
    console.log(`    New: ${newSnapshot.reality.actualCost}`);
    const costMismatch = Math.abs(oldSummary.totalCost - newSnapshot.reality.actualCost) > 1;
    console.log(`    Status: ${costMismatch ? "❌ MISMATCH" : "✅ MATCH"}`);

    console.log("  KPI: Revenue");
    console.log(`    Old: ${oldSummary.totalRevenue}`);
    console.log(`    New: ${newSnapshot.reality.totalRevenue}`);
    const revMismatch = Math.abs(oldSummary.totalRevenue - newSnapshot.reality.totalRevenue) > 1;
    console.log(`    Status: ${revMismatch ? "❌ MISMATCH" : "✅ MATCH"}`);

    console.log("  New Management Metrics (Previously unavailable/inaccurate):");
    console.log(`    Cost Exposure: ${newSnapshot.exposure.totalCostExposure}`);
    console.log(`    Pending Costs: ${newSnapshot.exposure.pendingCost}`);
    console.log(`    Orphan Cost Leakage: ${newSnapshot.integrity.unallocatedAmount}`);
    console.log(`    Allocation Health: ${newSnapshot.integrity.allocationHealth}%`);
  }
}

runAudit().catch(console.error);
