
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  role: 'role',
  companyId: 'companyId'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt',
  description: 'description',
  ownerId: 'ownerId',
  status: 'status',
  updatedAt: 'updatedAt',
  contractValue: 'contractValue',
  endDate: 'endDate',
  startDate: 'startDate',
  totalBudget: 'totalBudget',
  deletedById: 'deletedById',
  version: 'version',
  branchId: 'branchId',
  companyId: 'companyId',
  investor: 'investor',
  projectType: 'projectType'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  projectId: 'projectId',
  categoryId: 'categoryId',
  assigneeId: 'assigneeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  dueDate: 'dueDate',
  priority: 'priority'
};

exports.Prisma.WBSItemScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  name: 'name',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  budgetAmount: 'budgetAmount',
  code: 'code',
  level: 'level',
  sortOrder: 'sortOrder',
  deletedAt: 'deletedAt',
  deletedById: 'deletedById'
};

exports.Prisma.CostRecordScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  costType: 'costType',
  amount: 'amount',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  supplier: 'supplier',
  note: 'note',
  date: 'date',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  purchaseOrderId: 'purchaseOrderId',
  requestId: 'requestId',
  deletedAt: 'deletedAt',
  approvalStatus: 'approvalStatus',
  deletedById: 'deletedById',
  version: 'version',
  netAmount: 'netAmount',
  retentionAmount: 'retentionAmount',
  retentionRate: 'retentionRate',
  vatAmount: 'vatAmount',
  vatRate: 'vatRate',
  branchId: 'branchId',
  companyId: 'companyId',
  workflowStatus: 'workflowStatus'
};

exports.Prisma.BudgetRecordScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  costType: 'costType',
  estimatedAmount: 'estimatedAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  deletedAt: 'deletedAt'
};

exports.Prisma.RevenueScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  invoiceId: 'invoiceId',
  amount: 'amount',
  date: 'date',
  status: 'status',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  deletedAt: 'deletedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  amount: 'amount',
  issuedDate: 'issuedDate',
  paidAmount: 'paidAmount',
  remainingAmount: 'remainingAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  dueDate: 'dueDate',
  invoiceNumber: 'invoiceNumber',
  note: 'note',
  status: 'status',
  contractId: 'contractId',
  requestId: 'requestId',
  deletedAt: 'deletedAt',
  version: 'version',
  certifiedProgress: 'certifiedProgress',
  retentionAmount: 'retentionAmount',
  approvalStatus: 'approvalStatus',
  deletedById: 'deletedById',
  netAmount: 'netAmount',
  retentionRate: 'retentionRate',
  vatAmount: 'vatAmount',
  vatRate: 'vatRate',
  branchId: 'branchId',
  companyId: 'companyId'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  projectId: 'projectId',
  amount: 'amount',
  date: 'date',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  requestId: 'requestId',
  deletedAt: 'deletedAt',
  approvalStatus: 'approvalStatus',
  deletedById: 'deletedById',
  version: 'version'
};

exports.Prisma.LedgerAccountScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  type: 'type',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  date: 'date',
  description: 'description',
  reference: 'reference',
  sourceType: 'sourceType',
  sourceId: 'sourceId',
  isPosted: 'isPosted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isReversed: 'isReversed',
  reversalRef: 'reversalRef',
  reversedById: 'reversedById'
};

exports.Prisma.TransactionLineScalarFieldEnum = {
  id: 'id',
  journalEntryId: 'journalEntryId',
  accountId: 'accountId',
  amount: 'amount',
  type: 'type',
  description: 'description',
  deletedAt: 'deletedAt'
};

