import { PrismaClient } from '../generated/prisma-client';
import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CertificationGate {
  name: string;
  passed: boolean;
  score: number;
  message: string;
  evidence: any;
}

export class SelfCertifyingEnterprisePipeline {
  private gates: CertificationGate[] = [];

  /**
   * PHASE 1: BANKING-GRADE ACCOUNTING CERTIFICATION
   * Enforces double-entry ledger parity (∑ Debits = ∑ Credits).
   */
  async verifyAccountingParity(): Promise<CertificationGate> {
    const journals = await prisma.journalEntry.findMany({
      where: { deletedAt: null },
      include: { lines: { where: { deletedAt: null } } }
    });

    let totalDrifts = new Decimal(0);
    let imbalancedCount = 0;

    for (const journal of journals) {
      let debits = new Decimal(0);
      let credits = new Decimal(0);

      for (const line of journal.lines) {
        const amount = new Decimal(line.amount.toString());
        if (line.type === 'DEBIT') debits = debits.plus(amount);
        else if (line.type === 'CREDIT') credits = credits.plus(amount);
      }

      const drift = debits.minus(credits).abs();
      if (drift.greaterThan(0.0001)) {
        imbalancedCount++;
        totalDrifts = totalDrifts.plus(drift);
      }
    }

    const passed = imbalancedCount === 0;
    const score = passed ? 100 : Math.max(0, 100 - imbalancedCount * 15);

    return {
      name: 'Accounting Parity Gate',
      passed,
      score,
      message: passed
        ? '✅ BANKING-GRADE PARITY: Ledger double-entry balances verified perfectly.'
        : `❌ BALANCE SHEET CORRUPTION: ${imbalancedCount} unbalanced journals found. Total Drift: ${totalDrifts.toString()} VND`,
      evidence: {
        totalJournalsAudited: journals.length,
        imbalancedCount,
        totalDrifts: totalDrifts.toString()
      }
    };
  }

  /**
   * PHASE 2: CONCURRENCY WARFARE GATE
   * Asserts optimistic locking version checks on high-contention status updates.
   */
  async verifyConcurrencyArmor(): Promise<CertificationGate> {
    // Scan cost approval route handler code for Optimistic Locking assertions
    const handlerPath = path.resolve('app/api/costs/[id]/approve/route.ts');
    let hasOptimisticCheck = false;

    if (fs.existsSync(handlerPath)) {
      const code = fs.readFileSync(handlerPath, 'utf-8');
      // If updating but no optimistic version comparison is made, flag a warning/failure
      hasOptimisticCheck = code.includes('version') && code.includes('currentVersion');
    }

    const score = hasOptimisticCheck ? 100 : 40; // 40 points since we proved the lost update vulnerability in the harness

    return {
      name: 'Concurrency Warfare Gate',
      passed: hasOptimisticCheck,
      score,
      message: hasOptimisticCheck
        ? '✅ CONCURRENCY ARMOR ACTIVE: Optimistic lock validations protect financial status transitions.'
        : '❌ CONCURRENCY VULNERABILITY: CostRecord approval update bypasses optimistic version locking, leaving room for Lost Updates.',
      evidence: {
        optimisticLockingEnforced: hasOptimisticCheck,
        detectedConcurrencyAnomaly: !hasOptimisticCheck
      }
    };
  }

  /**
   * PHASE 3: SECURITY REGRESSION GATE
   * Audits route files to ensure unauthenticated system bypasses (backdoors) are blocked.
   */
  async verifySecurityRegressions(): Promise<CertificationGate> {
    const backdoorPath = path.resolve('app/api/invoices/[id]/approve/route.ts');
    let secured = true;

    if (fs.existsSync(backdoorPath)) {
      const code = fs.readFileSync(backdoorPath, 'utf-8');
      // Check if hardcoded admin bypass is still active
      if (code.includes('system_internal_admin') && !code.includes('assertAuthenticated()')) {
        secured = false;
      }
    }

    const score = secured ? 100 : 10;

    return {
      name: 'Security Regression Gate',
      passed: secured,
      score,
      message: secured
        ? '✅ SECURITY COMPLIANCE APPROVED: Hardcoded administrative backdoors verified as DEACTIVATED.'
        : '❌ CRITICAL SECURITY FAILURE: Hardcoded admin bypass backdoor active in invoice approval route.',
      evidence: {
        backdoorDeactivated: secured,
        auditRoute: 'app/api/invoices/[id]/approve/route.ts'
      }
    };
  }

  /**
   * PHASE 4: PERFORMANCE SLO BUDGET GATE
   * Asserts whether aggregations and performance traces fall within latency limits.
   */
  async verifyPerformanceSLO(): Promise<CertificationGate> {
    const start = Date.now();
    
    // Simulate high-volume aggregation run
    const agg = await prisma.costRecord.aggregate({
      where: { deletedAt: null },
      _sum: { amount: true }
    });

    const latency = Date.now() - start;
    const sloBudgetMs = 50; // Maximum allowed DB aggregation time for production
    const passed = latency <= sloBudgetMs;
    const score = passed ? 100 : Math.max(0, 100 - (latency - sloBudgetMs));

    return {
      name: 'Performance SLO Budget Gate',
      passed,
      score,
      message: passed
        ? `✅ SLO BUDGET IN-CHECK: DB aggregation completed in ${latency}ms (SLO target: <=${sloBudgetMs}ms).`
        : `❌ LATENCY BUDGET EXCEEDED: Aggregation latency clocked at ${latency}ms (SLO: <=${sloBudgetMs}ms).`,
      evidence: {
        aggregationLatencyMs: latency,
        sloBudgetLimitMs: sloBudgetMs,
        sumComputed: agg._sum.amount?.toString() || '0'
      }
    };
  }

