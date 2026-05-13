import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function simulateIncident() {
  console.log('--- Incident Recovery Simulation Started ---');

  // Test 1: Transaction Rollback
  console.log('Test 1: Simulating failed transaction (Cost creation with invalid WBS)...');
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create a cost
      const cost = await tx.costRecord.create({
        data: {
          projectId: 'PILOT_ID',
          wbsId: 'NON_EXISTENT_WBS', // This should fail
          amount: 5000,
          costType: 'material' as any,
          date: new Date()
        }
      });
      console.log('Cost created (Unexpected):', cost.id);
    });
  } catch (err: any) {
    console.log('Expected Failure Caught:', err.message);
  }

  // Verify no orphan records
  const orphanCheck = await prisma.costRecord.findFirst({
    where: { amount: 5000, wbsId: 'NON_EXISTENT_WBS' }
  });
  if (!orphanCheck) {
    console.log('✅ Success: Transaction rolled back correctly. No orphan records found.');
  } else {
    console.error('❌ Failure: Transaction did not roll back! Orphan record found:', orphanCheck.id);
  }

  console.log('--- Simulation Completed ---');
}

simulateIncident()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
