const { PrismaClient } = require("../generated/prisma-client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- DB INSPECTION START ---");
  
  // 1. Query all tables in public schema
  console.log("Checking all tables in 'public' schema...");
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log("Tables found:", tables.map(t => t.table_name));
  } catch (err) {
    console.error("Failed to query information_schema.tables:", err.message);
  }

  // 2. Query Project table details if it exists
  console.log("Checking Project table...");
  try {
    const projectCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "Project";`;
    console.log("Raw Project Count (including soft-deleted):", projectCount);
  } catch (err) {
    console.error("Failed to count Projects:", err.message);
  }

  try {
    const projects = await prisma.$queryRaw`SELECT id, name, "deletedAt", "companyId", "branchId" FROM "Project";`;
    console.log("All Projects details:");
    projects.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}, deletedAt: ${p.deletedAt}, companyId: ${p.companyId}, branchId: ${p.branchId}`);
    });
  } catch (err) {
    console.error("Failed to list Projects details:", err.message);
  }

  // 3. Check migration history
  console.log("Checking prisma_migrations...");
  try {
    const migrations = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations";`;
    console.log("Migrations applied:", migrations);
  } catch (err) {
    console.error("Failed to query _prisma_migrations:", err.message);
  }

  console.log("--- DB INSPECTION END ---");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
