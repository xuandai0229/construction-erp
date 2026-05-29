import { prisma } from "@/lib/prisma";
import { TaxInvoiceType, TaxInvoiceStatus } from "@/generated/prisma-client";

export class TaxReportService {
  /**
   * Generates a VAT summary report: output VAT, input VAT, and net VAT payable or refundable.
   */
  static async getVatSummary(companyId: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      companyId,
      status: TaxInvoiceStatus.POSTED,
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.invoiceDate = {};
      if (startDate) {
        whereClause.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.invoiceDate.lte = end;
      }
    }

    const invoices = await prisma.taxInvoice.findMany({
      where: whereClause,
      select: {
        invoiceType: true,
        netAmount: true,
        vatAmount: true,
        grossAmount: true,
      },
    });

    let totalSalesNet = 0;
    let totalSalesVat = 0;
    let totalPurchasesNet = 0;
    let totalPurchasesVat = 0;

    for (const inv of invoices) {
      const net = Number(inv.netAmount || 0);
      const vat = Number(inv.vatAmount || 0);

      if (inv.invoiceType === TaxInvoiceType.OUTBOUND) {
        totalSalesNet += net;
        totalSalesVat += vat;
      } else {
        totalPurchasesNet += net;
        totalPurchasesVat += vat;
      }
    }

    const vatPayable = Math.max(0, totalSalesVat - totalPurchasesVat);
    const vatRefundable = Math.max(0, totalPurchasesVat - totalSalesVat);

    return {
      totalSalesNet,
      totalSalesVat,
      totalPurchasesNet,
      totalPurchasesVat,
      vatPayable,
      vatRefundable,
      invoiceCount: invoices.length,
    };
  }

  /**
   * Generates the Sales VAT Book (Bảng kê hóa đơn bán ra - Mẫu 01-1/GTGT)
   */
  static async getVatSales(companyId: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      companyId,
      invoiceType: TaxInvoiceType.OUTBOUND,
      status: TaxInvoiceStatus.POSTED,
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.invoiceDate = {};
      if (startDate) {
        whereClause.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.invoiceDate.lte = end;
      }
    }

    return prisma.taxInvoice.findMany({
      where: whereClause,
      orderBy: { invoiceDate: "asc" },
      include: {
        project: { select: { name: true } },
        contract: { select: { contractNumber: true } },
      },
    });
  }

  /**
   * Generates the Purchases VAT Book (Bảng kê hóa đơn mua vào - Mẫu 01-2/GTGT)
   */
  static async getVatPurchases(companyId: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      companyId,
      invoiceType: TaxInvoiceType.INBOUND,
      status: TaxInvoiceStatus.POSTED,
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.invoiceDate = {};
      if (startDate) {
        whereClause.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.invoiceDate.lte = end;
      }
    }

    return prisma.taxInvoice.findMany({
      where: whereClause,
      orderBy: { invoiceDate: "asc" },
      include: {
        project: { select: { name: true } },
        contract: { select: { contractNumber: true } },
      },
    });
  }
}
