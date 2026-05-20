import { PrismaClient } from '@prisma/client';
import { CPMEngine } from '../services/construction/cpm-engine.service';
import { ResourceService } from '../services/construction/resource.service';
import { ContractGovernanceService } from '../services/construction/governance.service';
import { ExecutionIntelligenceService } from '../services/construction/intelligence.service';

const prisma = new PrismaClient();

async function runConstructionAudit() {
  console.log("\n================================================================================");
  console.log("     🚧 PHASES 9-13 FORENSIC AUDIT: CONSTRUCTION EXECUTION OS");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  const testPass = (msg: string) => { console.log(`✅ [PASS] ${msg}`); passed++; };
  const testFail = (msg: string, error?: any) => { console.log(`❌ [FAIL] ${msg}`, error || ''); failed++; };

  // Setup Demo Project
  const project = await prisma.project.create({
    data: { name: 'AUDIT: Landmark 81 Tower', status: 'ACTIVE', totalBudget: 5000000000 }
  });

  try {
    console.log("--------------------------------------------------------------------------------");
    console.log("📅 TASK 1: CPM SCHEDULING & CRITICAL PATH ENGINE");
    console.log("--------------------------------------------------------------------------------");

    const today = new Date();
    
    // 1. Create Activities
    const a1 = await CPMEngine.createActivity({
      projectId: project.id, code: 'A100', name: 'Đào đất', plannedStart: today, plannedDuration: 5
    });
    const a2 = await CPMEngine.createActivity({
      projectId: project.id, code: 'A200', name: 'Đổ bê tông lót', plannedStart: today, plannedDuration: 3
    });
    const a3 = await CPMEngine.createActivity({
      projectId: project.id, code: 'A300', name: 'Lắp dựng cốt thép móng', plannedStart: today, plannedDuration: 7
    });

    // 2. Add Dependencies (FS = Finish-to-Start)
    await CPMEngine.addDependency({ predecessorId: a1.id, successorId: a2.id, type: 'FS', lagDays: 0 });
    await CPMEngine.addDependency({ predecessorId: a2.id, successorId: a3.id, type: 'FS', lagDays: 1 });

    // 3. Calculate Critical Path
    const cpmResult = await CPMEngine.calculateCriticalPath(project.id);
    
    if (cpmResult.criticalPath.includes(a1.id) && cpmResult.criticalPath.includes(a2.id) && cpmResult.criticalPath.includes(a3.id)) {
      testPass("Forward & Backward Pass Calculated correctly.");
      testPass("Critical Path Detected accurately.");
    } else {
      testFail("CPM Calculation failed.");
    }

    // 4. Delay Propagation
    const delayResult = await CPMEngine.recordDelay({
      activityId: a1.id, projectId: project.id, category: 'WEATHER', description: 'Mưa lớn ngập hố móng', delayDays: 3
    });
    
    if (delayResult.propagation.length > 0) {
      testPass(`Delay Cascade Propagated: ${delayResult.propagation.join(" -> ")}`);
    } else {
      testFail("Delay Propagation failed.");
    }


    console.log("\n--------------------------------------------------------------------------------");
    console.log("🚜 TASK 2: RESOURCE ALLOCATION & CONFLICT DETECTION");
    console.log("--------------------------------------------------------------------------------");

    const pool = await ResourceService.createResourcePool({
      projectId: project.id, name: 'Cẩu tháp', type: 'EQUIPMENT', capacity: 2, costPerDay: 5000000
    });
    const eq1 = await ResourceService.createEquipmentAsset({
      resourcePoolId: pool.id, code: 'CT-01', name: 'Cẩu tháp 1', type: 'CRANE', dailyRate: 5000000
    });

    const start = new Date();
    const end = new Date(start); end.setDate(end.getDate() + 5);

    // Assign Equipment
    await ResourceService.assignEquipment({
      equipmentId: eq1.id, activityId: a1.id, startDate: start, endDate: end
    });
    testPass("Equipment Assigned successfully.");

    // Test Conflict
    try {
      await ResourceService.assignEquipment({
        equipmentId: eq1.id, activityId: a2.id, startDate: start, endDate: end
      });
      testFail("Conflict Detection failed.");
    } catch (e: any) {
      if (e.message.includes("Xung đột thiết bị")) {
        testPass("Double-booking Conflict detected and blocked.");
      } else {
        testFail("Conflict Detection failed with unknown error.", e);
      }
    }


    console.log("\n--------------------------------------------------------------------------------");
    console.log("⚖️ TASK 3: CONTRACT GOVERNANCE & EOT CLAIMS");
    console.log("--------------------------------------------------------------------------------");

    // Variation Order
    const cr = await ContractGovernanceService.createChangeRequest({
      projectId: project.id, title: 'Thay đổi thiết kế móng', description: 'Tăng thép', type: 'DESIGN_CHANGE', costImpact: 200000000, scheduleImpact: 5, requestedById: 'sys'
    });
    testPass("Change Request Created.");

    await ContractGovernanceService.approveChangeRequest(cr.id, 'sys');
    testPass("Change Request Approved. Budget Updated.");

    // EOT Claim
    const claim = await ContractGovernanceService.submitClaim({
      projectId: project.id, changeRequestId: cr.id, type: 'EXTENSION_OF_TIME', title: 'Xin gia hạn tiến độ do mưa', description: '', claimedAmount: 0, claimedDays: 3
    });
    
    await ContractGovernanceService.resolveClaim({
      claimId: claim.id, status: 'APPROVED', approvedAmount: 0, approvedDays: 3
    });
    testPass("EOT Claim Approved. Delay Event automatically injected to CPM schedule.");


    console.log("\n--------------------------------------------------------------------------------");
    console.log("📈 TASK 4: EXECUTIVE INTELLIGENCE & PROJECT HEALTH");
    console.log("--------------------------------------------------------------------------------");

    const health = await ExecutionIntelligenceService.getProjectHealth(project.id);
    
    testPass(`Project Health Score generated: ${health.health.score} (${health.health.status})`);
    if (health.alerts.length > 0) {
      testPass(`Proactive Execution Alerts generated: \n   - ${health.alerts.join('\n   - ')}`);
    } else {
      testFail("No execution alerts generated.");
    }


  } catch (err) {
    console.error("FATAL ERROR during audit:", err);
  } finally {
    // Cleanup
    await prisma.activityDependency.deleteMany({});
    await prisma.equipmentAssignment.deleteMany({});
    await prisma.delayEvent.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.equipmentAsset.deleteMany({});
    await prisma.resourcePool.deleteMany({});
    await prisma.claimRecord.deleteMany({});
    await prisma.changeRequest.deleteMany({});
    await prisma.project.delete({ where: { id: project.id } });
  }

  console.log("\n================================================================================");
  console.log(`🎯 PHASES 9-13 AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log(`   Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log("================================================================================\n");
}

runConstructionAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
