-- CreateEnum
CREATE TYPE "CashBankDocumentType" AS ENUM ('CASH_RECEIPT', 'CASH_PAYMENT', 'BANK_TRANSFER', 'BANK_CREDIT_NOTICE', 'BANK_DEBIT_NOTICE');

-- CreateEnum
CREATE TYPE "CashBankDocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REVERSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CashBankDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "documentType" "CashBankDocumentType" NOT NULL,
    "documentNo" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "description" TEXT NOT NULL,
    "partnerName" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "status" "CashBankDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "postedJournalEntryId" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalRef" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBankDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashBankDocument_companyId_documentType_documentNo_deletedA_key" ON "CashBankDocument"("companyId", "documentType", "documentNo", "deletedAt");

-- CreateIndex
CREATE INDEX "CashBankDocument_companyId_idx" ON "CashBankDocument"("companyId");

-- CreateIndex
CREATE INDEX "CashBankDocument_projectId_idx" ON "CashBankDocument"("projectId");

-- CreateIndex
CREATE INDEX "CashBankDocument_documentType_idx" ON "CashBankDocument"("documentType");

-- CreateIndex
CREATE INDEX "CashBankDocument_status_idx" ON "CashBankDocument"("status");

-- AddForeignKey
ALTER TABLE "CashBankDocument" ADD CONSTRAINT "CashBankDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashBankDocument" ADD CONSTRAINT "CashBankDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashBankDocument" ADD CONSTRAINT "CashBankDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashBankDocument" ADD CONSTRAINT "CashBankDocument_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashBankDocument" ADD CONSTRAINT "CashBankDocument_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
