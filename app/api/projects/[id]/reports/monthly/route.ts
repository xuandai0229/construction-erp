import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportService } from "@/services/report.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await ReportService.getMonthlyReport(params.id);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