exports.Prisma.PurchaseRequestScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  title: 'title',
  description: 'description',
  requestedBy: 'requestedBy',
  status: 'status',
  totalAmount: 'totalAmount',
  requestDate: 'requestDate',
  neededBy: 'neededBy',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  purchaseRequestId: 'purchaseRequestId',
  poNumber: 'poNumber',
  vendor: 'vendor',
  description: 'description',
  status: 'status',
  totalAmount: 'totalAmount',
  orderedDate: 'orderedDate',
  expectedDelivery: 'expectedDelivery',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.PurchaseOrderItemScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  wbsId: 'wbsId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  amount: 'amount',
  costType: 'costType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.GoodsReceiptScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  projectId: 'projectId',
  receivedDate: 'receivedDate',
  notes: 'notes',
  receivedById: 'receivedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ContractScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  contractNumber: 'contractNumber',
  title: 'title',
  description: 'description',
  contractorName: 'contractorName',
  originalValue: 'originalValue',
  currentValue: 'currentValue',
  status: 'status',
  signedDate: 'signedDate',
  startDate: 'startDate',
  endDate: 'endDate',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ContractChangeScalarFieldEnum = {
  id: 'id',
  contractId: 'contractId',
  voNumber: 'voNumber',
  title: 'title',
  description: 'description',
  changeAmount: 'changeAmount',
  approvedDate: 'approvedDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  oldData: 'oldData',
  newData: 'newData',
  timestamp: 'timestamp',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  correlationId: 'correlationId',
  reason: 'reason',
  requestId: 'requestId',
  severity: 'severity'
};

exports.Prisma.ActivityFeedScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  message: 'message',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.ApprovalRequestScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  requesterId: 'requesterId',
  entityType: 'entityType',
  entityId: 'entityId',
  requestData: 'requestData',
  status: 'status',
  reason: 'reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalStepScalarFieldEnum = {
  id: 'id',
  approvalRequestId: 'approvalRequestId',
  approverId: 'approverId',
  status: 'status',
  comment: 'comment',
  stepOrder: 'stepOrder',
  processedAt: 'processedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuthorityMatrixScalarFieldEnum = {
  id: 'id',
  role: 'role',
  maxAmount: 'maxAmount',
  entityType: 'entityType',
  projectType: 'projectType',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BOQItemScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  description: 'description',
  unit: 'unit',
  quantity: 'quantity',
  unitRate: 'unitRate',
  totalAmount: 'totalAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  status: 'status',
  version: 'version'
};

exports.Prisma.BudgetVersionScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  version: 'version',
  description: 'description',
  status: 'status',
  snapshot: 'snapshot',
  createdAt: 'createdAt',
  createdById: 'createdById'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  entityType: 'entityType',
  entityId: 'entityId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.DelegationPolicyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  rules: 'rules',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DelegationWindowScalarFieldEnum = {
  id: 'id',
  ownerId: 'ownerId',
  delegateId: 'delegateId',
  startDate: 'startDate',
  endDate: 'endDate',
  reason: 'reason',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  name: 'name',
  url: 'url',
  type: 'type',
  version: 'version',
  size: 'size',
  sourceType: 'sourceType',
  sourceId: 'sourceId',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.FiscalPeriodScalarFieldEnum = {
  id: 'id',
  isLocked: 'isLocked',
  lockedAt: 'lockedAt',
  lockedById: 'lockedById',
  closingBalance: 'closingBalance',
  reconciledAt: 'reconciledAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId',
  endDate: 'endDate',
  name: 'name',
  startDate: 'startDate',
  month: 'month'
};

exports.Prisma.JobScalarFieldEnum = {
  id: 'id',
  type: 'type',
  status: 'status',
  payload: 'payload',
  result: 'result',
  error: 'error',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  priority: 'priority',
  runAt: 'runAt',
  processedAt: 'processedAt',
  finishedAt: 'finishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  materialId: 'materialId',
  type: 'type',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  referenceId: 'referenceId',
  note: 'note',
  createdAt: 'createdAt'
};

exports.Prisma.MaterialScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  unit: 'unit',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MeasurementScalarFieldEnum = {
  id: 'id',
  progressEntryId: 'progressEntryId',
  description: 'description',
  length: 'length',
  width: 'width',
  height: 'height',
  factor: 'factor',
  quantity: 'quantity'
};

