// @ts-nocheck
import { PrismaClient } from "../generated/prisma-client";
import { CostService } from "../services/cost.service";

const prisma = new PrismaClient();

async function test() {
  console.log("Testing CostService.create...");
  try {
    const project = await prisma.project.findFirst();
    if (!project) {
      console.error("No project found!");
      return;
    }
    console.log("Found project:", project.id, project.name);

    const wbs = await prisma.wBSItem.findFirst({
      where: { projectId: project.id }
    });
    if (!wbs) {
      console.error("No WBS item found for project!");
      return;
    }
    console.log("Found WBS item:", wbs.id, wbs.name);

    const user = await prisma.user.findFirst();
    if (!user) {
      console.error("No user found!");
      return;
    }
    console.log("Found user:", user.id, user.email);

    const payload = {
      projectId: project.id,
      wbsId: wbs.id,
      costType: "material" as any,
      amount: 15000000,
      quantity: 10,
      unitPrice: 1500000,
      note: "Test cost from script",
      supplier: "Supplier A",
      date: new Date().toISOString(),
      vatRate: 10,
      retentionRate: 5,
    };

    console.log("Calling CostService.create with payload:", payload);
    const result = await CostService.create(payload, {
      userId: user.id,
      correlationId: "test-correlation-id",
    });

    console.log("SUCCESS! Created cost record:", result);
  } catch (error: any) {
    console.error("FAILED! Error details:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
