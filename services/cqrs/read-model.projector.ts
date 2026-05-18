import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { Decimal } from "../../generated/prisma-client/runtime/library";

export class ReadModelProjector {
  /**
   * Initializes the event subscribers for projecting read models
   */
  static init() {
    LoggerService.info("[CQRS Projector] Initializing event subscribers...");
    const { eventBus } = require("../../lib/event-bus");

    // Register handlers for core domain events
    eventBus.on("InvoicePaid", async (event: any) => {
      await this.projectInvoicePayment(event);
    });

    eventBus.on("PurchaseApproved", async (event: any) => {
      await this.projectProcurementCosts(event);
    });

    eventBus.on("BudgetAdjustmentApproved", async (event: any) => {
      await this.projectBudgetChanges(event);
    });

    eventBus.on("AnomaliesDetected", async (event: any) => {
      await this.projectAnomalyInsights(event);
    });

    eventBus.on("*", async (event: any) => {
      await this.projectGenericMetrics(event);
    });
  }

  /**
   * Project Invoice Payments to CASHFLOW_SUMMARY read model
   */
  private static async projectInvoicePayment(event: any) {
    const { companyId } = event.metadata || {};
    const { entityId, amount } = event.payload || {};
    if (!companyId) return;

    LoggerService.info(`[CQRS Projector] Projecting InvoicePaid for invoice ${entityId} under tenant ${companyId}`);

    const modelId = `${companyId}:CASHFLOW_SUMMARY:global`;

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.readModel.findUnique({ where: { id: modelId } });
        const currentData = existing ? (existing.data as any) : { totalInvoiced: 0, totalPaid: 0, cashflowTrend: [] };

        currentData.totalPaid += Number(amount || 0);
        currentData.cashflowTrend.push({
          date: new Date().toISOString(),
          amount: Number(amount || 0),
          type: "INCOME"
        });

        await tx.readModel.upsert({
          where: { id: modelId },
          update: { data: currentData, version: { increment: 1 } },
          create: {
            id: modelId,
            companyId,
            type: "CASHFLOW_SUMMARY",
            data: currentData,
            version: 1
          }
        });
      });
    } catch (err) {
      LoggerService.error("[CQRS Projector] Error projecting invoice payment:", { error: err });
    }
  }

  /**
   * Project Approved Procurements to CASHFLOW_SUMMARY and PROJECT_INSIGHTS read models
   */
  private static async projectProcurementCosts(event: any) {
    const { companyId } = event.metadata || {};
    const { entityId } = event.payload || {};
    if (!companyId) return;

    try {
      // Fetch details of purchase request
      const pr = await prisma.purchaseRequest.findUnique({
        where: { id: entityId }
      });
      if (!pr) return;

      const modelId = `${companyId}:PROJECT_INSIGHTS:${pr.projectId}`;

      await prisma.$transaction(async (tx) => {
        const existing = await tx.readModel.findUnique({ where: { id: modelId } });
        const currentData = existing ? (existing.data as any) : { totalCommittedCosts: 0, budgetVariance: 0, prCount: 0 };

        currentData.totalCommittedCosts += Number(pr.totalAmount || 0);
        currentData.prCount += 1;

        await tx.readModel.upsert({
          where: { id: modelId },
          update: { data: currentData, version: { increment: 1 } },
          create: {
            id: modelId,
            companyId,
            type: "PROJECT_INSIGHTS",
            data: currentData,
            version: 1
          }
        });
      });
    } catch (err) {
      LoggerService.error("[CQRS Projector] Error projecting procurement cost:", { error: err });
    }
  }

  /**
   * Project Budget Adjustments
   */
  private static async projectBudgetChanges(event: any) {
    const { companyId } = event.metadata || {};
    const { entityId } = event.payload || {};
    if (!companyId) return;

    try {
      const vo = await prisma.variationOrder.findUnique({ where: { id: entityId } });
      if (!vo) return;

      const modelId = `${companyId}:PROJECT_INSIGHTS:${vo.projectId}`;

      await prisma.$transaction(async (tx) => {
        const existing = await tx.readModel.findUnique({ where: { id: modelId } });
        const currentData = existing ? (existing.data as any) : { totalCommittedCosts: 0, budgetVariance: 0, budgetAdjustments: 0 };

        currentData.budgetAdjustments += Number(vo.amount || 0);
        currentData.budgetVariance += Number(vo.amount || 0);

        await tx.readModel.upsert({
          where: { id: modelId },
          update: { data: currentData, version: { increment: 1 } },
          create: {
            id: modelId,
            companyId,
            type: "PROJECT_INSIGHTS",
            data: currentData,
            version: 1
          }
        });
      });
    } catch (err) {
      LoggerService.error("[CQRS Projector] Error projecting budget changes:", { error: err });
    }
  }

  /**
   * Project Anomaly Insights to EXECUTIVE_KPI read model
   */
  private static async projectAnomalyInsights(event: any) {
    const { companyId } = event.metadata || {};
    const { projectId, anomalyCount, riskScore } = event.payload || {};
    if (!companyId) return;

    const modelId = `${companyId}:EXECUTIVE_KPI:global`;

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.readModel.findUnique({ where: { id: modelId } });
        const currentData = existing ? (existing.data as any) : { anomaliesCount: 0, highestRiskScore: 0, projectRisks: {} };

        currentData.anomaliesCount += Number(anomalyCount || 1);
        currentData.highestRiskScore = Math.max(currentData.highestRiskScore, Number(riskScore || 0));
        if (projectId) {
          currentData.projectRisks[projectId] = Number(riskScore || 0);
        }

        await tx.readModel.upsert({
          where: { id: modelId },
          update: { data: currentData, version: { increment: 1 } },
          create: {
            id: modelId,
            companyId,
            type: "EXECUTIVE_KPI",
            data: currentData,
            version: 1
          }
        });
      });
    } catch (err) {
      LoggerService.error("[CQRS Projector] Error projecting anomaly insights:", { error: err });
    }
  }

  /**
   * Generic event counters
   */
  private static async projectGenericMetrics(event: any) {
    const { companyId } = event.metadata || {};
    if (!companyId) return;

    const modelId = `${companyId}:EXECUTIVE_KPI:global`;

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.readModel.findUnique({ where: { id: modelId } });
        const currentData = existing ? (existing.data as any) : { eventCounters: {} };

        if (!currentData.eventCounters) currentData.eventCounters = {};
        currentData.eventCounters[event.type] = (currentData.eventCounters[event.type] || 0) + 1;

        await tx.readModel.upsert({
          where: { id: modelId },
          update: { data: currentData, version: { increment: 1 } },
          create: {
            id: modelId,
            companyId,
            type: "EXECUTIVE_KPI",
            data: currentData,
            version: 1
          }
        });
      });
    } catch (err) {
      // Silently skip on background projections
    }
  }

  /**
   * Rebuilds/Replays all read models for a specific company from source databases
   */
  static async rebuild(companyId: string) {
    LoggerService.warn(`[CQRS Projector] REBUILDING all denormalized read models for tenant company ${companyId}...`);

    try {
      // 1. Rebuild CASHFLOW_SUMMARY
      const invoices = await prisma.invoice.findMany({
        where: { companyId, approvalStatus: "APPROVED", deletedAt: null }
      });
      const payments = await prisma.payment.findMany({
        where: { invoice: { companyId }, approvalStatus: "APPROVED", deletedAt: null }
      });

      const cashflowData = {
        totalInvoiced: invoices.reduce((sum, item) => sum + Number(item.amount), 0),
        totalPaid: payments.reduce((sum, item) => sum + Number(item.amount), 0),
        cashflowTrend: payments.map(p => ({
          date: p.date.toISOString(),
          amount: Number(p.amount),
          type: "INCOME"
        }))
      };

      await prisma.readModel.upsert({
        where: { id: `${companyId}:CASHFLOW_SUMMARY:global` },
        update: { data: cashflowData, version: { increment: 1 } },
        create: {
          id: `${companyId}:CASHFLOW_SUMMARY:global`,
          companyId,
          type: "CASHFLOW_SUMMARY",
          data: cashflowData,
          version: 1
        }
      });

      // 2. Rebuild PROJECT_INSIGHTS for each project
      const projects = await prisma.project.findMany({
        where: { companyId, deletedAt: null }
      });

      for (const proj of projects) {
        const prs = await prisma.purchaseRequest.findMany({
          where: { projectId: proj.id, status: "APPROVED", deletedAt: null }
        });
        const vos = await prisma.variationOrder.findMany({
          where: { projectId: proj.id, status: "APPROVED" }
        });

        const projectData = {
          totalCommittedCosts: prs.reduce((sum, pr) => sum + Number(pr.totalAmount), 0),
          prCount: prs.length,
          budgetAdjustments: vos.reduce((sum, vo) => sum + Number(vo.amount), 0),
          budgetVariance: vos.reduce((sum, vo) => sum + Number(vo.amount), 0)
        };

        await prisma.readModel.upsert({
          where: { id: `${companyId}:PROJECT_INSIGHTS:${proj.id}` },
          update: { data: projectData, version: { increment: 1 } },
          create: {
            id: `${companyId}:PROJECT_INSIGHTS:${proj.id}`,
            companyId,
            type: "PROJECT_INSIGHTS",
            data: projectData,
            version: 1
          }
        });
      }

      LoggerService.info(`[CQRS Projector] Successfully completed read model rebuild for tenant company ${companyId}`);
    } catch (err) {
      LoggerService.error(`[CQRS Projector] Read model rebuild failed for tenant ${companyId}:`, { error: err });
      throw err;
    }
  }
}
