-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER', 'SUPER_ADMIN', 'GROUP_DIRECTOR', 'CFO', 'BRANCH_DIRECTOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'AMENDED', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'RETURN', 'ADJUST');

-- CreateEnum
CREATE TYPE "SubcontractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'TERMINATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "ProjectStatus" ADD VALUE 'CLOSED';
ALTER TYPE "ProjectStatus" ADD VALUE 'ARCHIVED';

-- DropIndex
DROP INDEX "BudgetRecord_projectId_idx";

-- DropIndex
DROP INDEX "BudgetRecord_wbsId_idx";

-- DropIndex
DROP INDEX "CostRecord_projectId_idx";

-- DropIndex
DROP INDEX "CostRecord_wbsId_idx";

-- DropIndex
DROP INDEX "Invoice_projectId_idx";

-- DropIndex
DROP INDEX "Invoice_wbsId_idx";

-- DropIndex
DROP INDEX "Payment_invoiceId_idx";

-- DropIndex
DROP INDEX "Payment_projectId_idx";

-- DropIndex
DROP INDEX "Project_createdAt_idx";

-- DropIndex
DROP INDEX "Revenue_projectId_idx";

-- DropIndex
DROP INDEX "Revenue_wbsId_idx";

-- DropIndex
DROP INDEX "Task_projectId_idx";

-- DropIndex
DROP INDEX "WBSItem_projectId_idx";

-- AlterTable
ALTER TABLE "BudgetRecord" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "estimatedAmount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "CostRecord" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "netAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "purchaseOrderId" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "retentionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "retentionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "workflowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "certifiedProgress" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "netAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "retentionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "retentionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "remainingAmount" SET DATA TYPE DECIMAL(18,2),
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "contractValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "investor" TEXT,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "totalBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Revenue" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "WBSItem" ADD COLUMN     "budgetAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalRef" TEXT,
    "reversedById" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TransactionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedBy" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "neededBy" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "poNumber" TEXT,
    "vendor" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "orderedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "wbsId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "costType" "CostType" NOT NULL DEFAULT 'material',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contractorName" TEXT,
    "originalValue" DECIMAL(18,2) NOT NULL,
    "currentValue" DECIMAL(18,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractChange" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "voNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "changeAmount" DECIMAL(18,2) NOT NULL,
    "approvedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContractChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT,
    "reason" TEXT,
    "requestId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFeed" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestData" JSONB,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "stepOrder" INTEGER NOT NULL DEFAULT 1,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityMatrix" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "maxAmount" DECIMAL(18,2) NOT NULL,
    "entityType" TEXT NOT NULL,
    "projectType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorityMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOQItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitRate" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BOQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "BudgetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegationPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegationWindow" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegationWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "size" INTEGER,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "closingBalance" DECIMAL(18,2),
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "endDate" TIMESTAMP(3),
    "name" TEXT,
    "startDate" TIMESTAMP(3),
    "month" TEXT NOT NULL,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,2),
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "progressEntryId" TEXT NOT NULL,
    "description" TEXT,
    "length" DECIMAL(18,3),
    "width" DECIMAL(18,3),
    "height" DECIMAL(18,3),
    "factor" DECIMAL(18,3) NOT NULL DEFAULT 1,
    "quantity" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "boqItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DECIMAL(18,3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConsumption" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "SiteConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontract" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "contractNumber" TEXT,
    "title" TEXT NOT NULL,
    "status" "SubcontractStatus" NOT NULL DEFAULT 'DRAFT',
    "totalValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retentionRate" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subcontract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractInvoice" (
    "id" TEXT NOT NULL,
    "subcontractId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "retentionAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcontractInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractItem" (
    "id" TEXT NOT NULL,
    "subcontractId" TEXT NOT NULL,
    "wbsId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitRate" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SubcontractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractProgress" (
    "id" TEXT NOT NULL,
    "subcontractItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DECIMAL(18,3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcontractProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "score" DECIMAL(5,2),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMaturity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accuracy" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "maturityLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "lastAssessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMaturity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariationOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "boqItemId" TEXT,
    "wbsId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'ADDITION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "VariationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weather" TEXT,
    "temperature" DOUBLE PRECISION,
    "manpower" INTEGER NOT NULL DEFAULT 0,
    "equipment" TEXT,
    "progress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "SiteLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "vendor" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "leadTimeDays" INTEGER,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "taxCode" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "projectId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "companyId" TEXT,
    "periodId" TEXT,
    "snapshotType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "version" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "reason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SagaState" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sagaType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SagaState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadModel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationUnit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_code_idx" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_type_idx" ON "LedgerAccount"("type");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_projectId_deletedAt_date_idx" ON "JournalEntry"("projectId", "deletedAt", "date");

