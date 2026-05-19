import { prisma } from "../lib/prisma";

async function checkSessionUser() {
  console.log("=== DB AUDIT QUERY ===");
  
  // 1. Get first super admin (offline developer bootstrap user)
  const firstSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" }
  });
  console.log("Bootstrap Super Admin in DB:", JSON.stringify(firstSuperAdmin, null, 2));

  // 2. Count users by role
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true }
  });
  console.log("Users by role:", JSON.stringify(roles, null, 2));

  // 3. List all companies and project counts
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { projects: true, users: true } }
    }
  });
  console.log("Companies & counts:", JSON.stringify(companies, null, 2));

  // 4. Sample some projects from other companies
  const sampleProjects = await prisma.project.findMany({
    take: 5,
    select: { id: true, name: true, companyId: true }
  });
  console.log("Sample Projects:", JSON.stringify(sampleProjects, null, 2));
}

checkSessionUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
