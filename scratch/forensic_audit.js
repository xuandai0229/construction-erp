const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  console.log("=== DB FORENSIC AUDIT ===");

  // 1. Check ID formats
  const projects = await prisma.project.findMany();
  const wbs = await prisma.wBSItem.findMany();
  const budgets = await prisma.budgetRecord.findMany();

  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  const invalidProjectIds = projects.filter(p => !isUUID(p.id)).map(p => p.id);
  const invalidWbsIds = wbs.filter(w => !isUUID(w.id)).map(w => w.id);
  const invalidBudgetIds = budgets.filter(b => !isUUID(b.id)).map(b => b.id);

  console.log("Invalid Project IDs:", invalidProjectIds);
  console.log("Invalid WBS IDs:", invalidWbsIds);
  console.log("Invalid Budget IDs:", invalidBudgetIds);

  // 2. Orphan records check
  const projectIds = new Set(projects.map(p => p.id));
  const wbsIds = new Set(wbs.map(w => w.id));

  const orphanWbs = wbs.filter(w => !projectIds.has(w.projectId));
  const orphanBudgetsWbs = budgets.filter(b => !wbsIds.has(b.wbsId));
  const orphanBudgetsProj = budgets.filter(b => !projectIds.has(b.projectId));

  console.log("Orphan WBS (no Project):", orphanWbs.map(w => w.id));
  console.log("Orphan Budgets (no WBS):", orphanBudgetsWbs.map(b => b.id));
  console.log("Orphan Budgets (no Project):", orphanBudgetsProj.map(b => b.id));

  // 3. Circular Dependencies & Parent checks
  const wbsMap = new Map();
  wbs.forEach(w => wbsMap.set(w.id, w));

  let circularCount = 0;
  for (const item of wbs) {
    const visited = new Set();
    let current = item;
    while (current.parentId) {
      if (visited.has(current.parentId)) {
        console.log(`Circular reference detected for WBS: ${item.id}`);
        circularCount++;
        break;
      }
      visited.add(current.parentId);
      current = wbsMap.get(current.parentId);
      if (!current) break; // Orphan parent pointer
    }
  }
  console.log(`Circular dependencies found: ${circularCount}`);

  // 4. Financial Consistency
  console.log("=== FINANCIAL AGGREGATION CHECK ===");
  const budgetRollup = budgets.reduce((acc, b) => acc + Number(b.estimatedAmount), 0);
  const projectRollup = projects.reduce((acc, p) => acc + Number(p.totalBudget), 0);
  const wbsRollup = wbs.reduce((acc, w) => acc + Number(w.budgetAmount), 0);

  console.log(`Sum of all BudgetRecords: ${budgetRollup}`);
  console.log(`Sum of Project.totalBudget: ${projectRollup}`);
  console.log(`Sum of WBSItem.budgetAmount: ${wbsRollup}`);

  await prisma.$disconnect();
}

runAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
