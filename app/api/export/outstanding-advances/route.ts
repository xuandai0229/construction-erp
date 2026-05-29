import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";
import { AdvanceReportService } from "@/services/advance-report.service";
import { generateCsvResponse } from "@/lib/export/accountingExport";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");

    const report = await AdvanceReportService.getOutstandingAdvances(user.companyId || "");

    const headers = [
      "Ma phieu tam ung",
      "Nhan vien tam ung",
      "Du an",
      "Hop dong",
      "Nha cung cap",
      "So tien tam ung (Amount)",
      "Da quyet toan (Settled)",
      "Con lai chua quyet toan (Outstanding)",
      "Ngay tam ung",
      "Trang thai"
    ];

    const rows = report.items.map((a: any) => [
      a.advanceNo || a.id,
      a.employee?.name || "",
      a.project?.name || "",
      a.contract?.contractNumber || "",
      a.supplier?.name || "",
      String(a.amount),
      String(Number(a.amount) - Number(a.remainingAmount)),
      String(a.remainingAmount),
      a.createdAt.toISOString().split("T")[0],
      a.status
    ]);

    const filename = `BaoCaoTamUngChuaQuyetToan_${new Date().toISOString().split("T")[0]}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      reportType: "OUTSTANDING_ADVANCES_EXPORT",
      filename,
      headers,
      rows,
      reason: "Xuat bao cao tam ung chua quyet toan"
    });

  } catch (error) {
    return handleApiError(error);
  }
}
