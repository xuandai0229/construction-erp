import { prisma } from "@/lib/prisma";

export class ComplianceService {
  /**
   * Calculates an "Operational Maturity Score" for a project.
   * Based on:
   * 1. Audit log activity.
   * 2. Approval speed (SLA).
   * 3. Data completeness (WBS, BOQ).
   * 4. Field reporting frequency.
   */
  static async getProjectComplianceScore(projectId: string) {
    const scores = {
      reportingFrequency: 0, // 0-100
      approvalSLA: 0,
      dataQuality: 0,
      totalScore: 0
    };

    // 1. Reporting Frequency (Checks for ProgressEntries in last 7 days)
    const recentProgress = await prisma.progressEntry.count({
      where: {
        boqItem: { projectId },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });
    scores.reportingFrequency = Math.min(100, recentProgress * 20); // 5 reports/week = 100%

    // 2. Approval SLA (Average time to approve/reject)
    const approvals = await prisma.approvalStep.findMany({
      where: { request: { projectId }, status: { not: "PENDING" } }
    });
    
    if (approvals.length > 0) {
      const avgTime = approvals.reduce((sum, step) => {
        const duration = (step.processedAt?.getTime() || 0) - step.createdAt.getTime();
        return sum + duration;
      }, 0) / approvals.length;
      
      // SLA target: 24 hours (86,400,000 ms)
      scores.approvalSLA = Math.max(0, 100 - (avgTime / 86400000) * 20);
    } else {
      scores.approvalSLA = 100;
    }

    // 3. Data Quality (Checks for BOQ items without WBS or description)
    const boqStats = await prisma.bOQItem.count({ where: { projectId } });
    const poorBoq = await prisma.bOQItem.count({
      where: { projectId, OR: [{ description: "" }, { unit: "" }] }
    });
    scores.dataQuality = boqStats > 0 ? ((boqStats - poorBoq) / boqStats) * 100 : 100;

    scores.totalScore = Math.round((scores.reportingFrequency + scores.approvalSLA + scores.dataQuality) / 3);

    return {
      projectId,
      scores,
      status: scores.totalScore > 80 ? "EXCELLENT" : scores.totalScore > 60 ? "GOOD" : "AT_RISK",
      lastAuditAt: new Date()
    };
  }

  /**
   * Detects "Stale" projects with no recent financial activity.
   */
  static async detectStaleProjects() {
    const projects = await prisma.project.findMany({
      where: { status: "ACTIVE" }
    });

    const staleThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const staleResults = [];

    for (const project of projects) {
      const recentActivity = await prisma.auditLog.count({
        where: { projectId: project.id, createdAt: { gte: staleThreshold } }
      });

      if (recentActivity === 0) {
        staleResults.push({
          projectId: project.id,
          name: project.name,
          lastActivityAt: project.updatedAt
        });
      }
    }

    return staleResults;
  }
}
