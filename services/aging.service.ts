import { prisma } from "@/lib/prisma";

export class AgingService {
  /**
   * Tính toán AR Aging (Công nợ phải thu)
   * Phân loại: Current, 1-30, 31-60, 61-90, > 90
   */
  static async getARAging(projectId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        projectId,
        deletedAt: null,
        status: { not: "PAID" },
        remainingAmount: { gt: 0 }
      },
      select: {
        id: true,
        remainingAmount: true,
        dueDate: true,
        issuedDate: true
      }
    });

    const now = new Date();
    const buckets = {
      current: 0,
      days_1_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      over_90: 0,
      total: 0
    };

    invoices.forEach(inv => {
      const remaining = Number(inv.remainingAmount);
      const targetDate = inv.dueDate || new Date(inv.issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const diffTime = now.getTime() - targetDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      buckets.total += remaining;

      if (diffDays <= 0) {
        buckets.current += remaining;
      } else if (diffDays <= 30) {
        buckets.days_1_30 += remaining;
      } else if (diffDays <= 60) {
        buckets.days_31_60 += remaining;
      } else if (diffDays <= 90) {
        buckets.days_61_90 += remaining;
      } else {
        buckets.over_90 += remaining;
      }
    });

    const overdueTotal = buckets.total - buckets.current;
    
    return {
      buckets,
      metrics: {
        overduePercentage: buckets.total > 0 ? (overdueTotal / buckets.total) * 100 : 0,
        riskExposure: buckets.days_61_90 + buckets.over_90,
        collectionPriority: buckets.over_90 > 0 ? "CRITICAL" : (buckets.days_61_90 > 0 ? "HIGH" : "NORMAL")
      }
    };
  }

  /**
   * Tính toán AP Aging (Công nợ phải trả)
   * Phân loại: Due Soon, Overdue, Critical Overdue
   */
  static async getAPAging(projectId: string) {
    const costs = await prisma.costRecord.findMany({
      where: {
        projectId,
        deletedAt: null,
        status: { not: "paid" }, // Temporary before VendorPayment fully takes over UI
        amount: { gt: 0 }
      },
      include: {
        vendorPayments: {
          where: { deletedAt: null, isReversed: false }
        }
      }
    });

    const now = new Date();
    const buckets = {
      dueSoon: 0, // <= 7 days
      overdue: 0, // > 0 days
      criticalOverdue: 0, // > 30 days
      totalRemaining: 0
    };

    costs.forEach(cost => {
      const totalPaid = cost.vendorPayments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Number(cost.amount) - totalPaid;
      
      if (remaining <= 0) return;
      buckets.totalRemaining += remaining;

      // Assuming AP terms are 30 days from date
      const dueDate = new Date(cost.date.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 30) {
        buckets.criticalOverdue += remaining;
        buckets.overdue += remaining;
      } else if (diffDays > 0) {
        buckets.overdue += remaining;
      } else if (diffDays > -7) {
        buckets.dueSoon += remaining;
      }
    });

    return {
      buckets,
      metrics: {
        overduePercentage: buckets.totalRemaining > 0 ? (buckets.overdue / buckets.totalRemaining) * 100 : 0,
        criticalExposure: buckets.criticalOverdue
      }
    };
  }
}
