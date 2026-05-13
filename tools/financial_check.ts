import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function validateFinancials() {
  console.log('--- Financial Validation Started ---');

  // 1. Check Invoice Remaining Amounts
  const invoices = await prisma.invoice.findMany({
    include: { payments: { where: { deletedAt: null } } }
  });

  let invoiceErrors = 0;
  for (const inv of invoices) {
    const totalPaid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const expectedRemaining = Number(inv.amount) - totalPaid;
    
    if (Math.abs(Number(inv.remainingAmount) - expectedRemaining) > 0.01) {
      console.error(`[Invoice Error] ID: ${inv.id} - RemainingAmount mismatch. Found: ${inv.remainingAmount}, Expected: ${expectedRemaining}`);
      invoiceErrors++;
    }
  }

  // 2. Check VAT Consistency
  const costs = await prisma.costRecord.findMany({ where: { deletedAt: null } });
  let vatErrors = 0;
  for (const c of costs) {
    const expectedVAT = Number(c.amount) * (Number(c.vatRate) / 100);
    if (Math.abs(Number(c.vatAmount) - expectedVAT) > 10) { // allow small rounding
      console.error(`[VAT Error] Cost ID: ${c.id} - VAT mismatch. Found: ${c.vatAmount}, Expected: ${expectedVAT}`);
      vatErrors++;
    }
  }

  console.log('--- Validation Summary ---');
  console.log(`Invoices Checked: ${invoices.length} (${invoiceErrors} errors)`);
  console.log(`Costs Checked: ${costs.length} (${vatErrors} errors)`);
  
  if (invoiceErrors === 0 && vatErrors === 0) {
    console.log('Financial integrity is EXCELLENT.');
  } else {
    console.warn('Action required to fix financial inconsistencies.');
  }
}

validateFinancials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
