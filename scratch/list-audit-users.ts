import { prisma } from "../lib/prisma";

async function listAuditUsers() {
  const users = await prisma.user.findMany({
    where: { companyId: "AUDIT_20260518_company" }
  });
  console.log("Users under AUDIT_20260518_company:");
  console.log(JSON.stringify(users, null, 2));
}

listAuditUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
