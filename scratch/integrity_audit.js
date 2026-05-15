
const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function auditFinancialOrphans() {
    console.log("=== ERP DATA INTEGRITY AUDIT ===");
    
    // 1. Find Budgets without WBS or with deleted WBS
    const orphanBudgets = await prisma.budgetRecord.findMany({
        where: {
            OR: [
                { wbs: { is: null } },
                { wbs: { deletedAt: { not: null } } }
            ]
        },
        include: { wbs: true }
    });
    
    // 2. Find Costs without WBS or with deleted WBS
    const orphanCosts = await prisma.costRecord.findMany({
        where: {
            OR: [
                { wbs: { is: null } },
                { wbs: { deletedAt: { not: null } } }
            ]
        },
        include: { wbs: true }
    });
    
    console.log(`Orphan Budgets Found: ${orphanBudgets.length}`);
    console.log(`Orphan Costs Found: ${orphanCosts.length}`);
    
    if (orphanBudgets.length > 0 || orphanCosts.length > 0) {
        console.log("🚨 DATA INTEGRITY BREACH: Orphan records detected in database.");
    } else {
        console.log("✅ DATA INTEGRITY: No orphan financial records found.");
    }
}

auditFinancialOrphans()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
