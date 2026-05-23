const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { FinancialAggregationService } = require('./services/financial-aggregation.service.ts');
// Need to require ts-node or run via npx ts-node
