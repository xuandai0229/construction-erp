-- CreateEnum
CREATE TYPE "AdvanceRecipientType" AS ENUM ('EMPLOYEE', 'VENDOR');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'PARTIALLY_SETTLED', 'FULLY_SETTLED', 'OVERDUE', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REVERSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AdvanceRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "wbsItemId" TEXT,
    "supplierId" TEXT,
    "employeeId" TEXT,
    "recipientType" "AdvanceRecipientType" NOT NULL,
    "advanceNo" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "settledAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(18,2) NOT NULL,
    "purpose" TEXT,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "expectedSettlementDate" TIMESTAMP(3),
    "postedJournalEntryId" TEXT,
    "reversalJournalEntryId" TEXT,
    "exceptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AdvanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvanceSettlement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "advanceRequestId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "costRecordId" TEXT,
    "paymentId" TEXT,
    "contractId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "settlementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedJournalEntryId" TEXT,
    "reversalJournalEntryId" TEXT,
    "reason" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AdvanceSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvanceRequest_companyId_idx" ON "AdvanceRequest"("companyId");

-- CreateIndex
CREATE INDEX "AdvanceRequest_projectId_idx" ON "AdvanceRequest"("projectId");

-- CreateIndex
CREATE INDEX "AdvanceRequest_contractId_idx" ON "AdvanceRequest"("contractId");

-- CreateIndex
CREATE INDEX "AdvanceRequest_supplierId_idx" ON "AdvanceRequest"("supplierId");

-- CreateIndex
CREATE INDEX "AdvanceRequest_recipientType_idx" ON "AdvanceRequest"("recipientType");

-- CreateIndex
CREATE INDEX "AdvanceRequest_status_idx" ON "AdvanceRequest"("status");

-- CreateIndex
CREATE INDEX "AdvanceRequest_expectedSettlementDate_idx" ON "AdvanceRequest"("expectedSettlementDate");

-- CreateIndex
CREATE INDEX "AdvanceSettlement_companyId_idx" ON "AdvanceSettlement"("companyId");

-- CreateIndex
CREATE INDEX "AdvanceSettlement_advanceRequestId_idx" ON "AdvanceSettlement"("advanceRequestId");

-- CreateIndex
CREATE INDEX "AdvanceSettlement_invoiceId_idx" ON "AdvanceSettlement"("invoiceId");

-- CreateIndex
CREATE INDEX "AdvanceSettlement_status_idx" ON "AdvanceSettlement"("status");

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceRequest" ADD CONSTRAINT "AdvanceRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceSettlement" ADD CONSTRAINT "AdvanceSettlement_advanceRequestId_fkey" FOREIGN KEY ("advanceRequestId") REFERENCES "AdvanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceSettlement" ADD CONSTRAINT "AdvanceSettlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceSettlement" ADD CONSTRAINT "AdvanceSettlement_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceSettlement" ADD CONSTRAINT "AdvanceSettlement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceSettlement" ADD CONSTRAINT "AdvanceSettlement_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
