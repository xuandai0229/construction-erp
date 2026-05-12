// @ts-nocheck
import { prisma } from "../../lib/prisma";
import { PostingEngine } from "../../lib/accounting/postingEngine";
import { UnbalancedEntryError, PeriodLockedError } from "../../lib/errors";

describe("Ledger Posting & Reversal Integrity", () => {
  const MOCK_COST_ID = "cost-test-123";
  const MOCK_PROJECT_ID = "proj-test-123";
  let journalEntryId = "";

  beforeAll(async () => {
    // Setup test accounts
    await prisma.ledgerAccount.createMany({
      data: [
        { id: "account-6210", code: "6210", name: "Chi phí NVL", type: "EXPENSE" },
        { id: "account-3310", code: "3310", name: "Phải trả NCC", type: "LIABILITY" },
      ],
      skipDuplicates: true
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transactionLine.deleteMany({ where: { journalEntry: { reference: { startsWith: "REV-COST" } } } });
    await prisma.transactionLine.deleteMany({ where: { journalEntry: { reference: "COST-test-123" } } });
    await prisma.journalEntry.deleteMany({ where: { reference: { startsWith: "REV-COST" } } });
    await prisma.journalEntry.deleteMany({ where: { reference: "COST-test-123" } });
  });

  it("should create balanced double-entry for cost", async () => {
    await prisma.$transaction(async (tx) => {
      await PostingEngine.postCost(tx, {
        costId: MOCK_COST_ID,
        projectId: MOCK_PROJECT_ID,
        amount: 5000000,
        costType: "material",
        description: "Test Material Cost"
      });
    });

    const entry = await prisma.journalEntry.findFirst({
      where: { sourceId: MOCK_COST_ID },
      include: { lines: true }
    });

    expect(entry).toBeDefined();
    expect(entry?.lines.length).toBe(2);
    
    const debits = entry?.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0) || 0;
    const credits = entry?.lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0) || 0;
    
    expect(debits).toBe(5000000);
    expect(credits).toBe(5000000);
    expect(debits - credits).toBe(0);

    journalEntryId = entry!.id;
  });

  it("should correctly reverse a journal entry", async () => {
    await prisma.$transaction(async (tx) => {
      await PostingEngine.reverseJournal(tx, MOCK_COST_ID, "COST", "user-123");
    });

    const oldEntry = await prisma.journalEntry.findUnique({ where: { id: journalEntryId } });
    expect(oldEntry?.isReversed).toBe(true);

    const newEntry = await prisma.journalEntry.findFirst({
      where: { reference: `REV-COST-${MOCK_COST_ID}` },
      include: { lines: true }
    });

    expect(newEntry).toBeDefined();
    const debits = newEntry?.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0) || 0;
    const credits = newEntry?.lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0) || 0;
    
    expect(debits).toBe(5000000);
    expect(credits).toBe(5000000);
    // Since we reversed, the Expense should be CREDIT and Liability should be DEBIT
    const expenseLine = newEntry?.lines.find(l => l.accountId === "account-6210");
    expect(expenseLine?.type).toBe("CREDIT");
  });

  it("should prevent double reversal", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await PostingEngine.reverseJournal(tx, MOCK_COST_ID, "COST", "user-123");
      })
    ).rejects.toThrow("Giao dịch đã được hủy trước đó");
  });
});
