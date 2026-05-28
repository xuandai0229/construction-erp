import { PrismaClient } from "../generated/prisma-client";
const prisma = new PrismaClient();

export class AdvanceReportService {
  static async getOutstandingAdvances(companyId: string) {
    const advances = await prisma.advanceRequest.findMany({
      where: {
        companyId: companyId,
        remainingAmount: { gt: 0 },
        status: { in: ["PAID", "PARTIALLY_SETTLED", "OVERDUE"] }
      },
      include: {
        project: true,
        contract: true,
        supplier: true,
        employee: true
      }
    });

    return {
      totalCount: advances.length,
      totalAmount: advances.reduce((sum: number, a: any) => sum + Number(a.amount), 0),
      outstandingAmount: advances.reduce((sum: number, a: any) => sum + Number(a.remainingAmount), 0),
      source: "database",
      simulated: false,
      items: advances
    };
  }
}
