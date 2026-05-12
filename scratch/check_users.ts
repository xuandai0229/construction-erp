import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) - ID: ${u.id}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
