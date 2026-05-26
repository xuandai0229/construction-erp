import { prisma } from "@/lib/prisma";
import { round, safePercent, safeDecimal } from "@/lib/math";
import { 
  ProjectFinancialSnapshot, 
  IntelligenceSnapshot,
  OperationalMetrics,
  WBSAggregationResult,
  AgingBucket,
  MonthlyReportRow
} from "@/app/types/financial";
import { WBSItem, CostRecord, BudgetRecord, InvoiceRecord, EnrichedWBSNode } from "@/app/types";
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
    const { CacheService } = await import("./cache.service");
    return CacheService.wrap(cacheKey, () => this.rebuildProjectSnapshot(projectId), 15000);
  }

  static async rebuildProjectSnapshot(projectId: string): Promise<ProjectFinancialSnapshot> {
    const startTime = Date.now();
    const [costs, invoices, project] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.invoice.findMany({ where: { projectId, deletedAt: null } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!project) {
      const { ApiError: DynamicApiError } = await import("@/lib/api-error");
      throw new DynamicApiError(404, "Không tìm thấy dự án");
    }

    // DB AGGREGATION LAYER (OOM SAFE - LEDGER DRIVEN)
    const [revCreditAgg, revDebitAgg, costDebitAgg, costCreditAgg] = await Promise.all([
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: '511' } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: 'CREDIT' },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: '511' } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: 'DEBIT' },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: '62' } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: 'DEBIT' },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: '62' } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: 'CREDIT' },
        _sum: { amount: true }
      })
    ]);

    const revenueAccrualD = safeDecimal(Number(revCreditAgg._sum?.amount || 0) - Number(revDebitAgg._sum?.amount || 0));
    const costActualD = safeDecimal(Number(costDebitAgg._sum?.amount || 0) - Number(costCreditAgg._sum?.amount || 0));

    // KPI CONTRACT: COST_EXP (Management Exposure)
    const costExposureD = costActualD;

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
    const { CacheService } = await import("./cache.service");
    return CacheService.wrap(cacheKey, async () => {
      const startTime = Date.now();
      
      // 1. Get Base Financial Snapshot
      const snapshot = await this.getProjectSnapshot(projectId);
      
      // 2. Fetch Operational Context
      const eventModel = (prisma as unknown as Record<string, { count: (args: unknown) => Promise<number>, findMany: (args: unknown) => Promise<unknown[]> }>).domainEvent;
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
      const anomalies = FinancialIntelligenceService.detectAnomalies(snapshot, costs as unknown as CostRecord[], invoices as unknown as Invoice[]);
      const insights = FinancialIntelligenceService.generateInsights(snapshot, costs as unknown as CostRecord[]);
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
    const eventModel = (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<unknown[]> }>).domainEvent;
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
      ...auditLogs.map((a: unknown) => {
        const al = a as { id: string; action: string; timestamp: Date; entity: string; userId: string };
        return {
          id: al.id,
          type: 'AUDIT',
          action: al.action,
          timestamp: al.timestamp,
          message: `${al.action} on ${al.entity}`,
          user: al.userId
        };
      }),
      ...domainEvents.map((e: unknown) => {
        const ev = e as { id: string; type: string; timestamp: Date; status: string };
        return {
          id: ev.id,
          type: 'EVENT',
          action: ev.type,
          timestamp: ev.timestamp,
          message: `System Event: ${ev.type}`,
          status: ev.status
        };
      })
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
        await import('./finance/financial-event-listener');
        // This is a bit tricky because the bus is in-memory. 
        // We can manually trigger the specific invalidation logic.
        
        if (event.projectId) {
          const { CacheService } = await import('./cache.service');
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
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`[EventSync] Failed to process event ${event.id}:`, error);
        await prisma.domainEvent.update({
          where: { id: event.id },
          data: { 
            status: "FAILED", 
            error: error?.message 
          }
        });
      }
    }

    return { processed: pendingEvents.length };
  }

  /**
   * AUTHORITATIVE AGING: Receivable Aging Report
   */
  static async getReceivableAging(projectId?: string, companyId?: string | null): Promise<AgingBucket[]> {
    const today = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        remainingAmount: { gt: 0 },
        status: { in: ["SENT", "PAID", "PARTIAL", "OVERDUE"] },
        ...(projectId && { projectId }),
        ...(companyId && { companyId })
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
  static async getPayableAging(projectId?: string, companyId?: string | null): Promise<AgingBucket[]> {
    const today = new Date();
    const costs = await prisma.costRecord.findMany({
      where: {
        deletedAt: null,
        approvalStatus: { not: "REJECTED" },
        OR: [
          { status: "unpaid" },
          { retentionAmount: { gt: 0 } }
        ],
        ...(projectId && { projectId }),
        ...(companyId && { companyId })
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
        let remaining = safeDecimal(0);
        if (cost.status === "unpaid") {
          remaining = safeDecimal(cost.amount);
        } else {
          remaining = safeDecimal(cost.retentionAmount || 0);
        }
          
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

    type SafeDecimalType = ReturnType<typeof safeDecimal>;
    const months: Record<string, { month: string; cashIn: SafeDecimalType; cashOut: SafeDecimalType; revenue: SafeDecimalType; cost: SafeDecimalType }> = {};

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
    const { CacheService } = await import("./cache.service");
    return CacheService.wrap(cacheKey, async () => {
      // SCALABLE AGGREGATION: Only select fields needed for tree calc to prevent memory freeze
      const [items, costs, budgets, invoices] = await Promise.all([
        prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
        prisma.costRecord.findMany({ 
          where: { projectId, deletedAt: null },
          select: { id: true, wbsId: true, amount: true, approvalStatus: true, workflowStatus: true }
        }),
        prisma.budgetRecord.findMany({ 
          where: { projectId }, // Hard delete model
          select: { id: true, wbsId: true, estimatedAmount: true }
        }),
        prisma.invoice.findMany({ 
          where: { projectId, deletedAt: null, approvalStatus: { not: "REJECTED" } },
          select: { id: true, wbsId: true, amount: true, approvalStatus: true, status: true }
        })
      ]);

      const wbsIds = new Set(items.map((i) => i.id));
      const approvedCosts = costs.filter((c) => c.approvalStatus !== "REJECTED" && !["VOID", "REJECTED"].includes(c.workflowStatus || ""));
      
      // Find Orphans (Costs AND Budgets not linked to active WBS)
      const orphanCosts = approvedCosts.filter((c) => !c.wbsId || !wbsIds.has(c.wbsId));
      const orphanBudgets = budgets.filter((b) => !b.wbsId || !wbsIds.has(b.wbsId));

      const orphanTotalCostD = orphanCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
      const orphanTotalBudgetD = orphanBudgets.reduce((s, b) => s.add(safeDecimal(b.estimatedAmount)), safeDecimal(0));

      const tree = ProjectFinance.calculateWBSTree(
        items as unknown as WBSItem[], 
        approvedCosts as unknown as CostRecord[], 
        budgets as unknown as BudgetRecord[],
        invoices as unknown as InvoiceRecord[],
        [] 
      );

      // Add Virtual Node if Orphans exist (Cost OR Budget)
      if (orphanTotalCostD.gt(0) || orphanTotalBudgetD.gt(0)) {
        tree.push({
          id: "virtual-unallocated",
          name: "⚠️ DỮ LIỆU CHƯA PHÂN BỔ (ORPHANS)",
          code: "UNALLOC",
          budget: orphanTotalBudgetD.toNumber(),
          actual: orphanTotalCostD.toNumber(),
          variance: orphanTotalBudgetD.sub(orphanTotalCostD).toNumber(),
          percentage: safePercent(orphanTotalCostD, orphanTotalBudgetD),
          revenue: 0,
          profit: orphanTotalCostD.negated().toNumber(),
          status: orphanTotalCostD.gt(orphanTotalBudgetD) ? 'over' : 'normal',
          level: 0,
          children: [],
          isExpanded: true,
          projectId,
          sortOrder: 999,
          budgetAmount: orphanTotalBudgetD.toNumber(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentId: null
        });
      }

      const approvedTotalD = approvedCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
      
      const totalBudgetD = tree.filter(n => n.parentId === null).reduce((s, n) => s.add(safeDecimal(n.budget)), safeDecimal(0));
      const totalActualD = tree.filter(n => n.parentId === null).reduce((s, n) => s.add(safeDecimal(n.actual)), safeDecimal(0));

      const result = {
        tree,
        stats: {
          totalBudget: totalBudgetD.toNumber(),
          totalActual: totalActualD.toNumber(),
          totalApproved: approvedTotalD.toNumber(),
          orphanTotal: orphanTotalCostD.toNumber(),
          healthScore: safePercent(approvedCosts.length - orphanCosts.length, approvedCosts.length),
          progress: safePercent(totalActualD, totalBudgetD)
        }
      };

      // PERSIST DERIVED TOTALS TO DB FOR DATA INTEGRITY (Audit compliance)
      // Run async to not block the read path
      process.nextTick(() => {
        FinancialAggregationService.syncWBSTotalsToDB(projectId, tree).catch(err => {
          console.error(`[Aggregation] Failed to sync WBS totals to DB:`, err);
        });
      });

      return result;
    }, 15000);
  }

  /**
   * Persists the rolled-up totals to the database to ensure WBSItem.budgetAmount matches actual calculations.
   */
  static async syncWBSTotalsToDB(projectId: string, tree: EnrichedWBSNode[]) {
    // Flatten tree
    const flatten = (nodes: EnrichedWBSNode[]): EnrichedWBSNode[] => {
      let flat: EnrichedWBSNode[] = [];
      for (const node of nodes) {
        flat.push(node);
        if (node.children && node.children.length > 0) {
          flat = flat.concat(flatten(node.children));
        }
      }
      return flat;
    };
    
    const allNodes = flatten(tree).filter(n => !n.id.startsWith("virtual-"));
    
    // Batch update
    const transactions = allNodes.map(node => 
      prisma.wBSItem.update({
        where: { id: node.id },
        data: { budgetAmount: node.budget }
      })
    );
    
    // Using transaction for atomicity
    await prisma.$transaction(transactions);
  }
}