exports.Prisma.ProgressEntryScalarFieldEnum = {
  id: 'id',
  boqItemId: 'boqItemId',
  date: 'date',
  quantity: 'quantity',
  amount: 'amount',
  createdById: 'createdById',
  note: 'note',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SiteConsumptionScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  materialId: 'materialId',
  quantity: 'quantity',
  date: 'date',
  note: 'note'
};

exports.Prisma.SubcontractScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  contractorName: 'contractorName',
  contractNumber: 'contractNumber',
  title: 'title',
  status: 'status',
  totalValue: 'totalValue',
  retentionRate: 'retentionRate',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SubcontractInvoiceScalarFieldEnum = {
  id: 'id',
  subcontractId: 'subcontractId',
  invoiceNumber: 'invoiceNumber',
  amount: 'amount',
  retentionAmount: 'retentionAmount',
  netAmount: 'netAmount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubcontractItemScalarFieldEnum = {
  id: 'id',
  subcontractId: 'subcontractId',
  wbsId: 'wbsId',
  description: 'description',
  unit: 'unit',
  quantity: 'quantity',
  unitRate: 'unitRate',
  totalAmount: 'totalAmount'
};

exports.Prisma.SubcontractProgressScalarFieldEnum = {
  id: 'id',
  subcontractItemId: 'subcontractItemId',
  date: 'date',
  quantity: 'quantity',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingRecordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  module: 'module',
  status: 'status',
  score: 'score',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserMaturityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  accuracy: 'accuracy',
  maturityLevel: 'maturityLevel',
  lastAssessedAt: 'lastAssessedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VariationOrderScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  boqItemId: 'boqItemId',
  wbsId: 'wbsId',
  title: 'title',
  description: 'description',
  amount: 'amount',
  status: 'status',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById'
};

exports.Prisma.SiteLogScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  date: 'date',
  weather: 'weather',
  temperature: 'temperature',
  manpower: 'manpower',
  equipment: 'equipment',
  progress: 'progress',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById'
};

