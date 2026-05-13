import { PrismaClient, UserRole } from '../generated/prisma-client';
import { assertIsManager } from '../lib/auth-guard';

const prisma = new PrismaClient();

async function runSecurityAudit() {
  console.log('--- Security Final Pass Started ---');

  // Create temporary users
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@test.com' },
    update: { role: UserRole.VIEWER },
    create: { email: 'viewer@test.com', name: 'Test Viewer', role: UserRole.VIEWER }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: { role: UserRole.MANAGER },
    create: { email: 'manager@test.com', name: 'Test Manager', role: UserRole.MANAGER }
  });

  // Test 1: Viewer
  console.log(`Test 1: Checking permission for Viewer (ID: ${viewer.id})...`);
  try {
    await assertIsManager(viewer.id);
    console.error('❌ Failure: Viewer was allowed to pass Manager guard!');
  } catch (err: any) {
    console.log(`✅ Success: Viewer blocked by guard. Status: ${err.status}`);
  }

  // Test 2: Manager
  console.log(`Test 2: Checking permission for Manager (ID: ${manager.id})...`);
  try {
    await assertIsManager(manager.id);
    console.log('✅ Success: Manager passed guard correctly.');
  } catch (err: any) {
    console.error(`❌ Failure: Manager blocked by guard! Error: ${err.message}`);
  }

  console.log('--- Security Audit Completed ---');
}

runSecurityAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
