import { ProjectService } from "../services/project.service";
import { prisma } from "../lib/prisma";

async function test() {
  try {
    console.log("Testing ProjectService.findMany...");
    const result = await ProjectService.findMany({});
    console.log("Success:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Caught error:", error);
  } finally {
    // @ts-ignore
    if (prisma.$disconnect) await prisma.$disconnect();
  }
}

test();
