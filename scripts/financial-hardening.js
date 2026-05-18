const { PrismaClient } = require("../generated/prisma-client");

const prisma = new PrismaClient();

async function addConstraint(name, sql) {
  await prisma.$executeRawUnsafe(`ALTER TABLE ${sql.table} DROP CONSTRAINT IF EXISTS "${name}"`);
  await prisma.$executeRawUnsafe(`ALTER TABLE ${sql.table} ADD CONSTRAINT "${name}" ${sql.body}`);
}

async function main() {
  console.log("[financial-hardening] Normalizing financial semantics: amount = gross, amount = netAmount + vatAmount.");

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      UPDATE "CostRecord"
      SET
        amount = ABS(amount),
        "netAmount" = ROUND((ABS(amount) / (1 + ("vatRate" / 100)))::numeric, 2),
        "vatAmount" = ROUND((ABS(amount) - (ABS(amount) / (1 + ("vatRate" / 100))))::numeric, 2),
        "retentionAmount" = ROUND((ABS(amount) * ("retentionRate" / 100))::numeric, 2),
        supplier = COALESCE(NULLIF(TRIM(supplier), ''), 'UNKNOWN_SUPPLIER_REVIEW_REQUIRED'),
        note = CASE
          WHEN amount < 0 THEN CONCAT(COALESCE(note, ''), ' | FINANCIAL_HARDENING: negative amount normalized')
          ELSE note
        END
      WHERE "deletedAt" IS NULL
    `);

    await tx.$executeRawUnsafe(`
      UPDATE "Invoice"
      SET
        amount = ABS(amount),
        "paidAmount" = LEAST(ABS("paidAmount"), ABS(amount)),
        "remainingAmount" = GREATEST(0, ABS(amount) - LEAST(ABS("paidAmount"), ABS(amount))),
        "netAmount" = ROUND((ABS(amount) / (1 + ("vatRate" / 100)))::numeric, 2),
        "vatAmount" = ROUND((ABS(amount) - (ABS(amount) / (1 + ("vatRate" / 100))))::numeric, 2),
        "retentionAmount" = ROUND((ABS(amount) * ("retentionRate" / 100))::numeric, 2),
        status = CASE
          WHEN LEAST(ABS("paidAmount"), ABS(amount)) >= ABS(amount) THEN 'PAID'::"InvoiceStatus"
          WHEN LEAST(ABS("paidAmount"), ABS(amount)) > 0 THEN 'PARTIAL'::"InvoiceStatus"
          ELSE status
        END
      WHERE "deletedAt" IS NULL
    `);

    await tx.$executeRawUnsafe(`
      UPDATE "Invoice" i
      SET
        "paidAmount" = LEAST(i.amount, COALESCE(p.total_paid, 0)),
        "remainingAmount" = GREATEST(0, i.amount - LEAST(i.amount, COALESCE(p.total_paid, 0))),
        status = CASE
          WHEN LEAST(i.amount, COALESCE(p.total_paid, 0)) >= i.amount THEN 'PAID'::"InvoiceStatus"
          WHEN LEAST(i.amount, COALESCE(p.total_paid, 0)) > 0 THEN 'PARTIAL'::"InvoiceStatus"
          ELSE i.status
        END
      FROM (
        SELECT "invoiceId", SUM(amount) AS total_paid
        FROM "Payment"
        WHERE "deletedAt" IS NULL
        GROUP BY "invoiceId"
      ) p
      WHERE i.id = p."invoiceId" AND i."deletedAt" IS NULL
    `);

    await tx.$executeRawUnsafe(`
      UPDATE "InventoryTransaction"
      SET
        quantity = ABS(quantity),
        type = CASE WHEN quantity < 0 THEN 'ISSUE'::"InventoryTransactionType" ELSE type END,
        note = CASE
          WHEN quantity < 0 THEN CONCAT(COALESCE(note, ''), ' | FINANCIAL_HARDENING: negative quantity normalized')
          ELSE note
        END
    `);
  });

  await addConstraint("cost_amount_positive", {
    table: `"CostRecord"`,
    body: `CHECK ("deletedAt" IS NOT NULL OR amount > 0)`,
  });
  await addConstraint("cost_amount_equals_net_plus_vat", {
    table: `"CostRecord"`,
    body: `CHECK ("deletedAt" IS NOT NULL OR ABS((amount - ("netAmount" + "vatAmount"))::numeric) <= 1)`,
  });
  await addConstraint("invoice_amount_positive", {
    table: `"Invoice"`,
    body: `CHECK ("deletedAt" IS NOT NULL OR amount > 0)`,
  });
  await addConstraint("invoice_amount_equals_net_plus_vat", {
    table: `"Invoice"`,
    body: `CHECK ("deletedAt" IS NOT NULL OR ABS((amount - ("netAmount" + "vatAmount"))::numeric) <= 1)`,
  });
  await addConstraint("invoice_remaining_consistent", {
    table: `"Invoice"`,
    body: `CHECK ("deletedAt" IS NOT NULL OR ABS(("remainingAmount" - GREATEST(0, amount - "paidAmount"))::numeric) <= 1)`,
  });
  await addConstraint("inventory_quantity_positive", {
    table: `"InventoryTransaction"`,
    body: `CHECK (quantity > 0)`,
  });

  console.log("[financial-hardening] Completed normalization and DB constraints.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
