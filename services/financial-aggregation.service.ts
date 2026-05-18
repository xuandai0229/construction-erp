import { prisma } from "@/lib/prisma";
import { round, safeMoney, safeDivide, safePercent, safeDecimal } from "@/lib/math";
import { 
  ProjectFinancialSnapshot, 
  AggregationStatus,
  IntelligenceSnapshot,
  OperationalMetrics,
  EnhancedFinancialAnomaly,
  WBSAggregationResult,
  AgingBucket,
  MonthlyReportRow,
  KPIContract
} from "@/app/types/financial";
import { WBSItem, CostRecord, BudgetRecord } from "@/app/types";
import { Invoice } from "../generated/prisma-client";
import { ApiError } from "@/lib/api-error";
import { ProjectFinance } from "./finance/projectFinance";
import { MetricsService } from "./metrics.service";
import { FinancialIntelligenceService } from "./financial-intelligence.service";

/**
 * FINANCIAL AGGREGATION SERVICE (The Single Source of Truth)
 * 
 * This service is the final authority for all financial calculations in the ERP.
 * It enforces the separation between Accounting Reality and Management Exposure.
 */
export class FinancialAggregationService {
  
  /**
   * PERIOD CLOSE GOVERNANCE: Verifies if a date falls within a locked fiscal period.
   * Prevents retrospective changes to locked accounting eras.
   */
  static async validateTransactionDate(date: Date) {
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
    const period = await prisma.fiscalPeriod.findUnique({
      where: { month: monthStr }
    });

    if (period && period.isLocked) {
      throw new ApiError(400, `LỖI NGHIỆP VỤ: Kỳ kế toán ${monthStr} đã khóa. Không thể thực hiện thay đổi hạch toán.`, {
        isPeriodLocked: true,
        month: monthStr
      });
    }
    return true;
  }
  
  /**
   * Generates a comprehensive financial snapshot for a project.
   * This is the master method for Dashboard and Executive Cockpit.
   * Hardened with persistent caching and collision-safe versioning.
   */
  static async getProjectSnapshot(projectId: string): Promise<ProjectFinancialSnapshot> {
    const cacheKey = `aggregation:${projectId}:snapshot`;
    const { CacheService } = require("./cache.service");
    return CacheService.wrap(cacheKey, () => this.rebuildProjectSnapshot(projectId), 15000);
  }

  static async rebuildProjectSnapshot(projectId: string): Promise<ProjectFinancialSnapshot> {
    const startTime = Date.now();
    const [costs, invoices, budgets, project] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.invoice.findMany({ where: { projectId, deletedAt: null } }),
      prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!project) throw new Error("Project not found");

