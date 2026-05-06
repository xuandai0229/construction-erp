import { ApprovalService } from "../services/approval.service";
import { CostService } from "../services/cost.service";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function testWorkflow() {
  console.log("Starting Approval Workflow Test...");

  try {
    const user = await prisma.user.findFirst() || await prisma.user.create({ data: { email: "manager@test.com", role: UserRole.MANAGER } });
    const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } }) || await prisma.user.create({ data: { email: "admin@test.com", role: UserRole.ADMIN } });
    const project = await prisma.project.findFirst() || await prisma.project.create({ data: { name: "Test Proj", ownerId: user.id } });
    const wbs = await prisma.wBSItem.findFirst({ where: { projectId: project.id } }) || await prisma.wBSItem.create({ data: { name: "Root", projectId: project.id } });
    
    // 1. Create a cost
    console.log("Step 1: Creating a cost...");
    const cost = await CostService.create({
      projectId: project.id,
      wbsId: wbs.id,
      amount: 1000,
      costType: "material",
      createdById: user.id
    });

    // 2. Try to update amount (Should FAIL)
    console.log("Step 2: Trying to update amount without approval...");
    try {
      await CostService.update(cost.id, {
        amount: 2000,
        userId: user.id,
        userRole: UserRole.MANAGER
      });
      console.error("❌ FAILED: Cost update should have been blocked.");
    } catch (err: any) {
      console.log(`✅ SUCCESS: Update blocked: ${err.message}`);
    }

    // 3. Create Approval Request
    console.log("Step 3: Creating approval request...");
    const request = await ApprovalService.createRequest({
      projectId: project.id,
      requesterId: user.id,
      entityType: "COST_REVERSE",
      entityId: cost.id,
      requestData: { oldAmount: 1000, newAmount: 2000 },
      reason: "Sai số liệu nhập ban đầu"
    });
    console.log(`✅ Request created: ${request.id}`);

    // 4. Admin Approves
    console.log("Step 4: Admin approving...");
    await ApprovalService.processStep({
      requestId: request.id,
      approverId: admin.id,
      status: "APPROVED",
      comment: "Đã kiểm tra, đồng ý điều chỉnh."
    });
    console.log("✅ Request approved.");

    // 5. Try update again (Should SUCCEED)
    console.log("Step 5: Retrying update after approval...");
    const updated = await CostService.update(cost.id, {
      amount: 2000,
      userId: user.id,
      userRole: UserRole.MANAGER
    });
    console.log(`✅ SUCCESS: Cost updated to ${updated.amount}`);

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

testWorkflow().catch(console.error);
