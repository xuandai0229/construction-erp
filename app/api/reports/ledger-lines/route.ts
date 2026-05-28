import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const accountCode = searchParams.get("accountCode");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    if (!projectId) {
      throw new ApiError(400, "ProjectId is required");
    }

    if (!accountCode) {
      throw new ApiError(400, "AccountCode is required");
    }

    await requireProjectAccess(user, projectId);

    // Build query conditions
    const whereCondition = {
      account: { code: { startsWith: accountCode } },
      ...getPostedLedgerLineFilter({ projectId })
    };

    // Parallel Count & Query for optimized performance
    const [total, lines] = await Promise.all([
      prisma.transactionLine.count({ where: whereCondition }),
      prisma.transactionLine.findMany({
        where: whereCondition,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          account: {
            select: {
              code: true,
              name: true
            }
          },
          journalEntry: {
            select: {
              id: true,
              date: true,
              reference: true,
              sourceType: true,
              sourceId: true,
              description: true
            }
          }
        },
        orderBy: { journalEntry: { date: "desc" } },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return successResponse({
      lines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