exports.Prisma.QuotationScalarFieldEnum = {
  id: 'id',
  purchaseRequestId: 'purchaseRequestId',
  vendor: 'vendor',
  totalAmount: 'totalAmount',
  leadTimeDays: 'leadTimeDays',
  validUntil: 'validUntil',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  taxCode: 'taxCode',
  address: 'address',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  address: 'address',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  severity: 'severity',
  priority: 'priority',
  entityType: 'entityType',
  entityId: 'entityId',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.DomainEventScalarFieldEnum = {
  id: 'id',
  type: 'type',
  payload: 'payload',
  metadata: 'metadata',
  status: 'status',
  error: 'error',
  projectId: 'projectId',
  timestamp: 'timestamp',
  processedAt: 'processedAt'
};

exports.Prisma.FinancialSnapshotScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  companyId: 'companyId',
  periodId: 'periodId',
  snapshotType: 'snapshotType',
  version: 'version',
  data: 'data',
  isLocked: 'isLocked',
  createdBy: 'createdBy',
  reason: 'reason',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.WorkflowDefinitionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  entityType: 'entityType',
  isActive: 'isActive',
  version: 'version',
  definition: 'definition',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SagaStateScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  sagaType: 'sagaType',
  status: 'status',
  steps: 'steps',
  context: 'context',
  currentStep: 'currentStep',
  correlationId: 'correlationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReadModelScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  data: 'data',
  version: 'version',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationUnitScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  type: 'type',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BankAccountScalarFieldEnum = {
  id: 'id',
  accountNumber: 'accountNumber',
  bankName: 'bankName',
  currency: 'currency',
  balance: 'balance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BankTransactionScalarFieldEnum = {
  id: 'id',
  bankAccountId: 'bankAccountId',
  date: 'date',
  amount: 'amount',
  description: 'description',
  reference: 'reference',
  type: 'type',
  isMatched: 'isMatched',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BankStatementScalarFieldEnum = {
  id: 'id',
  importDate: 'importDate',
  fileName: 'fileName',
  rawData: 'rawData',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentBatchScalarFieldEnum = {
  id: 'id',
  bankAccountId: 'bankAccountId',
  name: 'name',
  status: 'status',
  totalAmount: 'totalAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TreasuryApprovalScalarFieldEnum = {
  id: 'id',
  paymentBatchId: 'paymentBatchId',
  userId: 'userId',
  status: 'status',
  comment: 'comment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CashReservationScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  amount: 'amount',
  reason: 'reason',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  wbsId: 'wbsId',
  code: 'code',
  name: 'name',
  description: 'description',
  plannedStart: 'plannedStart',
  plannedFinish: 'plannedFinish',
  plannedDuration: 'plannedDuration',
  actualStart: 'actualStart',
  actualFinish: 'actualFinish',
  actualDuration: 'actualDuration',
  earlyStart: 'earlyStart',
  earlyFinish: 'earlyFinish',
  lateStart: 'lateStart',
  lateFinish: 'lateFinish',
  totalFloat: 'totalFloat',
  freeFloat: 'freeFloat',
  isCritical: 'isCritical',
  isNearCritical: 'isNearCritical',
  isMilestone: 'isMilestone',
  percentComplete: 'percentComplete',
  status: 'status',
  forecastFinish: 'forecastFinish',
  baselineId: 'baselineId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ActivityDependencyScalarFieldEnum = {
  id: 'id',
  predecessorId: 'predecessorId',
  successorId: 'successorId',
  type: 'type',
  lagDays: 'lagDays',
  createdAt: 'createdAt'
};

exports.Prisma.BaselineScheduleScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  version: 'version',
  name: 'name',
  description: 'description',
  snapshotDate: 'snapshotDate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DelayEventScalarFieldEnum = {
  id: 'id',
  activityId: 'activityId',
  projectId: 'projectId',
  category: 'category',
  description: 'description',
  delayDays: 'delayDays',
  startDate: 'startDate',
  endDate: 'endDate',
  isExcusable: 'isExcusable',
  isCompensable: 'isCompensable',
  impactCost: 'impactCost',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourcePoolScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  name: 'name',
  type: 'type',
  capacity: 'capacity',
  costPerDay: 'costPerDay',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LaborCrewScalarFieldEnum = {
  id: 'id',
  resourcePoolId: 'resourcePoolId',
  name: 'name',
  headCount: 'headCount',
  dailyRate: 'dailyRate',
  skillLevel: 'skillLevel',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CrewAssignmentScalarFieldEnum = {
  id: 'id',
  crewId: 'crewId',
  activityId: 'activityId',
  startDate: 'startDate',
  endDate: 'endDate',
  hoursPerDay: 'hoursPerDay',
  createdAt: 'createdAt'
};

exports.Prisma.EquipmentAssetScalarFieldEnum = {
  id: 'id',
  resourcePoolId: 'resourcePoolId',
  code: 'code',
  name: 'name',
  type: 'type',
  dailyRate: 'dailyRate',
  status: 'status',
  fuelCostPerDay: 'fuelCostPerDay',
  lastMaintenance: 'lastMaintenance',
  nextMaintenance: 'nextMaintenance',
  totalDowntimeDays: 'totalDowntimeDays',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EquipmentAssignmentScalarFieldEnum = {
  id: 'id',
  equipmentId: 'equipmentId',
  activityId: 'activityId',
  startDate: 'startDate',
  endDate: 'endDate',
  hoursPerDay: 'hoursPerDay',
  utilization: 'utilization',
  createdAt: 'createdAt'
};

exports.Prisma.EquipmentBreakdownScalarFieldEnum = {
  id: 'id',
  equipmentId: 'equipmentId',
  startDate: 'startDate',
  endDate: 'endDate',
  cause: 'cause',
  repairCost: 'repairCost',
  downtimeDays: 'downtimeDays',
  createdAt: 'createdAt'
};

exports.Prisma.ChangeRequestScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  description: 'description',
  type: 'type',
  status: 'status',
  costImpact: 'costImpact',
  scheduleImpact: 'scheduleImpact',
  variationOrderId: 'variationOrderId',
  requestedById: 'requestedById',
  approvedById: 'approvedById',
  approvedDate: 'approvedDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ClaimRecordScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  changeRequestId: 'changeRequestId',
  type: 'type',
  title: 'title',
  description: 'description',
  claimedAmount: 'claimedAmount',
  approvedAmount: 'approvedAmount',
  claimedDays: 'claimedDays',
  approvedDays: 'approvedDays',
  status: 'status',
  evidence: 'evidence',
  submittedDate: 'submittedDate',
  resolvedDate: 'resolvedDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.CommitmentScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  type: 'type',
  reference: 'reference',
  sourceId: 'sourceId',
  description: 'description',
  originalAmount: 'originalAmount',
  invoicedAmount: 'invoicedAmount',
  remainingAmount: 'remainingAmount',
  dueDate: 'dueDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  GROUP_DIRECTOR: 'GROUP_DIRECTOR',
  CFO: 'CFO',
  BRANCH_DIRECTOR: 'BRANCH_DIRECTOR',
  AUDITOR: 'AUDITOR'
};

exports.ProjectStatus = exports.$Enums.ProjectStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED'
};

exports.TaskStatus = exports.$Enums.TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE'
};

exports.CostType = exports.$Enums.CostType = {
  material: 'material',
  labor: 'labor',
  machine: 'machine',
  subcontract: 'subcontract',
  overhead: 'overhead',
  other: 'other'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  paid: 'paid',
  unpaid: 'unpaid'
};

exports.ApprovalStatus = exports.$Enums.ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  DRAFT: 'DRAFT'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE'
};

exports.AccountType = exports.$Enums.AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT'
};

