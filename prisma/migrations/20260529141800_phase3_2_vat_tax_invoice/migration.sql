-- CreateEnum
CREATE TYPE "TaxInvoiceType" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "TaxInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'POSTED', 'CANCELLED', 'REVERSED');

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "wbsId" TEXT,
    "invoiceType" "TaxInvoiceType" NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceSeries" TEXT NOT NULL,
    "invoiceTemplate" TEXT NOT NULL DEFAULT '1C26TBB',
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerName" TEXT NOT NULL,
    "partnerTaxCode" TEXT NOT NULL,
    "partnerAddress" TEXT,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "vatAmount" DECIMAL(18,2) NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "status" "TaxInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "postedJournalEntryId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxInvoice_companyId_idx" ON "TaxInvoice"("companyId");

-- CreateIndex
CREATE INDEX "TaxInvoice_projectId_idx" ON "TaxInvoice"("projectId");

-- CreateIndex
CREATE INDEX "TaxInvoice_invoiceType_idx" ON "TaxInvoice"("invoiceType");

-- CreateIndex
CREATE INDEX "TaxInvoice_status_idx" ON "TaxInvoice"("status");

-- CreateIndex
CREATE INDEX "TaxInvoice_invoiceDate_idx" ON "TaxInvoice"("invoiceDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_companyId_invoiceType_invoiceNumber_invoiceSerie_key" ON "TaxInvoice"("companyId", "invoiceType", "invoiceNumber", "invoiceSeries", "deletedAt");

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
