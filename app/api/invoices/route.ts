import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { createInvoiceSchema } from "@/lib/validations";
import { RevenueService } from "@/services/revenue.service";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { ApiError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "INVOICE", "READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    if (!projectId) return successResponse([]);

    // Check project tenant access
    if (user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const items = await RevenueService.findInvoicesByProject(projectId, {}, user.companyId);

    const mapped = items.map((inv) => ({
      id: inv.id,
      projectId: inv.projectId,
      wbsId: inv.wbsId,
      amount: inv.amount,
      issuedDate: inv.issuedDate.toISOString(),
      dueDate: inv.dueDate?.toISOString() || null,
      invoiceNumber: inv.invoiceNumber,
      retentionAmount: inv.retentionAmount,
      retentionRate: inv.retentionRate,
      vatAmount: inv.vatAmount,
      vatRate: inv.vatRate,
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      approvalStatus: inv.approvalStatus,
      status: inv.status,
      wbsName: inv.wbs.name,
      createdAt: inv.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "INVOICE", "CREATE");

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // Verify project belongs to tenant
    if (user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const item = await RevenueService.createInvoice({
      ...data,
      createdById: user.id
    });

    return successResponse({
      id: item.id,
      projectId: item.projectId,
      wbsId: item.wbsId,
      amount: item.amount,
      issuedDate: item.issuedDate.toISOString(),
      dueDate: item.dueDate?.toISOString() || null,
      invoiceNumber: item.invoiceNumber,
      retentionAmount: item.retentionAmount,
      retentionRate: item.retentionRate,
      vatAmount: item.vatAmount,
      vatRate: item.vatRate,
      paidAmount: item.paidAmount,
      remainingAmount: item.remainingAmount,
      approvalStatus: item.approvalStatus,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}