exports.ProcurementStatus = exports.$Enums.ProcurementStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ORDERED: 'ORDERED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

exports.ContractStatus = exports.$Enums.ContractStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  AMENDED: 'AMENDED',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
};

exports.InventoryTransactionType = exports.$Enums.InventoryTransactionType = {
  RECEIPT: 'RECEIPT',
  ISSUE: 'ISSUE',
  RETURN: 'RETURN',
  ADJUST: 'ADJUST'
};

exports.SubcontractStatus = exports.$Enums.SubcontractStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
};

exports.ActivityStatus = exports.$Enums.ActivityStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED'
};

exports.DependencyType = exports.$Enums.DependencyType = {
  FS: 'FS',
  SS: 'SS',
  FF: 'FF',
  SF: 'SF'
};

exports.DelayCategory = exports.$Enums.DelayCategory = {
  WEATHER: 'WEATHER',
  PERMIT: 'PERMIT',
  INSPECTION: 'INSPECTION',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  MATERIAL_SHORTAGE: 'MATERIAL_SHORTAGE',
  EQUIPMENT_BREAKDOWN: 'EQUIPMENT_BREAKDOWN',
  DESIGN_CHANGE: 'DESIGN_CHANGE',
  CLIENT_INSTRUCTION: 'CLIENT_INSTRUCTION',
  FORCE_MAJEURE: 'FORCE_MAJEURE',
  OTHER: 'OTHER'
};

exports.ResourceType = exports.$Enums.ResourceType = {
  LABOR: 'LABOR',
  EQUIPMENT: 'EQUIPMENT',
  MATERIAL: 'MATERIAL'
};

exports.EquipmentStatus = exports.$Enums.EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  BREAKDOWN: 'BREAKDOWN',
  RETIRED: 'RETIRED'
};

exports.ChangeType = exports.$Enums.ChangeType = {
  SCOPE_CHANGE: 'SCOPE_CHANGE',
  DESIGN_CHANGE: 'DESIGN_CHANGE',
  CLIENT_INSTRUCTION: 'CLIENT_INSTRUCTION',
  SITE_CONDITION: 'SITE_CONDITION',
  REGULATORY: 'REGULATORY',
  VALUE_ENGINEERING: 'VALUE_ENGINEERING'
};

