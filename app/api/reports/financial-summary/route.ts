
import { handleApiError } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const data = await ReportingService.getMonthlyFinancialSummary();

    if (format === "csv") {
      if (data.length === 0) return new Response("", { status: 200 });
      
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => `"${(row as any)[h]}"`).join(","))
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="financial_summary_${Date.now()}.csv"`
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
