const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace('  ActivityFeed                                       ActivityFeed[]', '  ActivityFeed                                       ActivityFeed[]\n  advanceEmployee AdvanceRequest[] @relation("AdvanceEmployee")\n  advanceRequester AdvanceRequest[] @relation("AdvanceRequester")\n  advanceApprover AdvanceRequest[] @relation("AdvanceApprover")\n  settlementCreator AdvanceSettlement[] @relation("SettlementCreator")\n  settlementApprover AdvanceSettlement[] @relation("SettlementApprover")');
c = c.replace('  ActivityFeed           ActivityFeed[]', '  ActivityFeed           ActivityFeed[]\n  advanceRequests AdvanceRequest[]');
c = c.replace('  fiscalPeriods FiscalPeriod[]', '  fiscalPeriods FiscalPeriod[]\n  advanceRequests AdvanceRequest[]\n  advanceSettlements AdvanceSettlement[]');
c = c.replace('  contracts      Contract[]', '  contracts      Contract[]\n  advanceRequests AdvanceRequest[]');
c = c.replace('  allocations       PaymentAllocation[]', '  allocations       PaymentAllocation[]\n  advanceSettlements AdvanceSettlement[]');
c = c.replace('  paymentPlans   PaymentPlan[]', '  paymentPlans   PaymentPlan[]\n  advanceRequests AdvanceRequest[]');
fs.writeFileSync('prisma/schema.prisma', c);
