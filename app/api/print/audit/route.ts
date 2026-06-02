import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { auditPrintOrThrow, requireAccountingAccess, requireProjectAccess, requireCompanyScope } from "@/lib/route-security";

type PrintType =
  | "ADVANCE"
  | "BANK_TRANSFER"
  | "CASH_PAYMENT"
  | "CASH_RECEIPT"
  | "DEBT"
  | "INVENTORY_ISSUE"
  | "INVENTORY_RECEIPT"
  | "INVOICE"
  | "LEDGER"
  | "PAYMENT";

const PRINT_TYPES = new Set<PrintType>([
  "ADVANCE",
  "BANK_TRANSFER",
  "CASH_PAYMENT",
  "CASH_RECEIPT",
  "DEBT",
  "INVENTORY_ISSUE",
  "INVENTORY_RECEIPT",
  "INVOICE",
  "LEDGER",
  "PAYMENT",
]);

async function resolvePrintEntity(printType: PrintType, entityId: string) {
  switch (printType) {
    case "ADVANCE": {
      const advance = await prisma.advanceRequest.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, companyId: true, projectId: true },
      });
      return advance;
    }
    case "BANK_TRANSFER":
    case "CASH_PAYMENT":
    case "CASH_RECEIPT": {
      const doc = await prisma.cashBankDocument.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, companyId: true, projectId: true, documentType: true },
      });
      return doc;
    }
    case "INVENTORY_ISSUE":
    case "INVENTORY_RECEIPT": {
      const doc = await prisma.inventoryDocument.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, companyId: true, projectId: true, documentType: true },
      });
      return doc;
    }
    case "INVOICE": {
      const invoice = await prisma.invoice.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, companyId: true, projectId: true },
      });
      return invoice;
    }
    case "PAYMENT": {
      const payment = await prisma.payment.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, projectId: true, invoice: { select: { companyId: true } } },
      });
      return payment ? { id: payment.id, projectId: payment.projectId, companyId: payment.invoice?.companyId ?? null } : null;
    }
    case "DEBT":
    case "LEDGER": {
      const project = await prisma.project.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, companyId: true },
      });
      return project ? { id: project.id, projectId: project.id, companyId: project.companyId } : null;
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const body = await request.json();
    const printType = String(body.printType || "") as PrintType;
    const entityId = String(body.entityId || "");
    const route = String(body.route || "");
    const reason = String(body.reason || "In chứng từ tài chính");
    const format = String(body.format || "HTML");

    if (!PRINT_TYPES.has(printType)) {
      throw new ApiError(400, "Loại chứng từ in không hợp lệ.");
    }
    if (!entityId) {
      throw new ApiError(400, "Thiếu mã chứng từ cần in.");
    }
    if (!route) {
      throw new ApiError(400, "Thiếu đường dẫn in chứng từ.");
    }

    const entity = await resolvePrintEntity(printType, entityId);
    if (!entity) {
      throw new ApiError(404, "Không tìm thấy chứng từ cần in.");
    }

    await requireCompanyScope(user, entity.companyId);
    if (entity.projectId) {
      await requireProjectAccess(user, entity.projectId);
    }

    const audit = await auditPrintOrThrow({
      userId: user.id,
      companyId: entity.companyId,
      projectId: entity.projectId,
      printType,
      entityId,
      route,
      reason,
      format,
    });

    return successResponse({
      auditId: audit.id,
      printType,
      entityId,
      projectId: entity.projectId,
      companyId: entity.companyId,
      auditedAt: audit.timestamp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
