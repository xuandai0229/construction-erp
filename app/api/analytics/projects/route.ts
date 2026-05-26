import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { ProjectService } from "@/services/project.service";
import { requireAccountingAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, ...(user.companyId && { companyId: user.companyId }) },
      take: 10,
      orderBy: { createdAt: "desc" }
    });

    const detailedProjects = await Promise.all(
      projects.map(async (p) => {
        const stats = await ProjectService.getAccountingSummary(p.id);
        return {
          ...p,
          stats
        };
      })
    );

    // Sort by profit descending
    const topProjects = detailedProjects
      .sort((a, b) => b.stats.profit - a.stats.profit)
      .slice(0, 5);

    return successResponse({
      topProjects,
      allProjectSummaries: detailedProjects
    });
  } catch (error) {
    return handleApiError(error);
  }
}


