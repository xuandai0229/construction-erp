import { prisma } from "../lib/prisma";

async function run() {
  console.log("Starting Reconciliation Check...");

  // 1. Check Unbalanced Journals
  const journals = await prisma.journalEntry.findMany({
    include: { lines: true }
  });

  let unbalancedCount = 0;
  for (const j of journals) {
    const debits = j.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
    const credits = j.lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);

    if (debits !== credits) {
      console.error(`🚨 Lệch sổ tại JournalEntry: ${j.id} (${j.reference}). DEBIT: ${debits}, CREDIT: ${credits}`);
      unbalancedCount++;
    }
  }

  // 2. Check Duplicate Source Postings (Double-posting)
  // We only count non-reversal entries as potential duplicates
  const journalGroups = await prisma.journalEntry.findMany({
    include: { lines: true }
  });

  const sourceMap = new Map<string, any[]>();
  journalGroups.forEach(j => {
    const key = `${j.sourceType}:${j.sourceId}`;
    if (!sourceMap.has(key)) sourceMap.set(key, []);
    sourceMap.get(key)!.push(j);
  });

  let hasErrors = unbalancedCount > 0;
  for (const [key, entries] of sourceMap.entries()) {
    const originalEntries = entries.filter(e => !e.reference?.startsWith("REV-"));
    const reversalEntries = entries.filter(e => e.reference?.startsWith("REV-"));

    if (originalEntries.length > 1) {
      console.error(`🚨 Cảnh báo trùng lặp Posting (Double-Entry): ${key} có ${originalEntries.length} bản ghi gốc!`);
      hasErrors = true;
    }

    if (reversalEntries.length > originalEntries.length) {
      console.error(`🚨 Cảnh báo: ${key} có nhiều bản ghi HỦY (${reversalEntries.length}) hơn bản ghi gốc (${originalEntries.length})!`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log("✅ Sổ cái hoàn toàn cân đối. Không có chứng từ nào bị hạch toán kép.");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
