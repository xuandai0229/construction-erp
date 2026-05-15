
const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function verifyPilotData() {
    const project = await prisma.project.findFirst({
        where: { name: 'Chung cu mini Sunshine' }
    });

    if (!project) {
        console.log("❌ Pilot project not found.");
        return;
    }

    console.log(`=== PILOT PROJECT: ${project.name} ===`);
    
    // 1. Fetch Budgets
    const budgets = await prisma.budgetRecord.findMany({
        where: { projectId: project.id, deletedAt: null }
    });
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.estimatedAmount), 0);
    console.log(`Total Budget (Server Sum): ${totalBudget.toLocaleString()} VNĐ`);
    
    // 2. Fetch Costs
    const costs = await prisma.costRecord.findMany({
        where: { projectId: project.id, deletedAt: null }
    });
    const approvedCosts = costs.filter(c => c.approvalStatus === 'APPROVED');
    const totalActual = approvedCosts.reduce((sum, c) => sum + Number(c.amount), 0);
    console.log(`Total Actual (Server Sum - APPROVED): ${totalActual.toLocaleString()} VNĐ`);
    
    // 3. Verify Draft Exclusion
    const draftCosts = costs.filter(c => c.approvalStatus === 'DRAFT');
    console.log(`Draft Costs (Excluded): ${draftCosts.reduce((sum, c) => sum + Number(c.amount), 0).toLocaleString()} VNĐ`);

    // 4. Integrity Check
    if (totalBudget === 3000000000 && totalActual === 190000000) {
        console.log("✅ DATA INTEGRITY: Pilot data matches exactly.");
    } else {
        console.log("🚨 DATA DISCREPANCY: Values do not match pilot expectations.");
    }
}

verifyPilotData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
