const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace('  FiscalPeriod    FiscalPeriod[]', '  FiscalPeriod    FiscalPeriod[]\n  advanceRequests AdvanceRequest[]\n  advanceSettlements AdvanceSettlement[]');
fs.writeFileSync('prisma/schema.prisma', c);
