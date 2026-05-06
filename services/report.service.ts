import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class ReportService {
  /**
   * Generates a monthly cashflow and revenue/cost report using DB-side grouping.
   * Replaces client-side logic in erpStore.ts
   */
  static async getMonthlyReport(projectId: string) {
    // 1. Group Revenues by Month
    const revenues = await prisma.revenue.groupBy({
      by: ['date'],
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });

    // 2. Group Costs by Month
    const costs = await prisma.costRecord.groupBy({
      by: ['date'],
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });

    // 3. Group Payments by Month
    const payments = await prisma.payment.groupBy({
      by: ['date'],
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });

    // Process results into Month Map (YYYY-MM)
    const months: Record<string, any> = {};
    const getMonthKey = (date: Date) => date.toISOString().substring(0, 7);

    revenues.forEach(r => {
      const m = getMonthKey(r.date);
      if (!months[m]) months[m] = this.initMonth(m);
      months[m].revenue += Number(r._sum.amount || 0);
    });

    costs.forEach(c => {
      const m = getMonthKey(c.date);
      if (!months[m]) months[m] = this.initMonth(m);
      months[m].cost += Number(c._sum.amount || 0);
      months[m].cashOut += Number(c._sum.amount || 0);
    });

    payments.forEach(p => {
      const m = getMonthKey(p.date);
      if (!months[m]) months[m] = this.initMonth(m);
      months[m].cashIn += Number(p._sum.amount || 0);
    });

    // Sort and Calculate Balances
    const sorted = Object.keys(months).sort();
    let balance = 0;
    return sorted.map(m => {
      const row = months[m];
      row.profit = round(row.revenue - row.cost);
      balance = round(balance + (row.cashIn - row.cashOut));
      row.runningBalance = balance;
      return row;
    });
  }

  /**
   * Generates an aging report for receivables and payables.
   */
  static async getAgingReport(projectId: string) {
    const now = new Date();
    
    // 1. Receivables (Invoices with remaining amount)
    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null, remainingAmount: { gt: 0 } },
      select: { id: true, issuedDate: true, remainingAmount: true, invoiceNumber: true }
    });

    // 2. Payables (Unpaid Cost Records)
    const costs = await prisma.costRecord.findMany({
      where: { projectId, deletedAt: null, status: 'unpaid' },
      select: { id: true, date: true, amount: true, supplier: true }
    });

    const getCategory = (date: Date) => {
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 30) return '0-30';
      if (diff <= 60) return '31-60';
      if (diff <= 90) return '61-90';
      return '90+';
    };

    const report = [
      ...invoices.map(i => ({
        type: 'receivable',
        category: getCategory(i.issuedDate),
        amount: Number(i.remainingAmount),
        refId: i.id,
        partner: `Khách hàng (${i.invoiceNumber || 'N/A'})`
      })),
      ...costs.map(c => ({
        type: 'payable',
        category: getCategory(c.date),
        amount: Number(c.amount),
        refId: c.id,
        partner: c.supplier || 'Nhiều người bán'
      }))
    ];

    return report;
  }

  private static initMonth(m: string) {
    return { month: m, cashIn: 0, cashOut: 0, revenue: 0, cost: 0, profit: 0, runningBalance: 0 };
  }
}