exports.ClaimType = exports.$Enums.ClaimType = {
  EXTENSION_OF_TIME: 'EXTENSION_OF_TIME',
  DELAY_COST: 'DELAY_COST',
  DISRUPTION: 'DISRUPTION',
  COST_ESCALATION: 'COST_ESCALATION',
  VARIATION: 'VARIATION',
  ACCELERATION: 'ACCELERATION'
};

exports.CommitmentType = exports.$Enums.CommitmentType = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  SUBCONTRACT: 'SUBCONTRACT',
  PAYROLL: 'PAYROLL',
  EQUIPMENT_LEASE: 'EQUIPMENT_LEASE',
  RETENTION: 'RETENTION'
};

exports.CommitmentStatus = exports.$Enums.CommitmentStatus = {
  OPEN: 'OPEN',
  PARTIALLY_INVOICED: 'PARTIALLY_INVOICED',
  FULLY_INVOICED: 'FULLY_INVOICED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Category: 'Category',
  Project: 'Project',
  Task: 'Task',
  WBSItem: 'WBSItem',
  CostRecord: 'CostRecord',
  BudgetRecord: 'BudgetRecord',
  Revenue: 'Revenue',
  Invoice: 'Invoice',
  Payment: 'Payment',
  LedgerAccount: 'LedgerAccount',
  JournalEntry: 'JournalEntry',
  TransactionLine: 'TransactionLine',
  PurchaseRequest: 'PurchaseRequest',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderItem: 'PurchaseOrderItem',
  GoodsReceipt: 'GoodsReceipt',
  Contract: 'Contract',
  ContractChange: 'ContractChange',
  AuditLog: 'AuditLog',
  ActivityFeed: 'ActivityFeed',
  ApprovalRequest: 'ApprovalRequest',
  ApprovalStep: 'ApprovalStep',
  AuthorityMatrix: 'AuthorityMatrix',
  BOQItem: 'BOQItem',
  BudgetVersion: 'BudgetVersion',
  Comment: 'Comment',
  DelegationPolicy: 'DelegationPolicy',
  DelegationWindow: 'DelegationWindow',
  Document: 'Document',
  FiscalPeriod: 'FiscalPeriod',
  Job: 'Job',
  InventoryTransaction: 'InventoryTransaction',
  Material: 'Material',
  Measurement: 'Measurement',
  ProgressEntry: 'ProgressEntry',
  SiteConsumption: 'SiteConsumption',
  Subcontract: 'Subcontract',
  SubcontractInvoice: 'SubcontractInvoice',
  SubcontractItem: 'SubcontractItem',
  SubcontractProgress: 'SubcontractProgress',
  TrainingRecord: 'TrainingRecord',
  UserMaturity: 'UserMaturity',
  VariationOrder: 'VariationOrder',
  SiteLog: 'SiteLog',
  Quotation: 'Quotation',
  Company: 'Company',
  Branch: 'Branch',
  Notification: 'Notification',
  DomainEvent: 'DomainEvent',
  FinancialSnapshot: 'FinancialSnapshot',
  WorkflowDefinition: 'WorkflowDefinition',
  SagaState: 'SagaState',
  ReadModel: 'ReadModel',
  OrganizationUnit: 'OrganizationUnit',
  BankAccount: 'BankAccount',
  BankTransaction: 'BankTransaction',
  BankStatement: 'BankStatement',
  PaymentBatch: 'PaymentBatch',
  TreasuryApproval: 'TreasuryApproval',
  CashReservation: 'CashReservation',
  Activity: 'Activity',
  ActivityDependency: 'ActivityDependency',
  BaselineSchedule: 'BaselineSchedule',
  DelayEvent: 'DelayEvent',
  ResourcePool: 'ResourcePool',
  LaborCrew: 'LaborCrew',
  CrewAssignment: 'CrewAssignment',
  EquipmentAsset: 'EquipmentAsset',
  EquipmentAssignment: 'EquipmentAssignment',
  EquipmentBreakdown: 'EquipmentBreakdown',
  ChangeRequest: 'ChangeRequest',
  ClaimRecord: 'ClaimRecord',
  Commitment: 'Commitment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