    // KPI CONTRACT: COST_ACT (Accounting Reality)
    const costActualD = costs
      .filter(c => !["VOID", "REJECTED"].includes(c.workflowStatus) && c.approvalStatus !== "REJECTED")
      .reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));

    // KPI CONTRACT: COST_EXP (Management Exposure)
    const costExposureD = costs
      .filter(c => !["VOID", "REJECTED"].includes(c.workflowStatus) && c.approvalStatus !== "REJECTED")
      .reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));

    // KPI CONTRACT: REV_ACC (Accrual Revenue)
    const revenueAccrualD = invoices
      .filter(i => i.approvalStatus !== "REJECTED" && ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE"].includes(i.status))
      .reduce((s, i) => s.add(safeDecimal(i.amount)), safeDecimal(0));

    // KPI CONTRACT: ALLOCATION_HEALTH
    const wbsData = await prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, select: { id: true } });
    const wbsIds = new Set(wbsData.map(w => w.id));
    const unallocatedCosts = costs.filter(c => !c.wbsId || !wbsIds.has(c.wbsId));
    const unallocatedAmountD = unallocatedCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
    const allocationHealth = safePercent(costs.length - unallocatedCosts.length, costs.length || 100);

    // BUDGET UTILIZATION
    const totalBudgetD = safeDecimal(project.totalBudget);
    const budgetUtilization = safePercent(costExposureD, totalBudgetD);

    // PROFITABILITY
    const profitRealizedD = revenueAccrualD.sub(costActualD);
    const profitMargin = safePercent(profitRealizedD, revenueAccrualD);

    const snapshot: ProjectFinancialSnapshot = {
      projectId,
      timestamp: new Date(),
      version: `V-${costs.length}-${invoices.length}`, // Deterministic versioning
      reality: {
        totalRevenue: revenueAccrualD.toNumber(),
        actualCost: costActualD.toNumber(),
        grossProfit: profitRealizedD.toNumber(),
        grossMargin: profitMargin,
      },
      exposure: {
        totalCostExposure: costExposureD.toNumber(),
        pendingCost: costExposureD.sub(costActualD).toNumber(),
        budgetUtilization,
        isOverBudget: costExposureD.gt(totalBudgetD) && totalBudgetD.gt(0),
      },
      integrity: {
        unallocatedAmount: unallocatedAmountD.toNumber(),
        allocationHealth,
        orphanCount: unallocatedCosts.length,
      }
    };

    MetricsService.recordLatency(Date.now() - startTime);

    return snapshot;
  }

  /**
   * EXECUTIVE INTELLIGENCE SNAPSHOT
   * Master entry point for the Decision Support Platform.
   */
  static async getIntelligenceSnapshot(projectId: string): Promise<IntelligenceSnapshot> {
    const cacheKey = `aggregation:${projectId}:intelligence`;
    const { CacheService } = require("./cache.service");
    return CacheService.wrap(cacheKey, async () => {
      const startTime = Date.now();
      
      // 1. Get Base Financial Snapshot
      const snapshot = await this.getProjectSnapshot(projectId);
      
      // 2. Fetch Operational Context
      const eventModel = (prisma as any).domainEvent;
      const [costs, invoices, pendingEvents, failedEvents] = await Promise.all([
        prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
        prisma.invoice.findMany({ where: { projectId, deletedAt: null } }),
        eventModel ? eventModel.count({ where: { projectId, status: "PENDING" } }) : Promise.resolve(0),
        eventModel ? eventModel.count({ where: { projectId, status: "FAILED" } }) : Promise.resolve(0)
      ]);

      // 3. Operational Performance Metrics
      const metrics = MetricsService.getMetrics();
      const operational: OperationalMetrics = {
        rebuildDurationMs: Date.now() - startTime,
        cacheHitRatio: metrics.cacheHitRatio,
        pendingEventCount: pendingEvents,
        failedEventCount: failedEvents,
        lastSnapshotFreshness: 0,
        reconciliationMismatchCount: 0
      };

      // 4. Run Decision Intelligence Engine
      const anomalies = FinancialIntelligenceService.detectAnomalies(snapshot, costs as any, invoices as any);
      const insights = FinancialIntelligenceService.generateInsights(snapshot, costs as any);
      const health = FinancialIntelligenceService.calculateHealthScore(snapshot, operational, anomalies);
      const trends = FinancialIntelligenceService.generateTrends(snapshot);

      return {
        ...snapshot,
        anomalies,
        insights,
        health,
        operational,
        trends
      };
    }, 15000);
  }

  /**
   * OPERATIONAL TIMELINE
   * Fetches the chronological history of financial events, adjustments, and anomalies.
   */
  static async getOperationalTimeline(projectId: string, limit = 20) {
    const eventModel = (prisma as any).domainEvent;
    const [auditLogs, domainEvents] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entity: { in: ["CostRecord", "Invoice", "BudgetRecord", "FiscalPeriod"] }, ...(projectId && { entityId: projectId }) },
        orderBy: { timestamp: 'desc' },
        take: limit
      }),
      eventModel ? eventModel.findMany({
        where: { projectId },
        orderBy: { timestamp: 'desc' },
        take: limit
      }) : Promise.resolve([])
    ]);

    const timeline = [
      ...auditLogs.map((a: any) => ({
        id: a.id,
        type: 'AUDIT',
        action: a.action,
        timestamp: a.timestamp,
        message: `${a.action} on ${a.entity}`,
        user: a.userId
      })),
      ...domainEvents.map((e: any) => ({
        id: e.id,
        type: 'EVENT',
        action: e.type,
        timestamp: e.timestamp,
        message: `System Event: ${e.type}`,
        status: e.status
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return timeline.slice(0, limit);
  }

  /**
   * EVENT RELIABILITY: Processes pending domain events from the outbox.
   * This ensures eventual consistency even if in-memory events are lost.
   */
  static async syncOutbox(limit = 50) {
    const pendingEvents = await prisma.domainEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { timestamp: 'asc' },
      take: limit
    });

    if (pendingEvents.length === 0) return { processed: 0 };

    console.log(`[EventSync] Processing ${pendingEvents.length} events...`);

    for (const event of pendingEvents) {
      try {
        // Here we would re-trigger the listeners or perform idempotent actions
        // For now, our listeners only invalidate caches, which is safe to repeat.
        const { initializeFinancialListeners } = require('./finance/financial-event-listener');
        // This is a bit tricky because the bus is in-memory. 
        // We can manually trigger the specific invalidation logic.
        
        if (event.projectId) {
          const { CacheService } = require('./cache.service');
          await CacheService.invalidatePrefix(`reporting:${event.projectId}`);
          await CacheService.invalidatePrefix(`aggregation:${event.projectId}`);
        }

        await prisma.domainEvent.update({
          where: { id: event.id },
          data: { 
            status: "PROCESSED", 
            processedAt: new Date() 
          }
        });
      } catch (err: any) {
        console.error(`[EventSync] Failed to process event ${event.id}:`, err);
        await prisma.domainEvent.update({
          where: { id: event.id },
          data: { 
            status: "FAILED", 
            error: err?.message 
          }
        });
      }
    }

    return { processed: pendingEvents.length };
  }

  /**
   * AUTHORITATIVE AGING: Receivable Aging Report
   */
  static async getReceivableAging(projectId?: string): Promise<AgingBucket[]> {
    const today = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        remainingAmount: { gt: 0 },
        status: { in: ["SENT", "PAID", "PARTIAL", "OVERDUE"] },
        ...(projectId && { projectId })
      }
    });

    const buckets = [
      { bucket: "0-30 days", amount: safeDecimal(0), count: 0, minDays: 0, maxDays: 30 },
      { bucket: "31-60 days", amount: safeDecimal(0), count: 0, minDays: 31, maxDays: 60 },
      { bucket: "61-90 days", amount: safeDecimal(0), count: 0, minDays: 61, maxDays: 90 },
      { bucket: "90+ days", amount: safeDecimal(0), count: 0, minDays: 91, maxDays: 9999 }
    ];

    for (const inv of invoices) {
      const dueDate = inv.dueDate || inv.issuedDate;
      const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = today > dueDate;

      if (!isOverdue) continue;

      const bucket = buckets.find(b => diffDays >= b.minDays && diffDays <= b.maxDays);
      if (bucket) {
        bucket.amount = bucket.amount.add(safeDecimal(inv.remainingAmount));
        bucket.count++;
      }
    }

    return buckets.map(({ bucket, amount, count }) => ({ 
      bucket, 
      amount: round(amount.toNumber()), 
      count 
    }));
  }

  /**
   * AUTHORITATIVE AGING: Payable Aging Report
   */
  static async getPayableAging(projectId?: string): Promise<AgingBucket[]> {
    const today = new Date();
    const costs = await prisma.costRecord.findMany({
      where: {
        deletedAt: null,
        status: "unpaid",
        approvalStatus: { not: "REJECTED" },
        ...(projectId && { projectId })
      }
    });

    const buckets = [
      { bucket: "0-30 days", amount: safeDecimal(0), count: 0, minDays: 0, maxDays: 30 },
      { bucket: "31-60 days", amount: safeDecimal(0), count: 0, minDays: 31, maxDays: 60 },
      { bucket: "61-90 days", amount: safeDecimal(0), count: 0, minDays: 61, maxDays: 90 },
      { bucket: "90+ days", amount: safeDecimal(0), count: 0, minDays: 91, maxDays: 9999 }
    ];

    for (const cost of costs) {
      const diffTime = Math.max(0, today.getTime() - cost.date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const bucket = buckets.find(b => diffDays >= b.minDays && diffDays <= b.maxDays);
      if (bucket) {
        // Handle partial payment if applicable (assuming cost.amount is total and we might need a remaining amount field)
        // If remainingAmount doesn't exist, we use amount (for unpaid)
        const remaining = (cost as any).remainingAmount !== undefined 
          ? safeDecimal((cost as any).remainingAmount) 
          : safeDecimal(cost.amount);
          
        bucket.amount = bucket.amount.add(remaining);
        bucket.count++;
      }
    }

    return buckets.map(({ bucket, amount, count }) => ({ 
      bucket, 
      amount: round(amount.toNumber()), 
      count 
    }));
  }

  /**
   * AUTHORITATIVE MONTHLY: Monthly Financial Performance
   */
  static async getProjectMonthlyReport(projectId: string): Promise<MonthlyReportRow[]> {
    const [costs, invoices, payments] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null, approvalStatus: { not: "REJECTED" } } }),
      prisma.invoice.findMany({ where: { projectId, deletedAt: null, approvalStatus: { not: "REJECTED" } } }),
      prisma.payment.findMany({ where: { projectId, deletedAt: null, approvalStatus: { not: "REJECTED" } } }),
    ]);

    const months: Record<string, any> = {};

    const getMonth = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const ensureMonth = (m: string) => {
      if (!months[m]) {
        months[m] = { 
          month: m, 
          cashIn: safeDecimal(0), 
          cashOut: safeDecimal(0), 
          revenue: safeDecimal(0), 
          cost: safeDecimal(0) 
        };
      }
    };

    // Accrual logic
    invoices.forEach(i => {
      const m = getMonth(i.issuedDate);
      ensureMonth(m);
      months[m].revenue = months[m].revenue.add(safeDecimal(i.amount));
    });

    costs.forEach(c => {
      const m = getMonth(c.date);
      ensureMonth(m);
      months[m].cost = months[m].cost.add(safeDecimal(c.amount));
    });

    // Cashflow logic
    payments.forEach(p => {
      const m = getMonth(p.date);
      ensureMonth(m);
      months[m].cashIn = months[m].cashIn.add(safeDecimal(p.amount));
    });

    costs.filter(c => c.status === 'paid').forEach(c => {
      const m = getMonth(c.updatedAt || c.date);
      ensureMonth(m);
      months[m].cashOut = months[m].cashOut.add(safeDecimal(c.amount));
    });

    const sortedMonths = Object.keys(months).sort();
    let balance = safeDecimal(0);
    
    return sortedMonths.map(m => {
      const data = months[m];
      const profit = data.revenue.sub(data.cost);
      balance = balance.add(data.cashIn.sub(data.cashOut));

      return {
        month: m,
        cashIn: round(data.cashIn.toNumber()),
        cashOut: round(data.cashOut.toNumber()),
        revenue: round(data.revenue.toNumber()),
        cost: round(data.cost.toNumber()),
        profit: round(profit.toNumber()),
        runningBalance: round(balance.toNumber())
      };
    });
  }

  /**
   * AUTHORITATIVE FORECAST: Cash Flow Forecast
   */
  static async getCashFlowForecast(projectId?: string) {
    const invoices = await prisma.invoice.findMany({
      where: { 
        deletedAt: null, 
        remainingAmount: { gt: 0 }, 
        status: { in: ["SENT", "PAID", "PARTIAL", "OVERDUE"] },
        ...(projectId && { projectId }) 
      },
      orderBy: { dueDate: 'asc' }
    });

    const expectedCollections = invoices.map(i => ({
      date: i.dueDate || i.issuedDate,
      amount: round(safeDecimal(i.remainingAmount).toNumber()),
      source: i.invoiceNumber || i.id
    }));

    const totalExpected = expectedCollections.reduce(
      (s, i) => s.add(safeDecimal(i.amount)), 
      safeDecimal(0)
    );

    return {
      expectedCollections,
      totalExpected: round(totalExpected.toNumber())
    };
  }

  /**
   * PERIOD CLOSE GOVERNANCE: Returns all months that have been locked.
   */
  static async getLockedMonths(): Promise<string[]> {
    const periods = await prisma.fiscalPeriod.findMany({
      where: { isLocked: true },
      select: { month: true }
    });
    return periods.map(p => p.month);
  }

  /**
   * PERIOD CLOSE GOVERNANCE: Toggles the lock status for a month.
   */
  static async toggleFiscalPeriod(month: string, userId?: string) {
    const period = await prisma.fiscalPeriod.findUnique({ where: { month } });
    
    const nextStatus = !period?.isLocked;
    
    const result = await prisma.fiscalPeriod.upsert({
      where: { month },
      create: { 
        month, 
        isLocked: true, 
        lockedById: userId, 
        lockedAt: new Date() 
      },
      update: { 
        isLocked: nextStatus,
        lockedById: nextStatus ? userId : null,
        lockedAt: nextStatus ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        action: nextStatus ? "LOCK_PERIOD" : "UNLOCK_PERIOD",
        entity: "FiscalPeriod",
        entityId: month,
        userId: userId,
        newData: result
      }
    });

    return result;
  }

  /**
   * Aggregates WBS data ensuring the "Unallocated" virtual node is included.
   * This guarantees Total WBS Actual == Accounting Reality Actual.
   */
  static async getWBSAggregation(projectId: string): Promise<WBSAggregationResult> {
    const cacheKey = `wbs:${projectId}:aggregation`;
    const { CacheService } = require("./cache.service");
    return CacheService.wrap(cacheKey, async () => {
      const [items, costs, budgets] = await Promise.all([
        prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
        prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
        prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } })
      ]);

      const wbsIds = new Set(items.map(i => i.id));
      const approvedCosts = costs.filter(c => c.approvalStatus !== "REJECTED" && !["VOID", "REJECTED"].includes(c.workflowStatus));
      
      // Find Orphans (Costs not linked to active WBS)
      const orphanCosts = approvedCosts.filter(c => !c.wbsId || !wbsIds.has(c.wbsId));
      const orphanTotalD = orphanCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));

      // Initial Tree (using legacy ProjectFinance for rollup)
      const tree = ProjectFinance.calculateWBSTree(
        items as unknown as WBSItem[], 
        approvedCosts as unknown as CostRecord[], 
        budgets as unknown as BudgetRecord[]
      );

      // Add Virtual Node if Orphans exist
      if (orphanTotalD.gt(0)) {
        tree.push({
          id: "virtual-unallocated",
          name: "⚠️ CHI PHÍ CHƯA PHÂN BỔ (ORPHANS)",
          code: "UNALLOC",
          budget: 0,
          actual: orphanTotalD.toNumber(),
          variance: orphanTotalD.negated().toNumber(),
          percentage: 100,
          revenue: 0,
          profit: orphanTotalD.negated().toNumber(),
          status: 'over',
          level: 0,
          children: [],
          isExpanded: true,
          projectId,
          sortOrder: 999,
          budgetAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentId: null
        });
      }

      const approvedTotalD = approvedCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
      
      // Authoritative totals from tree roots
      const totalBudgetD = tree.filter(n => n.parentId === null).reduce((s, n) => s.add(safeDecimal(n.budget)), safeDecimal(0));
      const totalActualD = tree.filter(n => n.parentId === null).reduce((s, n) => s.add(safeDecimal(n.actual)), safeDecimal(0));

      return {
        tree,
        stats: {
          totalBudget: totalBudgetD.toNumber(),
          totalActual: totalActualD.toNumber(),
          totalApproved: approvedTotalD.toNumber(),
          orphanTotal: orphanTotalD.toNumber(),
          healthScore: safePercent(approvedCosts.length - orphanCosts.length, approvedCosts.length),
          progress: safePercent(totalActualD, totalBudgetD)
        }
      };
    }, 15000);
  }
}
