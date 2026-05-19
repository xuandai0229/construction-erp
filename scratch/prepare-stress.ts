import { prisma } from "../lib/prisma";
import { ProjectStatus } from "../generated/prisma-client";

async function prepare() {
  console.log("Preparing project and WBS for stress-test.ts...");
  const projectId = "2fa9e808-761f-4532-8d0c-85e748aaaeb4";
  const wbsId = "73533917-034d-4a2a-ba6d-968b783ba55b";
  
  await prisma.project.upsert({
    where: { id: projectId },
    update: {},
    create: {
      id: projectId,
      name: "Stress Hardened Project",
      totalBudget: 500000000,
      status: ProjectStatus.IN_PROGRESS
    }
  });

  await prisma.wBSItem.upsert({
    where: { id: wbsId },
    update: {},
    create: {
      id: wbsId,
      projectId,
      name: "Stress Hardened WBS",
      budgetAmount: 500000000
    }
  });
  console.log("Preparation completed successfully!");
}

prepare().catch(console.error).finally(() => prisma.$disconnect());
