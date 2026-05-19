const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Postgres doesn't allow CREATE DATABASE inside a transaction block.
    // By default, $executeRawUnsafe might execute it fine if it doesn't wrap in transaction,
    // but if it fails, we can catch it.
    await prisma.$executeRawUnsafe('CREATE DATABASE construction_erp_shadow');
    console.log("Database construction_erp_shadow created successfully.");
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log("Database construction_erp_shadow already exists.");
    } else {
      console.error("Failed to create shadow database:", err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
