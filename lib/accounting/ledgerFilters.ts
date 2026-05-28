import type { Prisma } from "../../generated/prisma-client";

export function getPostedJournalEntryFilter(input: {
  projectId?: string | null;
  startDate?: Date;
  endDate?: Date;
} = {}): Prisma.JournalEntryWhereInput {
  return {
    ...(input.projectId && { projectId: input.projectId }),
    deletedAt: null,
    isPosted: true,
    isReversed: false,
    ...(input.startDate || input.endDate
      ? {
          date: {
            ...(input.startDate && { gte: input.startDate }),
            ...(input.endDate && { lte: input.endDate }),
          },
        }
      : {}),
  };
}

export function getPostedLedgerLineFilter(input: {
  projectId?: string | null;
  startDate?: Date;
  endDate?: Date;
} = {}): Prisma.TransactionLineWhereInput {
  return {
    deletedAt: null,
    journalEntry: getPostedJournalEntryFilter(input),
  };
}
