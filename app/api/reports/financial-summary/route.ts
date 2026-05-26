
import { handleApiError } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";
import { auditExportOrThrow, requireAccountingAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    if (format === "csv") {
      await requireAccountingAccess("EXPORT");
      await auditExportOrThrow({
        userId: user.id,
        companyId: user.companyId,
        reportType: "FINANCIAL_SUMMARY",
        format: "csv",
      });
    }

    const data = await ReportingService.getMonthlyFinancialSummary();

    if (format === "csv") {
      if (data.length === 0) return new Response("", { status: 200 });
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(h => `"${(row as any)[h]}"`).join(","))
      ].join("\n");

      // Add UTF-8 BOM for Excel compatibility with Vietnamese characters
      const BOM = "\uFEFF";
      const csvWithBom = BOM + csvContent;

      return new Response(csvWithBom, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Bao_cao_tai_chinh_${Date.now()}.csv"`
        }
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
