const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function cleanData() {
  console.log('Starting data cleanup...');
  
  // Disable foreign key checks is usually TRUNCATE CASCADE in PostgreSQL, but we don't want to truncate User.
  // We'll delete in the right order to respect foreign keys.
  
  try {
    // Audit & Logs
    await prisma.auditLog.deleteMany({});
    console.log('Deleted AuditLog');
    
    await prisma.activityFeed.deleteMany({});
    console.log('Deleted ActivityFeed');

    // Job / Cache / Notifications
    await prisma.job.deleteMany({});
    console.log('Deleted Job');
    
    if (prisma.notification) {
      await prisma.notification.deleteMany({});
      console.log('Deleted Notification');
    }

    // Financial Snapshots
    await prisma.balanceSheetSnapshot.deleteMany({});
    console.log('Deleted BalanceSheetSnapshot');
    
    await prisma.profitLossSnapshot.deleteMany({});
    console.log('Deleted ProfitLossSnapshot');

    await prisma.trialBalanceSnapshot.deleteMany({});
    console.log('Deleted TrialBalanceSnapshot');

    // Accounting Entries
    await prisma.transactionLine.deleteMany({});
    console.log('Deleted TransactionLine');
    
    await prisma.journalEntry.deleteMany({});
    console.log('Deleted JournalEntry');

    // Inventory & Warehousing
    if (prisma.inventoryTransaction) {
      await prisma.inventoryTransaction.deleteMany({});
      console.log('Deleted InventoryTransaction');
    }
    if (prisma.inventoryDocumentLine) {
      await prisma.inventoryDocumentLine.deleteMany({});
      console.log('Deleted InventoryDocumentLine');
    }
    if (prisma.inventoryDocument) {
      await prisma.inventoryDocument.deleteMany({});
      console.log('Deleted InventoryDocument');
    }
    
    if (prisma.siteConsumption) {
      await prisma.siteConsumption.deleteMany({});
      console.log('Deleted SiteConsumption');
    }

    // Workflows / Approvals
    await prisma.approvalStep.deleteMany({});
    console.log('Deleted ApprovalStep');
    
    await prisma.approvalRequest.deleteMany({});
    console.log('Deleted ApprovalRequest');

    // Payments & Advances
    await prisma.paymentAllocation.deleteMany({});
    console.log('Deleted PaymentAllocation');

    await prisma.payment.deleteMany({});
    console.log('Deleted Payment');

    if (prisma.vendorPayment) {
       await prisma.vendorPayment.deleteMany({});
       console.log('Deleted VendorPayment');
    }

    await prisma.advanceSettlement.deleteMany({});
    console.log('Deleted AdvanceSettlement');
    
    await prisma.advanceRequest.deleteMany({});
    console.log('Deleted AdvanceRequest');

    // Revenue, Costs & Invoices
    await prisma.revenue.deleteMany({});
    console.log('Deleted Revenue');

    if (prisma.taxInvoice) {
        await prisma.taxInvoice.deleteMany({});
        console.log('Deleted TaxInvoice');
    }

    await prisma.invoice.deleteMany({});
    console.log('Deleted Invoice');

    await prisma.costRecord.deleteMany({});
    console.log('Deleted CostRecord');

    await prisma.budgetRecord.deleteMany({});
    console.log('Deleted BudgetRecord');
    
    if (prisma.budgetVersion) {
        await prisma.budgetVersion.deleteMany({});
        console.log('Deleted BudgetVersion');
    }

    // Procurement (Purchase Orders, Requests, Goods Receipts)
    if (prisma.purchaseOrderItem) {
        await prisma.purchaseOrderItem.deleteMany({});
        console.log('Deleted PurchaseOrderItem');
    }
    if (prisma.goodsReceipt) {
        await prisma.goodsReceipt.deleteMany({});
        console.log('Deleted GoodsReceipt');
    }
    if (prisma.purchaseOrder) {
        await prisma.purchaseOrder.deleteMany({});
        console.log('Deleted PurchaseOrder');
    }
    if (prisma.purchaseRequest) {
        await prisma.purchaseRequest.deleteMany({});
        console.log('Deleted PurchaseRequest');
    }

    // Contracts
    if (prisma.paymentPlan) {
        await prisma.paymentPlan.deleteMany({});
        console.log('Deleted PaymentPlan');
    }
    if (prisma.contractChange) {
        await prisma.contractChange.deleteMany({});
        console.log('Deleted ContractChange');
    }
    if (prisma.acceptance) {
       await prisma.acceptance.deleteMany({});
       console.log('Deleted Acceptance');
    }
    if (prisma.documentChecklist) {
       await prisma.documentChecklist.deleteMany({});
       console.log('Deleted DocumentChecklist');
    }

    await prisma.contract.deleteMany({});
    console.log('Deleted Contract');

    // WBS
    if (prisma.bOQItem) {
        await prisma.bOQItem.deleteMany({});
        console.log('Deleted BOQItem');
    }
    if (prisma.subcontractItem) {
        await prisma.subcontractItem.deleteMany({});
        console.log('Deleted SubcontractItem');
    }
    if (prisma.subcontract) {
        await prisma.subcontract.deleteMany({});
        console.log('Deleted Subcontract');
    }
    if (prisma.variationOrder) {
        await prisma.variationOrder.deleteMany({});
        console.log('Deleted VariationOrder');
    }
    if (prisma.siteLog) {
        await prisma.siteLog.deleteMany({});
        console.log('Deleted SiteLog');
    }

    // WBS is self-referencing. Might need to delete bottom-up or just use deleteMany multiple times until 0.
    let wbsCount = await prisma.wBSItem.count();
    while (wbsCount > 0) {
      await prisma.wBSItem.deleteMany({
        where: { children: { none: {} } }
      });
      let newWbsCount = await prisma.wBSItem.count();
      if (newWbsCount === wbsCount) {
         // Break if no change
         await prisma.$executeRawUnsafe(`TRUNCATE TABLE "WBSItem" CASCADE;`);
         break;
      }
      wbsCount = newWbsCount;
    }
    console.log('Deleted WBSItem');

    // Projects, Tasks, Documents
    if (prisma.progressEntry) {
       await prisma.progressEntry.deleteMany({});
    }
    
    await prisma.task.deleteMany({});
    console.log('Deleted Task');

    await prisma.document.deleteMany({});
    console.log('Deleted Document');

    if (prisma.projectSupplier) {
      await prisma.projectSupplier.deleteMany({});
      console.log('Deleted ProjectSupplier');
    }

    if (prisma.cashBankDocument) {
      await prisma.cashBankDocument.deleteMany({});
      console.log('Deleted CashBankDocument');
    }

    await prisma.project.deleteMany({});
    console.log('Deleted Project');
    
    // We do NOT delete User, Category, LedgerAccount, Supplier (if they are master data), Material, etc.
    // Except maybe test suppliers. But without knowing which are test, we can either leave them or delete if not needed.
    // The prompt says "Supplier / Nhà cung cấp demo nếu chỉ là dữ liệu test".
    // I'll leave Supplier, LedgerAccount, Material intact as they are master data.
    
    console.log('Cleanup completed successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
