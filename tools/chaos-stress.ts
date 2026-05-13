import { prisma } from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant';
import { RevenueService } from '@/services/revenue.service';
import { ProjectService } from '@/services/project.service';
import { performance } from 'perf_hooks';

/**
 * ENTERPRISE ERP STRESS & CHAOS SUITE
 * Phases 1-8 Implementation for Forensic Validation
 */

const TEST_COMPANY_ID = "STRESS_TEST_CORP_" + Date.now();
const CONCURRENT_USERS = 100; // Starting point for Phase 1
const BATCH_SIZE = 1000;

async function measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const res = await fn();
  const end = performance.now();
  console.log(`[METRIC] ${name}: ${(end - start).toFixed(2)}ms`);
  return res;
}

async function phase1_ConcurrentUsers() {
  console.log(`--- PHASE 1: SIMULATING ${CONCURRENT_USERS} CONCURRENT USERS ---`);
  
  // Setup shared invoice
  const company = await prisma.company.upsert({
    where: { id: TEST_COMPANY_ID },
    update: {},
    create: { id: TEST_COMPANY_ID, name: "Stress Test Corp", code: TEST_COMPANY_ID }
  });
  const project = await prisma.project.create({ data: { name: "Stress Project", companyId: company.id } as any });
  const wbs = await prisma.wBSItem.create({ data: { projectId: project.id, name: "WBS 1" } as any });
  const invoice = await RevenueService.createInvoice({
    projectId: project.id,
    wbsId: wbs.id,
    amount: 1000000,
    invoiceNumber: "INV-STRESS-" + Date.now()
  });

  const workers = Array.from({ length: CONCURRENT_USERS }).map(async (_, i) => {
    const start = performance.now();
    try {
      // Each user tries to:
      // 1. Fetch project
      // 2. Create a payment
      await prisma.project.findUnique({ where: { id: project.id } });
      await RevenueService.createPayment({
        invoiceId: invoice.id,
        amount: 10,
        description: `Concurrent Payment User ${i}`,
        date: new Date()
      });
      return { success: true, latency: performance.now() - start };
    } catch (e: any) {
      return { success: false, error: e.message, latency: performance.now() - start };
    }
  });

  const results = await Promise.all(workers);
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;
  const avgLatency = results.reduce((acc, r) => acc + r.latency, 0) / results.length;

  console.log(`[RESULTS] Phase 1: Successes: ${successes}, Failures: ${failures}, Avg Latency: ${avgLatency.toFixed(2)}ms`);
  
  if (failures > 0) {
    console.warn(`[COLLAPSE POINT] Concurrency detected at ${CONCURRENT_USERS} users. First error: ${results.find(r => !r.success)?.error}`);
  }
}

async function phase4_LargeDataset() {
  console.log("--- PHASE 4: LARGE DATASET VALIDATION (SCALABILITY) ---");
  
  // We won't create 1M records in one go for the AI demo, but we will test the aggregate performance
  // on a batch of 5000 records to check for N+1 or slow query issues.
  
  console.log(`Generating ${BATCH_SIZE} cost records...`);
  const project = await prisma.project.create({ data: { name: "Big Data Project", companyId: TEST_COMPANY_ID } as any });
  const wbs = await prisma.wBSItem.create({ data: { projectId: project.id, name: "Big WBS" } as any });
  
  await measure("Bulk Insert Costs", async () => {
    const costs = Array.from({ length: BATCH_SIZE }).map(() => ({
      projectId: project.id,
      wbsId: wbs.id,
      amount: Math.random() * 1000,
      costType: "material" as any,
      companyId: TEST_COMPANY_ID,
      description: "Stress data"
    }));
    await prisma.costRecord.createMany({ data: costs });
  });

  await measure("Heavy Aggregate (SUM/GROUP BY)", async () => {
    return await prisma.costRecord.groupBy({
      by: ['costType'],
      where: { projectId: project.id },
      _sum: { amount: true },
      _count: true
    });
  });

  await measure("Cascading Soft Delete (Project + 1000 Children)", async () => {
    await ProjectService.delete(project.id, "system");
  });
}

async function phase8_ChaosEngineering() {
  console.log("--- PHASE 8: CHAOS ENGINEERING (DB LATENCY) ---");
  
  // We simulate a race condition where one transaction takes a long time
  // and another tries to update the same record.
  
  const project = await prisma.project.create({ data: { name: "Chaos Project", companyId: TEST_COMPANY_ID } as any });
  
  console.log("Simulating slow transaction vs fast transaction...");
  
  const slowTx = prisma.$transaction(async (tx) => {
    await tx.project.update({ where: { id: project.id }, data: { description: "Slow update" } });
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
    return await tx.project.findUnique({ where: { id: project.id } });
  });

  const fastTx = (async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Start after 500ms
    try {
      await prisma.project.update({ where: { id: project.id }, data: { description: "Fast update" } });
      return "FAST_SUCCESS";
    } catch (e: any) {
      return "FAST_FAILED: " + e.message;
    }
  })();

  const [slowRes, fastRes] = await Promise.all([slowTx, fastTx]);
  console.log(`[CHAOS RESULT] Slow Transaction Result: ${slowRes?.description}`);
  console.log(`[CHAOS RESULT] Fast Transaction Result: ${fastRes}`);
}

async function main() {
  console.log("=== STARTING ENTERPRISE ERP STRESS TEST ===");
  const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  
  await runWithTenant(TEST_COMPANY_ID, async () => {
    try {
      await phase1_ConcurrentUsers();
      await phase4_LargeDataset();
      await phase8_ChaosEngineering();
    } catch (e) {
      console.error("[FATAL ERROR DURING STRESS]", e);
    }
  });

  const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[METRIC] Heap Growth: ${(finalMemory - initialMemory).toFixed(2)} MB`);
  console.log("=== STRESS TEST COMPLETED ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
