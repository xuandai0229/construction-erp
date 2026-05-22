const { PrismaClient } = require('../generated/prisma-client');
const p = new PrismaClient();

async function main() {
  console.log('=== PHASE 1: DATABASE FORENSIC AUDIT ===\n');

  // 1. Record Counts
  const [wbs, budget, cost, invoice, revenue, audit] = await Promise.all([
    p.wBSItem.count(),
    p.budgetRecord.count(),
    p.costRecord.count(),
    p.invoice.count(),
    p.revenue.count(),
    p.auditLog.count()
  ]);
  console.log('--- RECORD COUNTS ---');
  console.log('WBSItem:', wbs);
  console.log('BudgetRecord:', budget);
  console.log('CostRecord:', cost);
  console.log('Invoice:', invoice);
  console.log('Revenue:', revenue);
  console.log('AuditLog:', audit);

  // 2. All WBS Items
  const allWbs = await p.wBSItem.findMany({ orderBy: { level: 'asc' } });
  const wbsIds = new Set(allWbs.map(w => w.id));

  console.log('\n--- WBS ITEMS ---');
  allWbs.forEach(w => console.log(`  [L${w.level}] ${w.id} | name="${w.name}" | parent=${w.parentId} | project=${w.projectId} | deleted=${w.deletedAt}`));

  // 3. Orphan WBS (parentId points to non-existing WBS)
  console.log('\n--- ORPHAN WBS (parentId → non-existing) ---');
  const orphanWbs = allWbs.filter(w => w.parentId && !wbsIds.has(w.parentId));
  if (orphanWbs.length === 0) console.log('  NONE FOUND ✓');
  else orphanWbs.forEach(w => console.log(`  ORPHAN: ${w.id} → parentId=${w.parentId}`));

  // 4. Circular parent check
  console.log('\n--- CIRCULAR PARENT CHECK ---');
  let circularFound = false;
  for (const w of allWbs) {
    const visited = new Set();
    let current = w;
    while (current && current.parentId) {
      if (visited.has(current.id)) {
        console.log(`  CIRCULAR: ${w.id} → chain loops at ${current.id}`);
        circularFound = true;
        break;
      }
      visited.add(current.id);
      current = allWbs.find(x => x.id === current.parentId);
    }
  }
  if (!circularFound) console.log('  NONE FOUND ✓');

  // 5. Duplicate WBS check (same name + same parentId + same project)
  console.log('\n--- DUPLICATE WBS CHECK ---');
  const wbsDups = new Map();
  allWbs.forEach(w => {
    const key = `${w.projectId}|${w.parentId}|${w.name}`;
    if (!wbsDups.has(key)) wbsDups.set(key, []);
    wbsDups.get(key).push(w.id);
  });
  let dupFound = false;
  for (const [key, ids] of wbsDups) {
    if (ids.length > 1) {
      console.log(`  DUPLICATE: key="${key}" → ids=[${ids.join(', ')}]`);
      dupFound = true;
    }
  }
  if (!dupFound) console.log('  NONE FOUND ✓');

  // 6. Budget Records - orphan check
  const allBudgets = await p.budgetRecord.findMany();
  console.log('\n--- BUDGET RECORDS ---');
  allBudgets.forEach(b => console.log(`  ${b.id} | wbsId=${b.wbsId} | project=${b.projectId} | amount=${b.estimatedAmount} | costType=${b.costType}`));

  const orphanBudgets = allBudgets.filter(b => !wbsIds.has(b.wbsId));
  console.log('\n--- ORPHAN BUDGETS (wbsId → non-existing WBS) ---');
  if (orphanBudgets.length === 0) console.log('  NONE FOUND ✓');
  else orphanBudgets.forEach(b => console.log(`  ORPHAN: ${b.id} → wbsId=${b.wbsId}`));

  // 7. Cost Records - orphan check
  const allCosts = await p.costRecord.findMany();
  console.log('\n--- COST RECORDS ---');
  allCosts.forEach(c => console.log(`  ${c.id} | wbsId=${c.wbsId} | project=${c.projectId} | amount=${c.amount} | status=${c.approvalStatus}/${c.workflowStatus} | deleted=${c.deletedAt}`));

  const orphanCosts = allCosts.filter(c => !wbsIds.has(c.wbsId));
  console.log('\n--- ORPHAN COSTS (wbsId → non-existing WBS) ---');
  if (orphanCosts.length === 0) console.log('  NONE FOUND ✓');
  else orphanCosts.forEach(c => console.log(`  ORPHAN: ${c.id} → wbsId=${c.wbsId}`));

  // 8. Invoice Records
  const allInvoices = await p.invoice.findMany();
  console.log('\n--- INVOICES ---');
  allInvoices.forEach(i => console.log(`  ${i.id} | wbsId=${i.wbsId} | project=${i.projectId} | amount=${i.amount} | deleted=${i.deletedAt}`));

  const orphanInvoices = allInvoices.filter(i => !wbsIds.has(i.wbsId));
  console.log('\n--- ORPHAN INVOICES ---');
  if (orphanInvoices.length === 0) console.log('  NONE FOUND ✓');
  else orphanInvoices.forEach(i => console.log(`  ORPHAN: ${i.id} → wbsId=${i.wbsId}`));

  // 9. Revenue Records
  const allRevenues = await p.revenue.findMany();
  console.log('\n--- REVENUES ---');
  allRevenues.forEach(r => console.log(`  ${r.id} | wbsId=${r.wbsId} | project=${r.projectId} | amount=${r.amount} | deleted=${r.deletedAt}`));

  const orphanRevenues = allRevenues.filter(r => !wbsIds.has(r.wbsId));
  console.log('\n--- ORPHAN REVENUES ---');
  if (orphanRevenues.length === 0) console.log('  NONE FOUND ✓');
  else orphanRevenues.forEach(r => console.log(`  ORPHAN: ${r.id} → wbsId=${r.wbsId}`));

  // 10. UUID Validity
  console.log('\n--- INVALID UUID CHECK ---');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let invalidUuids = false;
  for (const w of allWbs) {
    if (!uuidRegex.test(w.id)) { console.log(`  INVALID UUID WBS: ${w.id}`); invalidUuids = true; }
    if (w.parentId && !uuidRegex.test(w.parentId)) { console.log(`  INVALID UUID parentId: ${w.parentId}`); invalidUuids = true; }
  }
  for (const b of allBudgets) {
    if (!uuidRegex.test(b.id)) { console.log(`  INVALID UUID Budget: ${b.id}`); invalidUuids = true; }
    if (!uuidRegex.test(b.wbsId)) { console.log(`  INVALID UUID Budget.wbsId: ${b.wbsId}`); invalidUuids = true; }
  }
  if (!invalidUuids) console.log('  ALL VALID ✓');

  // 11. Project check
  const allProjects = await p.project.findMany();
  console.log('\n--- PROJECTS ---');
  allProjects.forEach(proj => console.log(`  ${proj.id} | name="${proj.name}" | totalBudget=${proj.totalBudget} | contractValue=${proj.contractValue}`));

  // 12. Cross-reference: project IDs
  const projectIds = new Set(allProjects.map(pr => pr.id));
  const wbsBadProject = allWbs.filter(w => !projectIds.has(w.projectId));
  console.log('\n--- WBS WITH INVALID projectId ---');
  if (wbsBadProject.length === 0) console.log('  NONE ✓');
  else wbsBadProject.forEach(w => console.log(`  BAD: ${w.id} → projectId=${w.projectId}`));

  // Summary
  console.log('\n=== DATABASE FORENSIC SUMMARY ===');
  console.log(`Total WBS: ${wbs}, Budgets: ${budget}, Costs: ${cost}, Invoices: ${invoice}, Revenues: ${revenue}`);
  console.log(`Orphan WBS: ${orphanWbs.length}`);
  console.log(`Orphan Budgets: ${orphanBudgets.length}`);
  console.log(`Orphan Costs: ${orphanCosts.length}`);
  console.log(`Orphan Invoices: ${orphanInvoices.length}`);
  console.log(`Orphan Revenues: ${orphanRevenues.length}`);
  console.log(`Circular Parents: ${circularFound ? 'YES' : 'NONE'}`);
  console.log(`Duplicate WBS: ${dupFound ? 'YES' : 'NONE'}`);
  console.log(`Invalid UUIDs: ${invalidUuids ? 'YES' : 'NONE'}`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
