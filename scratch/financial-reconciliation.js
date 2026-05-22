const { PrismaClient } = require('../generated/prisma-client');
const p = new PrismaClient();

async function main() {
  console.log('=== PHASE 5: FINANCIAL RECONCILIATION ===\n');

  // 1. Database truth
  const budgets = await p.budgetRecord.findMany();
  const costs = await p.costRecord.findMany();
  const project = await p.project.findFirst();
  const wbsItems = await p.wBSItem.findMany();

  const dbBudgetTotal = budgets.reduce((s, b) => s + Number(b.estimatedAmount), 0);
  const dbCostTotal = costs.reduce((s, c) => s + Number(c.amount), 0);

  console.log('--- DATABASE TOTALS ---');
  console.log('BudgetRecord SUM(estimatedAmount):', dbBudgetTotal);
  console.log('CostRecord SUM(amount):', dbCostTotal);
  console.log('Project.totalBudget:', Number(project.totalBudget));
  console.log('Project.contractValue:', Number(project.contractValue));

  // 2. WBS Rollup simulation
  const budgetByWbs = {};
  budgets.forEach(b => {
    budgetByWbs[b.wbsId] = (budgetByWbs[b.wbsId] || 0) + Number(b.estimatedAmount);
  });
  
  const costByWbs = {};
  costs.forEach(c => {
    costByWbs[c.wbsId] = (costByWbs[c.wbsId] || 0) + Number(c.amount);
  });

  console.log('\n--- WBS-LEVEL BUDGET BREAKDOWN ---');
  wbsItems.forEach(w => {
    const budget = budgetByWbs[w.id] || 0;
    const cost = costByWbs[w.id] || 0;
    console.log(`  ${w.id} (${w.name}): budget=${budget}, cost=${cost}, variance=${budget - cost}`);
  });

  // 3. Rollup check - root nodes
  const rootWbs = wbsItems.filter(w => !w.parentId);
  let rollupTotal = 0;
  const getSubtreeBudget = (parentId) => {
    let total = budgetByWbs[parentId] || 0;
    wbsItems.filter(w => w.parentId === parentId).forEach(child => {
      total += getSubtreeBudget(child.id);
    });
    return total;
  };
  
  console.log('\n--- ROOT NODE ROLLUP ---');
  rootWbs.forEach(r => {
    const rolled = getSubtreeBudget(r.id);
    rollupTotal += rolled;
    console.log(`  ${r.name}: rollup_budget=${rolled}`);
  });
  
  console.log(`\n  WBS Rollup Total: ${rollupTotal}`);
  console.log(`  DB BudgetRecord Total: ${dbBudgetTotal}`);
  console.log(`  MATCH: ${rollupTotal === dbBudgetTotal ? 'YES ✓' : 'NO ✗ MISMATCH!'}`);

  // 4. Project.totalBudget reconciliation
  console.log('\n--- PROJECT totalBudget RECONCILIATION ---');
  console.log(`  Project.totalBudget: ${Number(project.totalBudget)}`);
  console.log(`  DB BudgetRecord Total: ${dbBudgetTotal}`);
  console.log(`  MATCH: ${Number(project.totalBudget) === dbBudgetTotal ? 'YES ✓' : 'NO ✗ MISMATCH!'}`);
  if (Number(project.totalBudget) !== dbBudgetTotal) {
    console.log(`  DRIFT: ${Number(project.totalBudget) - dbBudgetTotal}`);
  }

  // 5. Dashboard KPI
  console.log('\n--- DASHBOARD KPI ANALYSIS ---');
  const budgetVariance = dbBudgetTotal - dbCostTotal;
  const costOverrun = dbBudgetTotal > 0 ? (dbCostTotal / dbBudgetTotal * 100).toFixed(2) : '0.00';
  console.log(`  Budget Variance: ${budgetVariance}`);
  console.log(`  Cost Overrun %: ${costOverrun}%`);
  console.log(`  WBS Count: ${wbsItems.length}`);

  console.log('\n=== RECONCILIATION SUMMARY ===');
  console.log(`DB BudgetRecord Total: ${dbBudgetTotal}`);
  console.log(`WBS Rollup Total: ${rollupTotal}`);
  console.log(`Project.totalBudget: ${Number(project.totalBudget)}`);
  console.log(`All Aligned: ${rollupTotal === dbBudgetTotal && dbBudgetTotal === Number(project.totalBudget) ? 'YES ✓ CERTIFIED' : 'NO ✗ REQUIRES SYNC'}`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
