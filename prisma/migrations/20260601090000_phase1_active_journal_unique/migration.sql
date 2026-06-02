-- Phase 1: prevent duplicate active journal entries for the same source document.
-- Rollback:
--   DROP INDEX IF EXISTS "JournalEntry_active_source_unique";
--
-- Pre-migration duplicate check:
--   SELECT "sourceType", "sourceId", COUNT(*)
--   FROM "JournalEntry"
--   WHERE "deletedAt" IS NULL AND "isReversed" = false AND "sourceType" IS NOT NULL AND "sourceId" IS NOT NULL
--   GROUP BY "sourceType", "sourceId"
--   HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_active_source_unique"
ON "JournalEntry" ("sourceType", "sourceId")
WHERE "deletedAt" IS NULL AND "isReversed" = false AND "sourceType" IS NOT NULL AND "sourceId" IS NOT NULL;
