import { prisma } from '@/lib/prisma';
import { ProjectService } from '@/services/project.service';
import { RevenueService } from '@/services/revenue.service';

async function runDiagnostics() {
  console.log("=== ENTERPRISE ERP SYSTEM DIAGNOSTIC ===");

  // 1. Tenant Integrity Audit
  console.log("\n[DIAGNOSTIC 1] TENANT INTEGRITY CHECK");
  const projects = await prisma.project.findMany({ select: { id: true, companyId: true } });
  
  for (const project of projects) {
    // Check WBSItems
    const orphanWBS = await prisma.wBSItem.findMany({
      where: { 
        projectId: project.id,
        project: { NOT: { companyId: project.companyId } } 
      }
    });
    if (orphanWBS.length > 0) {
      console.error(`!!! TENANT DRIFT DETECTED: Project ${project.id} (Company ${project.companyId}) has WBSItems belonging to another company!`);
    }

    // Check CostRecords
    const orphanCosts = await prisma.costRecord.findMany({
      where: { 
        projectId: project.id,
        companyId: { not: project.companyId || "" }
      }
    });
    if (orphanCosts.length > 0) {
      console.error(`!!! TENANT DRIFT DETECTED: Project ${project.id} has Costs with mismatched companyId!`);
    }
  }

  // 2. Accounting Immutability Test
  console.log("\n[DIAGNOSTIC 2] ACCOUNTING IMMUTABILITY CHECK");
  const sampleJE = await prisma.journalEntry.findFirst();
  if (sampleJE) {
    try {
      await (prisma as any).journalEntry.delete({ where: { id: sampleJE.id } });
      console.error("!!! CRITICAL VULNERABILITY: JournalEntry DELETION BYPASSED SECURITY GATEKEEPER!");
    } catch (e) {
      console.log("✅ JournalEntry deletion blocked as expected.");
    }
  }

  // 3. Aggregate Consistency Check
  console.log("\n[DIAGNOSTIC 3] AGGREGATE CONSISTENCY CHECK");
  if (projects[0]) {
    const summary = await ProjectService.getAccountingSummary(projects[0].id);
    const rawCosts = await prisma.costRecord.aggregate({
      where: { projectId: projects[0].id, deletedAt: null },
      _sum: { amount: true }
    });
    const diff = Math.abs(summary.totalCost - Number(rawCosts._sum.amount || 0));
    if (diff > 0.01) {
      console.error(`!!! DATA DIVERGENCE: Project summary total cost (${summary.totalCost}) != Raw aggregate (${rawCosts._sum.amount})`);
    } else {
      console.log("✅ Project summary consistency verified.");
    }
  }

  // 4. Soft Delete Cascade Audit
  console.log("\n[DIAGNOSTIC 4] SOFT-DELETE CASCADE AUDIT");
  const deletedProjects = await prisma.project.findMany({ where: { NOT: { deletedAt: null } } });
  for (const dp of deletedProjects) {
    const activeChildren = await prisma.wBSItem.count({ where: { projectId: dp.id, deletedAt: null } });
    if (activeChildren > 0) {
      console.error(`!!! ORPHAN DETECTED: Deleted Project ${dp.id} still has ${activeChildren} active WBSItems!`);
    }
  }

  console.log("\n=== DIAGNOSTIC COMPLETED ===");
}

runDiagnostics().catch(console.error).finally(() => prisma.$disconnect());
