import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { generateCsvResponse } from "@/lib/export/accountingExport";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";

    await requireProjectAccess(user, projectId);

    const invoices = await prisma.invoice.findMany({
      where: {
        projectId,
        deletedAt: null
      },
      include: {
        wbs: true
      },
      orderBy: {
        issuedDate: "desc"
      }
    });

    const headers = [
      "Ma hoa don",
      "Hang muc thi cong WBS",
      "Ngay phat hanh",
      "Han thanh toan",
      "Tong tien hoa don",
      "Da thanh toan (Paid)",
      "Con lai phai thu (Remaining)",
      "Trang thai duyet",
      "Trang thai thanh toan"
    ];

    const rows = invoices.map(inv => [
      inv.invoiceNumber || inv.id,
      inv.wbs?.name || "",
      inv.issuedDate.toISOString().split("T")[0],
      inv.dueDate ? inv.dueDate.toISOString().split("T")[0] : "—",
      String(inv.amount),
      String(inv.paidAmount),
      String(inv.remainingAmount),
      inv.approvalStatus || "",
      inv.status || ""
    ]);

    const project = await prisma.project.findFirst({ where: { id: projectId } });
    const filename = `BaoCaoCongNoPhaiThu_${project?.name || "DuAn"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType: "DEBT_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat bao cao cong no phai thu cho du an ${project?.name}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
