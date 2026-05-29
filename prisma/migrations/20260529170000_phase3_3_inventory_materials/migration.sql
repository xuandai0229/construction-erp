-- CreateEnum
CREATE TYPE "InventoryDocumentType" AS ENUM ('PURCHASE_RECEIPT', 'RETURN_RECEIPT', 'ADJUSTMENT_IN', 'ISSUE_TO_PROJECT', 'ISSUE_TO_COST', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "InventoryDocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryValuationMethod" AS ENUM ('MOVING_AVERAGE');

-- CreateTable
CREATE TABLE "MaterialItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "group" TEXT,
    "defaultWarehouseId" TEXT,
    "inventoryAccount" TEXT NOT NULL DEFAULT '152',
    "expenseAccount" TEXT NOT NULL DEFAULT '621',
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaterialItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "managerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "wbsId" TEXT,
    "documentType" "InventoryDocumentType" NOT NULL,
    "documentNo" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InventoryDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierId" TEXT,
    "contractId" TEXT,
    "vatInvoiceId" TEXT,
    "sourceWarehouseId" TEXT,
    "targetWarehouseId" TEXT,
    "partnerName" TEXT,
    "description" TEXT,
    "netAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "postedJournalEntryId" TEXT,
    "reversalJournalEntryId" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryDocumentLine" (
    "id" TEXT NOT NULL,
    "inventoryDocumentId" TEXT NOT NULL,
    "materialItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "vatRate" DECIMAL(5,2),
    "vatAmount" DECIMAL(18,2),
    "grossAmount" DECIMAL(18,2),
    "debitAccount" TEXT,
    "creditAccount" TEXT,
    "sourceWarehouseId" TEXT,
    "targetWarehouseId" TEXT,
    "projectId" TEXT,
    "wbsId" TEXT,

    CONSTRAINT "InventoryDocumentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inventoryDocumentId" TEXT NOT NULL,
    "inventoryDocumentLineId" TEXT NOT NULL,
    "materialItemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "projectId" TEXT,
    "wbsId" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "documentType" "InventoryDocumentType" NOT NULL,
    "documentNo" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "materialItemId" TEXT NOT NULL,
    "projectId" TEXT,
    "wbsId" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "avgCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialItem_companyId_idx" ON "MaterialItem"("companyId");

-- CreateIndex
CREATE INDEX "MaterialItem_code_idx" ON "MaterialItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialItem_companyId_code_deletedAt_key" ON "MaterialItem"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_idx" ON "Warehouse"("companyId");

-- CreateIndex
CREATE INDEX "Warehouse_projectId_idx" ON "Warehouse"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_companyId_code_deletedAt_key" ON "Warehouse"("companyId", "code", "deletedAt");

-- CreateIndex
CREATE INDEX "InventoryDocument_companyId_idx" ON "InventoryDocument"("companyId");

-- CreateIndex
CREATE INDEX "InventoryDocument_projectId_idx" ON "InventoryDocument"("projectId");

-- CreateIndex
CREATE INDEX "InventoryDocument_documentType_idx" ON "InventoryDocument"("documentType");

-- CreateIndex
CREATE INDEX "InventoryDocument_status_idx" ON "InventoryDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocument_companyId_documentType_documentNo_deleted_key" ON "InventoryDocument"("companyId", "documentType", "documentNo", "deletedAt");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_inventoryDocumentId_idx" ON "InventoryDocumentLine"("inventoryDocumentId");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_materialItemId_idx" ON "InventoryDocumentLine"("materialItemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_companyId_idx" ON "InventoryMovement"("companyId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_materialItemId_idx" ON "InventoryMovement"("materialItemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_projectId_idx" ON "InventoryMovement"("projectId");

-- CreateIndex
CREATE INDEX "InventoryBalance_companyId_idx" ON "InventoryBalance"("companyId");

-- CreateIndex
CREATE INDEX "InventoryBalance_warehouseId_idx" ON "InventoryBalance"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryBalance_materialItemId_idx" ON "InventoryBalance"("materialItemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_warehouseId_materialItemId_projectId_wbsId_key" ON "InventoryBalance"("warehouseId", "materialItemId", "projectId", "wbsId");

-- AddForeignKey
ALTER TABLE "MaterialItem" ADD CONSTRAINT "MaterialItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_vatInvoiceId_fkey" FOREIGN KEY ("vatInvoiceId") REFERENCES "TaxInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_inventoryDocumentId_fkey" FOREIGN KEY ("inventoryDocumentId") REFERENCES "InventoryDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "MaterialItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryDocumentId_fkey" FOREIGN KEY ("inventoryDocumentId") REFERENCES "InventoryDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryDocumentLineId_fkey" FOREIGN KEY ("inventoryDocumentLineId") REFERENCES "InventoryDocumentLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "MaterialItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "MaterialItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
