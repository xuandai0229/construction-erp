import { ProjectService } from "../services/project.service";
import { prisma } from "../lib/prisma";

async function testProjects() {
  try {
    const result = await ProjectService.findMany({ page: 1, limit: 10 });
    console.log("Projects fetched successfully.");
    console.log("Total projects:", result.metadata.total);
  } catch (error) {
    console.error("PROJECTS API ERROR:");
    console.error(error);
  }
}

testProjects().catch(console.error).finally(() => prisma.$disconnect());
