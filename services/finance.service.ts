import { prisma } from "@/lib/prisma";

export class FinanceService {
  static async getAgingReceivables(projectId?: string) {
    const invoices = await prisma.invoice.findMany({
      where: { 
        ...(projectId && { projectId }),
        status: { not: "PAID" },
        deletedAt: null 
      },
      orderBy: { dueDate: "asc" }
    });

    const now = new Date();
    const groups = {
      notDue: 0,
      overdue1_30: 0,
      overdue31_60: 0,
      overdue61_90: 0,
      overdue90Plus: 0
    };

    invoices.forEach(inv => {
      const amount = Number(inv.remainingAmount);
      if (!inv.dueDate || inv.dueDate > now) {
        groups.notDue += amount;
      } else {
        const diffTime = Math.abs(now.getTime() - inv.dueDate.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (days <= 30) groups.overdue1_30 += amount;
        else if (days <= 60) groups.overdue31_60 += amount;
        else if (days <= 90) groups.overdue61_90 += amount;
        else groups.overdue90Plus += amount;
      }
    });

    return groups;
  }

  static async getCashflowForecast(projectId: string, months = 6) {
    // Basic logic: Revenue (Invoices) vs Costs (CostRecords/POs)
    // In a real app, this would use 'expectedPaymentDate'
    return {
      projectId,
      forecast: [] // Placeholder for complex logic
    };
  }
}
