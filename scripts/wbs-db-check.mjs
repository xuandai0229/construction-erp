import { PrismaClient } from '../generated/prisma-client/index.js';

const p = new PrismaClient();

async function main() {
  const items = await p.wBSItem.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, parentId: true, level: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }]
  });

  console.log(`\n=== WBS DATABASE FORENSICS ===`);
  console.log(`Total WBS Items: ${items.length}\n`);

  for (const item of items) {
    const costs = await p.costRecord.count({ where: { wbsId: item.id } });
    const budgets = await p.budgetRecord.count({ where: { wbsId: item.id } });
    const children = await p.wBSItem.count({ where: { parentId: item.id } });
    
    const canDelete = costs === 0 && budgets === 0 && children === 0;
    const blockers = [];
    if (children > 0) blockers.push(`children=${children}`);
    if (costs > 0) blockers.push(`costs=${costs}`);
    if (budgets > 0) blockers.push(`budgets=${budgets}`);

    console.log(`[L${item.level}] ${item.name}`);
    console.log(`  ID: ${item.id}`);
    console.log(`  parentId: ${item.parentId || 'NULL (root)'}`);
    console.log(`  costs: ${costs}, budgets: ${budgets}, children: ${children}`);
    console.log(`  canDelete: ${canDelete}${blockers.length ? ' | BLOCKERS: ' + blockers.join(', ') : ''}`);
    console.log('');
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