-- CreateIndex
CREATE INDEX "JournalEntry_isReversed_projectId_idx" ON "JournalEntry"("isReversed", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceType_sourceId_deletedAt_key" ON "JournalEntry"("sourceType", "sourceId", "deletedAt");

-- CreateIndex
CREATE INDEX "TransactionLine_journalEntryId_idx" ON "TransactionLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "TransactionLine_accountId_idx" ON "TransactionLine"("accountId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_projectId_idx" ON "PurchaseRequest"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_projectId_idx" ON "GoodsReceipt"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_projectId_idx" ON "Contract"("projectId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "ContractChange_contractId_idx" ON "ContractChange"("contractId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "ActivityFeed_createdAt_idx" ON "ActivityFeed"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityFeed_projectId_idx" ON "ActivityFeed"("projectId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_projectId_idx" ON "ApprovalRequest"("projectId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalStep_approvalRequestId_idx" ON "ApprovalStep"("approvalRequestId");

-- CreateIndex
CREATE INDEX "ApprovalStep_approverId_idx" ON "ApprovalStep"("approverId");

-- CreateIndex
CREATE INDEX "BOQItem_projectId_idx" ON "BOQItem"("projectId");

-- CreateIndex
CREATE INDEX "BOQItem_wbsId_idx" ON "BOQItem"("wbsId");

-- CreateIndex
CREATE INDEX "BudgetVersion_projectId_idx" ON "BudgetVersion"("projectId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_sourceType_sourceId_idx" ON "Document"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_month_key" ON "FiscalPeriod"("month");

-- CreateIndex
CREATE INDEX "FiscalPeriod_month_idx" ON "FiscalPeriod"("month");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_materialId_idx" ON "InventoryTransaction"("materialId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_projectId_idx" ON "InventoryTransaction"("projectId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Measurement_progressEntryId_idx" ON "Measurement"("progressEntryId");

-- CreateIndex
CREATE INDEX "ProgressEntry_boqItemId_idx" ON "ProgressEntry"("boqItemId");

-- CreateIndex
CREATE INDEX "ProgressEntry_date_idx" ON "ProgressEntry"("date");

-- CreateIndex
CREATE INDEX "SiteConsumption_materialId_idx" ON "SiteConsumption"("materialId");

-- CreateIndex
CREATE INDEX "SiteConsumption_projectId_idx" ON "SiteConsumption"("projectId");

-- CreateIndex
CREATE INDEX "SiteConsumption_wbsId_idx" ON "SiteConsumption"("wbsId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcontract_contractNumber_key" ON "Subcontract"("contractNumber");

-- CreateIndex
CREATE INDEX "Subcontract_projectId_idx" ON "Subcontract"("projectId");

-- CreateIndex
CREATE INDEX "Subcontract_status_idx" ON "Subcontract"("status");

-- CreateIndex
CREATE INDEX "SubcontractInvoice_subcontractId_idx" ON "SubcontractInvoice"("subcontractId");

-- CreateIndex
CREATE INDEX "SubcontractItem_subcontractId_idx" ON "SubcontractItem"("subcontractId");

-- CreateIndex
CREATE INDEX "SubcontractItem_wbsId_idx" ON "SubcontractItem"("wbsId");

-- CreateIndex
CREATE INDEX "SubcontractProgress_date_idx" ON "SubcontractProgress"("date");

-- CreateIndex
CREATE INDEX "SubcontractProgress_subcontractItemId_idx" ON "SubcontractProgress"("subcontractItemId");

-- CreateIndex
CREATE INDEX "TrainingRecord_status_idx" ON "TrainingRecord"("status");

-- CreateIndex
CREATE INDEX "TrainingRecord_userId_idx" ON "TrainingRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMaturity_userId_key" ON "UserMaturity"("userId");

-- CreateIndex
CREATE INDEX "VariationOrder_projectId_idx" ON "VariationOrder"("projectId");

-- CreateIndex
CREATE INDEX "VariationOrder_status_idx" ON "VariationOrder"("status");

-- CreateIndex
CREATE INDEX "SiteLog_projectId_idx" ON "SiteLog"("projectId");

-- CreateIndex
CREATE INDEX "SiteLog_date_idx" ON "SiteLog"("date");

-- CreateIndex
CREATE INDEX "Quotation_purchaseRequestId_idx" ON "Quotation"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "DomainEvent_status_timestamp_idx" ON "DomainEvent"("status", "timestamp");

-- CreateIndex
CREATE INDEX "DomainEvent_projectId_idx" ON "DomainEvent"("projectId");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_projectId_snapshotType_idx" ON "FinancialSnapshot"("projectId", "snapshotType");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_companyId_periodId_idx" ON "FinancialSnapshot"("companyId", "periodId");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_companyId_entityType_idx" ON "WorkflowDefinition"("companyId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "SagaState_correlationId_key" ON "SagaState"("correlationId");

-- CreateIndex
CREATE INDEX "SagaState_companyId_sagaType_idx" ON "SagaState"("companyId", "sagaType");

-- CreateIndex
CREATE INDEX "ReadModel_companyId_type_idx" ON "ReadModel"("companyId", "type");

-- CreateIndex
CREATE INDEX "OrganizationUnit_companyId_idx" ON "OrganizationUnit"("companyId");

-- CreateIndex
CREATE INDEX "OrganizationUnit_parentId_idx" ON "OrganizationUnit"("parentId");

-- CreateIndex
CREATE INDEX "BudgetRecord_projectId_deletedAt_idx" ON "BudgetRecord"("projectId", "deletedAt");

-- CreateIndex
CREATE INDEX "BudgetRecord_wbsId_deletedAt_idx" ON "BudgetRecord"("wbsId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CostRecord_requestId_key" ON "CostRecord"("requestId");

-- CreateIndex
CREATE INDEX "CostRecord_projectId_deletedAt_date_idx" ON "CostRecord"("projectId", "deletedAt", "date");

-- CreateIndex
CREATE INDEX "CostRecord_wbsId_deletedAt_idx" ON "CostRecord"("wbsId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_requestId_key" ON "Invoice"("requestId");

-- CreateIndex
CREATE INDEX "Invoice_projectId_deletedAt_issuedDate_idx" ON "Invoice"("projectId", "deletedAt", "issuedDate");

-- CreateIndex
CREATE INDEX "Invoice_wbsId_deletedAt_idx" ON "Invoice"("wbsId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_deletedAt_idx" ON "Payment"("invoiceId", "deletedAt");

-- CreateIndex
CREATE INDEX "Payment_projectId_deletedAt_date_idx" ON "Payment"("projectId", "deletedAt", "date");

-- CreateIndex
CREATE INDEX "Project_companyId_deletedAt_createdAt_idx" ON "Project"("companyId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Revenue_projectId_deletedAt_date_idx" ON "Revenue"("projectId", "deletedAt", "date");

-- CreateIndex
CREATE INDEX "Revenue_wbsId_deletedAt_idx" ON "Revenue"("wbsId", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_projectId_deletedAt_idx" ON "Task"("projectId", "deletedAt");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "WBSItem_projectId_deletedAt_idx" ON "WBSItem"("projectId", "deletedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WBSItem" ADD CONSTRAINT "WBSItem_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WBSItem" ADD CONSTRAINT "WBSItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRecord" ADD CONSTRAINT "BudgetRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLine" ADD CONSTRAINT "TransactionLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLine" ADD CONSTRAINT "TransactionLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractChange" ADD CONSTRAINT "ContractChange_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQItem" ADD CONSTRAINT "BOQItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQItem" ADD CONSTRAINT "BOQItem_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetVersion" ADD CONSTRAINT "BudgetVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegationWindow" ADD CONSTRAINT "DelegationWindow_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegationWindow" ADD CONSTRAINT "DelegationWindow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_progressEntryId_fkey" FOREIGN KEY ("progressEntryId") REFERENCES "ProgressEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "BOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteConsumption" ADD CONSTRAINT "SiteConsumption_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteConsumption" ADD CONSTRAINT "SiteConsumption_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteConsumption" ADD CONSTRAINT "SiteConsumption_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcontract" ADD CONSTRAINT "Subcontract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractInvoice" ADD CONSTRAINT "SubcontractInvoice_subcontractId_fkey" FOREIGN KEY ("subcontractId") REFERENCES "Subcontract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractItem" ADD CONSTRAINT "SubcontractItem_subcontractId_fkey" FOREIGN KEY ("subcontractId") REFERENCES "Subcontract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractItem" ADD CONSTRAINT "SubcontractItem_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractProgress" ADD CONSTRAINT "SubcontractProgress_subcontractItemId_fkey" FOREIGN KEY ("subcontractItemId") REFERENCES "SubcontractItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMaturity" ADD CONSTRAINT "UserMaturity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariationOrder" ADD CONSTRAINT "VariationOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariationOrder" ADD CONSTRAINT "VariationOrder_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "WBSItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteLog" ADD CONSTRAINT "SiteLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

