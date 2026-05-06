import { prisma } from "../lib/prisma";
import { OperationalService } from "../services/operational.service";
import { Logger } from "../lib/observability/logger";

async function runGoLiveAudit() {
  console.log("🛡️ STARTING GO-LIVE READINESS AUDIT...");
  const stats = {
    checks: 0,
    failures: 0,
    risks: [] as string[]
  };

  try {
    // 1. Check Accounting Integrity
    console.log("Check 1: Ledger Reconciliation...");
    const recon = await OperationalService.reconcileLedger();
    if (!recon.isBalanced) {
      stats.failures++;
      stats.risks.push("Ledger is imbalanced! Critical stop.");
    }
    stats.checks++;

    // 2. Check Fiscal Period Status
    console.log("Check 2: Fiscal Period Configuration...");
    const periods = await prisma.fiscalPeriod.count();
    if (periods === 0) {
      stats.risks.push("No fiscal periods defined. Risk of back-dated mutations.");
    }
    stats.checks++;

    // 3. Check Audit Trail Coverage
    console.log("Check 3: Audit Trail Integrity...");
    const totalTransactions = await prisma.journalEntry.count();
    const totalAuditLogs = await prisma.auditLog.count();
    if (totalAuditLogs < totalTransactions) {
        stats.risks.push(`Audit log coverage gap detected (${totalAuditLogs} logs vs ${totalTransactions} transactions).`);
    }
    stats.checks++;

    // 4. Security Configuration Check (Simulated)
    console.log("Check 4: Security Policies...");
    // Check for missing RBAC roles or orphaned users
    const orphanedUsers = await prisma.user.count({ where: { role: undefined } });
    if (orphanedUsers > 0) {
      stats.failures++;
      stats.risks.push(`${orphanedUsers} users have no role assigned.`);
    }
    stats.checks++;

    // Final Report
    console.log("\n--- GO-LIVE READINESS REPORT ---");
    console.log(`- Total Checks: ${stats.checks}`);
    console.log(`- Critical Failures: ${stats.failures}`);
    console.log(`- Status: ${stats.failures === 0 ? "READY FOR GO-LIVE ✅" : "NOT READY ❌"}`);
    
    if (stats.risks.length > 0) {
      console.log("\n⚠️ RISKS IDENTIFIED:");
      stats.risks.forEach(r => console.log(`  - ${r}`));
    }

  } catch (err) {
    Logger.error("Audit script failed", err);
  } finally {
    process.exit(0);
  }
}

runGoLiveAudit();
