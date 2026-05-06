import { RBAC, AppAction } from "../lib/rbac";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function testRBAC() {
  console.log("Starting RBAC & Project Isolation Test...");

  try {
    // 1. Setup Projects
    console.log("Step 1: Setting up projects...");
    const owner = await prisma.user.findFirst() || await prisma.user.create({ data: { email: "owner@test.com", role: UserRole.MANAGER } });
    
    const projectA = await prisma.project.create({ 
      data: { name: "Project A", ownerId: owner.id } 
    });
    const projectB = await prisma.project.create({ 
      data: { name: "Project B", ownerId: "someone-else" } 
    });

    // 2. Test Case: ROLE PERMISSION
    console.log("Step 2: Testing Role-based permissions...");
    try {
      await RBAC.authorize({
        userId: owner.id,
        userRole: UserRole.VIEWER, // Simulation
        action: AppAction.FINANCIAL_DELETE
      });
      console.error("❌ FAILED: Viewer should not be able to delete.");
    } catch (err: any) {
      console.log(`✅ SUCCESS: Viewer blocked from delete: ${err.message}`);
    }

    // 3. Test Case: PROJECT ISOLATION
    console.log("Step 3: Testing Project Isolation...");
    // Manager of Project A trying to access Project B
    try {
      await RBAC.authorize({
        userId: owner.id,
        userRole: UserRole.MANAGER,
        action: AppAction.FINANCIAL_CREATE,
        projectId: projectB.id
      });
      console.error("❌ FAILED: Manager of Project A accessed Project B.");
    } catch (err: any) {
      console.log(`✅ SUCCESS: Cross-project access blocked: ${err.message}`);
    }

    // 4. Test Case: ADMIN OVERRIDE
    console.log("Step 4: Testing Admin override...");
    try {
      await RBAC.authorize({
        userId: "any-admin",
        userRole: UserRole.ADMIN,
        action: AppAction.FINANCIAL_DELETE,
        projectId: projectB.id
      });
      console.log("✅ SUCCESS: Admin bypassed isolation for Project B.");
    } catch (err: any) {
      console.error(`❌ FAILED: Admin should bypass isolation: ${err.message}`);
    }

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

testRBAC().catch(console.error);
