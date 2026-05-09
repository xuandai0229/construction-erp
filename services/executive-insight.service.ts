import { ConsolidatedReportService } from "./consolidated-report.service";

export class ExecutiveInsightService {
  static async generateInsights(companyId: string) {
    const report = await ConsolidatedReportService.getGroupSummary(companyId);
    
    const insights: string[] = [];

    // 1. Profitability Insight
    const topBranch = [...report.branchSummary].sort((a, b) => b.totalCost - a.totalCost)[0];
    insights.push(`Branch ${topBranch.name} is leading in operations with ${topBranch.projectCount} active projects.`);

    // 2. Margin Insight
    if (report.overallMargin < 10) {
      insights.push(`Overall margin is low (${report.overallMargin}%). Review procurement inflation and site waste.`);
    } else {
      insights.push(`Healthy group margin of ${report.overallMargin}%. Operating within enterprise targets.`);
    }

    // 3. Project Growth
    insights.push(`Enterprise scale: Managing ${report.totalProjects} projects across the group.`);

    return {
      companyId,
      insights,
      summary: insights.join(" "),
      timestamp: new Date()
    };
  }
}
