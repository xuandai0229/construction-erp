
const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function verifyFinalNumbers() {
    const project = await prisma.project.findFirst({
        where: { name: 'Chung cu mini Sunshine' }
    });

    if (!project) {
        console.log("❌ Project not found.");
        return;
    }

    const costs = await prisma.costRecord.findMany({
        where: { 
            projectId: project.id, 
            deletedAt: null,
            approvalStatus: 'APPROVED'
        },
        include: { wbs: true }
    });

    console.log(`=== FINAL VERIFICATION: ${project.name} ===`);
    let total = 0;
    costs.forEach(c => {
        console.log(`- ${c.note || 'No note'} (${c.wbs?.name}): ${Number(c.amount).toLocaleString()} VNĐ`);
        total += Number(c.amount);
    });

    console.log(`\n>>> TOTAL APPROVED ACTUAL: ${total.toLocaleString()} VNĐ`);
}

verifyFinalNumbers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
