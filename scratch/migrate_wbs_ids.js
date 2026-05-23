const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function migrateIDs() {
  console.log("=== STARTING ID MIGRATION ===");
  const wbsItems = await prisma.wBSItem.findMany();
  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  const invalidWbs = wbsItems.filter(w => !isUUID(w.id));
  if (invalidWbs.length === 0) {
    console.log("No invalid WBS IDs found.");
    return;
  }

  // Create mapping of old ID to new UUID
  const idMap = new Map();
  invalidWbs.forEach(w => {
    idMap.set(w.id, crypto.randomUUID());
  });

  console.log(`Found ${invalidWbs.length} invalid WBS IDs. Planning migration...`);

  // We have to use raw queries or multiple steps because we are updating primary keys and foreign keys.
  // Foreign keys constraint might prevent us from simply updating the PK first.
  // Wait, Prisma might not allow updating PK easily if there are FK constraints unless it's ON UPDATE CASCADE.
  // Let's check if Prisma schema uses ON UPDATE CASCADE. If not, we might need a workaround.
  
  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Disable trigger / foreign key checks (Postgres)
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED;`);

      for (const oldId of idMap.keys()) {
        const newId = idMap.get(oldId);
        console.log(`Migrating ${oldId} -> ${newId}`);

        // Update WBSItem itself
        await tx.$executeRawUnsafe(`UPDATE "WBSItem" SET "id" = $1 WHERE "id" = $2;`, newId, oldId);
        
        // Update children's parentId
        await tx.$executeRawUnsafe(`UPDATE "WBSItem" SET "parentId" = $1 WHERE "parentId" = $2;`, newId, oldId);
        
        // Update BudgetRecord
        await tx.$executeRawUnsafe(`UPDATE "BudgetRecord" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update CostRecord
        await tx.$executeRawUnsafe(`UPDATE "CostRecord" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update Revenue
        await tx.$executeRawUnsafe(`UPDATE "Revenue" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update Invoice
        await tx.$executeRawUnsafe(`UPDATE "Invoice" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update BOQItem
        await tx.$executeRawUnsafe(`UPDATE "BOQItem" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);

        // Update PurchaseOrderItem
        await tx.$executeRawUnsafe(`UPDATE "PurchaseOrderItem" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update SiteConsumption
        await tx.$executeRawUnsafe(`UPDATE "SiteConsumption" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
        
        // Update PurchaseRequest (wbsId is optional)
        await tx.$executeRawUnsafe(`UPDATE "PurchaseRequest" SET "wbsId" = $1 WHERE "wbsId" = $2;`, newId, oldId);
      }
    });
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateIDs();
