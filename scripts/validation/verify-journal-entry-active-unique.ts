import { prisma } from "../../lib/prisma";

async function main() {
  const duplicates = await prisma.$queryRaw<Array<{ sourceType: string; sourceId: string; count: bigint }>>`
    SELECT "sourceType", "sourceId", COUNT(*)::bigint AS count
    FROM "JournalEntry"
    WHERE "deletedAt" IS NULL
      AND "isReversed" = false
      AND "sourceType" IS NOT NULL
      AND "sourceId" IS NOT NULL
    GROUP BY "sourceType", "sourceId"
    HAVING COUNT(*) > 1
  `;

  const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'JournalEntry'
      AND indexname = 'JournalEntry_active_source_unique'
  `;

  if (duplicates.length > 0) {
    console.error("FAIL verify-journal-entry-active-unique: còn duplicate active JournalEntry.");
    for (const item of duplicates) {
      console.error(`- ${item.sourceType}:${item.sourceId} count=${item.count.toString()}`);
    }
    process.exit(1);
  }

  if (indexes.length === 0) {
    console.error("FAIL verify-journal-entry-active-unique: chưa thấy partial unique index JournalEntry_active_source_unique trong database.");
    process.exit(1);
  }

  console.log("PASS verify-journal-entry-active-unique: không có duplicate active và partial unique index đã tồn tại.");
}

main()
  .catch((error) => {
    console.error("FAIL verify-journal-entry-active-unique");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
