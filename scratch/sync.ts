import { PrismaClient } from '@prisma/client';
import { FinancialAggregationService } from '../services/financial-aggregation.service';

const prisma = new PrismaClient();

async function syncAll() {
  const projects = await prisma.project.findMany();
  for (const p of projects) {
    console.log(`Syncing WBS for Project ${p.id}...`);
    await FinancialAggregationService.getWBSAggregation(p.id);
  }
  // Wait a bit for process.nextTick to finish
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const wbs = await prisma.wBSItem.findMany();
  const wbsRollup = wbs.reduce((acc, w) => acc + Number(w.budgetAmount), 0);
  console.log(`Sum of WBSItem.budgetAmount after sync: ${wbsRollup}`);
  
  await prisma.$disconnect();
}

syncAll().catch(console.error);
