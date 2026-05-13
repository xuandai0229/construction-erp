import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing findUnique with non-unique where field...");
    const project = await (prisma.project as any).findUnique({
      where: {
        id: "3c392229-d53e-497c-b2b3-97eb5de97938",
        deletedAt: null
      }
    });
    console.log("Result:", project);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
