import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportService } from "@/services/report.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await ReportService.getAgingReport(id);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
