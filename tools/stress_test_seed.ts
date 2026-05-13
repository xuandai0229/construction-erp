import { PrismaClient, UserRole } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting massive stress test seeding...');

  // 1. Get or create a super admin user if doesn't exist
  let admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin_stress_test@example.com',
        name: 'Stress Test Admin',
        role: 'SUPER_ADMIN',
      }
    });
  }

  // 2. Create projects
  const projectCount = 10;
  const wbsPerProject = 30;
  const costsPerWBS = 100;
  const revenuesPerWBS = 10;
  const tasksPerProject = 50;

  for (let p = 0; p < projectCount; p++) {
    const projectName = `Mega Project ${p + 1} - ${Math.random().toString(36).substring(7).toUpperCase()}`;
    console.log(`Creating project: ${projectName}`);
    
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: 'Ultra large scale project for UI/UX performance optimization and stress testing. This project contains thousands of records to test virtualization and layout stability.',
        contractValue: new Decimal(10000000000 + Math.random() * 50000000000),
        status: 'IN_PROGRESS',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ownerId: admin.id,
      },
    });

    // Create Tasks for project
    console.log(`  Seeding ${tasksPerProject} tasks for project...`);
    await prisma.task.createMany({
      data: Array.from({ length: tasksPerProject }).map((_, t) => ({
        projectId: project.id,
        title: `Công việc ${t + 1} - ${projectName}`,
        description: `Mô tả công việc chi tiết cho ${t + 1}. Cần hoàn thành sớm để đảm bảo tiến độ dự án.`,
        status: (['TODO', 'IN_PROGRESS', 'DONE'] as const)[Math.floor(Math.random() * 3)],
        priority: Math.floor(Math.random() * 5),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      }))
    });

    // 3. Create WBS Items
    for (let w = 0; w < wbsPerProject; w++) {
      const wbsName = `Hạng mục ${w + 1} - Giai đoạn ${Math.floor(w/5) + 1}`;
      const wbs = await prisma.wBSItem.create({
        data: {
          projectId: project.id,
          name: wbsName,
          budgetAmount: new Decimal(500000000 + Math.random() * 1000000000),
          code: `WBS-${p+1}-${w+1}`,
          level: 1,
        },
      });

      // 4. Create Cost Records
      console.log(`    Seeding ${costsPerWBS} costs for WBS: ${wbsName}`);
      const costData = Array.from({ length: costsPerWBS }).map((_, c) => ({
        projectId: project.id,
        wbsId: wbs.id,
        amount: new Decimal(500000 + Math.random() * 20000000),
        note: `Chi phí thực tế ${c + 1} - ${wbsName}. Nội dung test UI: ${'LOREM IPSUM '.repeat(10)}`,
        supplier: `Công ty Cung ứng ${Math.floor(Math.random() * 200)}`,
        costType: (['material', 'labor', 'machine', 'subcontract', 'overhead', 'other'] as const)[Math.floor(Math.random() * 6)],
        status: (['paid', 'unpaid'] as const)[Math.floor(Math.random() * 2)],
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
      }));

      await prisma.costRecord.createMany({
        data: costData,
      });
      
      // 5. Create revenues
      await prisma.revenue.createMany({
        data: Array.from({ length: revenuesPerWBS }).map((_, r) => ({
           projectId: project.id,
           wbsId: wbs.id,
           amount: new Decimal(10000000 + Math.random() * 50000000),
           description: `Doanh thu thanh toán đợt ${r + 1} cho ${wbsName}`,
           date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
           status: 'paid',
           createdById: admin.id,
        }))
      });
    }

    // 6. Create Audit Logs for noise
    console.log(`  Seeding audit logs for project...`);
    await prisma.auditLog.createMany({
      data: Array.from({ length: 100 }).map((_, a) => ({
        userId: admin.id,
        action: (['CREATE', 'UPDATE', 'DELETE', 'VIEW'] as const)[Math.floor(Math.random() * 4)],
        entity: 'Project',
        entityId: project.id,
        severity: (['INFO', 'WARNING', 'CRITICAL'] as const)[Math.floor(Math.random() * 3)],
        timestamp: new Date(),
      }))
    });
  }

  console.log('Massive stress test seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
