import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { BudgetService } from "@/services/budget.service";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) throw new ApiError(401, "Authentication required");

    const body = await request.json();
    if (!Array.isArray(body)) throw new ApiError(400, "Dữ liệu import phải là một mảng");

    // In a real app, we would validate each row.
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const row of body) {
      try {
        if (!row.projectId || !row.wbsId || !row.estimatedAmount) {
          throw new Error("Thiếu trường bắt buộc (projectId, wbsId, estimatedAmount)");
        }
        await BudgetService.create({
          projectId: row.projectId,
          wbsId: row.wbsId,
          costType: row.costType || "material",
          estimatedAmount: Number(row.estimatedAmount),
          createdById: userId
        });
        successCount++;
        results.push({ row, status: 'success' });
      } catch (err: any) {
        failCount++;
        results.push({ row, status: 'error', error: err.message });
      }
    }

    return successResponse({ successCount, failCount, results }, `Import hoàn tất. Thành công: ${successCount}, Lỗi: ${failCount}`, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