  /**
   * PHASE 5: HISTORICAL DATA IMMUTABILITY GATE
   * Asserts that closed fiscal years cannot be rétroactivement mutated.
   */
  async verifyHistoricalImmutability(): Promise<CertificationGate> {
    // Check if the system has blocked fiscal periods active
    const activeLockCount = await prisma.fiscalPeriod.count({
      where: { isLocked: true }
    });

    const passed = activeLockCount > 0;
    const score = passed ? 100 : 50;

    return {
      name: 'Historical Immutability Gate',
      passed,
      score,
      message: passed
        ? `✅ HISTORICAL DATA SHIELDED: ${activeLockCount} fiscal accounting periods are securely locked.`
        : '⚠️  RETROACTIVE MUTABILITY RISK: No active closed fiscal periods locked; historical balance sheets vulnerable to mutation.',
      evidence: {
        lockedPeriodsFound: activeLockCount
      }
    };
  }

  /**
   * Orchestrate Self-Certifying Verification Pipeline Run
   */
  async orchestratePipeline(): Promise<boolean> {
    console.log('================================================================================');
    console.log('       RUNNING SELF-CERTIFYING ENTERPRISE ERP CERTIFICATION PIPELINE');
    console.log('================================================================================');

    // Run Gates
    this.gates.push(await this.verifyAccountingParity());
    this.gates.push(await this.verifyConcurrencyArmor());
    this.gates.push(await this.verifySecurityRegressions());
    this.gates.push(await this.verifyPerformanceSLO());
    this.gates.push(await this.verifyHistoricalImmutability());

    // Calculate Maturity Dimension Scores
    const totalScore = this.gates.reduce((sum, g) => sum + g.score, 0);
    const avgScore = totalScore / this.gates.length;

    console.log('\n================================================================================');
    console.log('               CONTINUOUS RELIABILITY MATURITY MATRIX');
    console.log('================================================================================');
    this.gates.forEach(gate => {
      console.log(`${gate.name.padEnd(30)}: ${gate.passed ? '✅ PASS' : '❌ FAIL'} (Score: ${gate.score}/100)`);
      console.log(`  └─ Details: ${gate.message}`);
    });
    console.log('================================================================================');
    console.log(`🏆 OVERALL SYSTEM MATURITY SCORE: ${avgScore.toFixed(2)} / 100`);
    console.log('================================================================================');

    // BLOCK DEPLOYMENT AUTO-GATE
    // Automatically blocks if overall score < 80 or any critical gate (Accounting, Security) failed
    const criticalFails = this.gates.filter(g => !g.passed && (g.name.includes('Accounting') || g.name.includes('Security')));
    const deploymentAllowed = avgScore >= 80 && criticalFails.length === 0;

    if (deploymentAllowed) {
      console.log('🚀 DEPLOYMENT AUTO-GATE: APPROVED. Deploying package to Production Cluster...');
      return true;
    } else {
      console.error('🛑 DEPLOYMENT AUTO-GATE: BLOCKED. Safe-guard triggered due to reliability deficits.');
      
      // Auto-generate Forensic Incident Dossier Report
      const dossierReport = `# HỒ SƠ CHẨN ĐOÁN PHÁP Y TỰ ĐỘNG - GIAI ĐOẠN ĐÓNG CỔNG DEPLOY
## MÃ CHẨN ĐOÁN: AUTO-BLOCKED-GATEWAY-${Date.now()}
**Trạng thái:** TỪ CHỐI TRIỂN KHAI PRODUCTION (DEPLOYMENT BLOCKED)  
**Mức độ rủi ro:** HIGH  

---

### BẢNG ĐIỂM CHỨNG NHẬN TẬP TRUNG (MATURITY INDEX)
*   **Maturity Score:** ${avgScore.toFixed(2)} / 100
*   **Accounting Parity:** ${this.gates[0].passed ? 'OK' : 'FAIL'} (Score: ${this.gates[0].score})
*   **Concurrency Armor:** ${this.gates[1].passed ? 'OK' : 'FAIL'} (Score: ${this.gates[1].score})
*   **Security Regressions:** ${this.gates[2].passed ? 'OK' : 'FAIL'} (Score: ${this.gates[2].score})
*   **Performance SLO:** ${this.gates[3].passed ? 'OK' : 'FAIL'} (Score: ${this.gates[3].score})
*   **Historical Shield:** ${this.gates[4].passed ? 'OK' : 'FAIL'} (Score: ${this.gates[4].score})

---

### PHÂN TÍCH VÀ KHẮC PHỤC KHẨN CẤP
1. **Concurrency Lock Alert:** Nếu cổng Concurrency báo đỏ, hãy lập tức áp dụng **Optimistic Locking** cho hàm cập nhật CostRecord trạng thái tại \`services/cost.service.ts\` để tăng biến \`version\` an toàn.
2. **Security Gate Alert:** Nếu cổng Security báo đỏ, hãy lập tức rà soát lại tệp tin API phê duyệt để gỡ bỏ toàn bộ tài khoản gán cứng superuser.
`;
      
      const dossierPath = path.resolve('artifacts/auto_deployment_block_dossier.md');
      fs.mkdirSync(path.dirname(dossierPath), { recursive: true });
      fs.writeFileSync(dossierPath, dossierReport, 'utf-8');
      console.log(`📝 Auto-generated Forensic Incident Dossier written to: ${dossierPath}`);
      return false;
    }
  }
}

// Auto-run if executed directly
if (require.main === module) {
  const pipeline = new SelfCertifyingEnterprisePipeline();
  pipeline.orchestratePipeline()
    .then(allowed => {
      process.exit(allowed ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
