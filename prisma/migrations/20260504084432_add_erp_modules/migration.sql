-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('material', 'labor', 'machine', 'subcontract', 'overhead', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'unpaid');

-- CreateTable
CREATE TABLE "WBSItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WBSItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "costType" "CostType" NOT NULL DEFAULT 'material',
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "costType" "CostType" NOT NULL DEFAULT 'material',
    "estimatedAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WBSItem_projectId_idx" ON "WBSItem"("projectId");

-- CreateIndex
CREATE INDEX "WBSItem_parentId_idx" ON "WBSItem"("parentId");

-- CreateIndex
CREATE INDEX "CostRecord_projectId_idx" ON "CostRecord"("projectId");

-- CreateIndex
CREATE INDEX "CostRecord_wbsId_idx" ON "CostRecord"("wbsId");

-- CreateIndex
CREATE INDEX "CostRecord_date_idx" ON "CostRecord"("date");

-- CreateIndex
CREATE INDEX "BudgetRecord_projectId_idx" ON "BudgetRecord"("projectId");

-- CreateIndex
CREATE INDEX "BudgetRecord_wbsId_idx" ON "BudgetRecord"("wbsId");

-- CreateIndex
CREATE INDEX "Revenue_projectId_idx" ON "Revenue"("projectId");

-- CreateIndex
CREATE INDEX "Revenue_wbsId_idx" ON "Revenue"("wbsId");

-- CreateIndex
CREATE INDEX "Invoice_projectId_idx" ON "Invoice"("projectId");

-- CreateIndex
CREATE INDEX "Invoice_wbsId_idx" ON "Invoice"("wbsId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");

-- AddForeignKey
ALTER TABLE "WBSItem" ADD CONSTRAINT "WBSItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WBSItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRecord" ADD CONSTRAINT "BudgetRecord_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
