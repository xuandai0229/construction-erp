import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function fixFinancials() {
  console.log('Fixing legacy financial data...');

  // 1. Fix Costs (VAT & Net Amount)
  const costs = await prisma.costRecord.findMany({
    where: { 
      OR: [
        { vatAmount: 0 },
        { netAmount: 0 }
      ]
    }
  });

  console.log(`Fixing ${costs.length} costs...`);
  for (const c of costs) {
    const vatRate = Number(c.vatRate) || 10;
    const vatAmount = Number(c.amount) * (vatRate / 100);
    const netAmount = Number(c.amount) - vatAmount;

    await prisma.costRecord.update({
      where: { id: c.id },
      data: {
        vatAmount,
        netAmount,
        vatRate
      }
    });
  }

  // 2. Fix Invoices (Remaining Amount)
  const invoices = await prisma.invoice.findMany({
    include: { payments: { where: { deletedAt: null } } }
  });

  for (const inv of invoices) {
    const totalPaid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Number(inv.amount) - totalPaid;
    
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { remainingAmount: remaining }
    });
  }

  console.log('Financial data fix completed.');
}

fixFinancials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
