import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { InvoiceStatus } from "@prisma/client";

export class RevenueService {
  // ─── INVOICE ───────────────────────────────────────
  static async createInvoice(data: any) {
    return prisma.invoice.create({
      data: {
        project_id: data.project_id,
        wbs_id: data.wbs_id,
        invoice_number: data.invoice_number,
        amount: data.amount,
        issued_date: data.issued_date ? new Date(data.issued_date) : new Date(),
        due_date: data.due_date ? new Date(data.due_date) : null,
        remaining_amount: data.amount,
        status: "DRAFT",
        note: data.note,
        created_by_id: data.created_by_id
      }
    });
  }

  // ─── PAYMENT ───────────────────────────────────────
  static async createPayment(data: any) {
    if (data.amount <= 0) throw new ApiError(400, "Số tiền thanh toán phải lớn hơn 0");

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoice_id } });
      if (!invoice) throw new ApiError(404, "Không tìm thấy hóa đơn");

      if (data.amount > invoice.remaining_amount + 0.01) { 
        throw new ApiError(400, `Số tiền thanh toán (${data.amount}) vượt quá số tiền còn lại (${invoice.remaining_amount})`);
      }

      const newPaidAmount = invoice.paid_amount + data.amount;
      const newRemainingAmount = Math.max(0, invoice.amount - newPaidAmount);
      
      let newStatus: InvoiceStatus = "PARTIAL";
      if (newRemainingAmount <= 0) newStatus = "PAID";

      const payment = await tx.payment.create({
        data: {
          project_id: data.project_id,
          invoice_id: data.invoice_id,
          amount: data.amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
        },
      });

      await tx.invoice.update({
        where: { id: data.invoice_id },
        data: {
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
        },
      });

      await tx.revenue.create({
        data: {
          project_id: data.project_id,
          wbs_id: invoice.wbs_id,
          invoice_id: invoice.id,
          amount: data.amount,
          date: new Date(),
          status: "paid",
          description: `Thanh toán cho hóa đơn ${invoice.invoice_number || invoice.id}`
        }
      });

      return payment;
    });
  }

  static async findInvoicesByProject(project_id: string) {
    return prisma.invoice.findMany({
      where: { project_id },
      include: {
        payments: true,
        wbs: { select: { name: true } }
      },
      orderBy: { issued_date: "desc" }
    });
  }
}
