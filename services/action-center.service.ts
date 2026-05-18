
import { prisma } from "../lib/prisma";
import { ReportingService } from "./reporting.service";
import { DiagnosticsService } from "./diagnostics.service";

export interface ActionTask {
  id: string;
  type: "APPROVAL" | "OVERDUE" | "RISK" | "GOVERNANCE" | "RECONCILIATION";
  title: string;
  description: string;
  priority: number; // 0-100
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  entityType: string;
  entityId: string;
  createdAt: Date;
  metadata?: any;
}

export class ActionCenterService {
  /**
   * Retrieves the prioritized action center tasks for a specific user
   */
  static async getUserTasks(userId: string, projectId?: string): Promise<ActionTask[]> {
    const tasks: ActionTask[] = [];

    // 1. Pending Approvals (High Priority if old)
    const approvals = await prisma.approvalStep.findMany({
      where: { 
        approverId: userId, 
        status: "PENDING",
        ...(projectId && {
          ApprovalRequest: {
            projectId: projectId
          }
        })
      },
      include: { ApprovalRequest: true }
    });

    for (const step of approvals) {
      const daysWaiting = Math.ceil((Date.now() - step.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      tasks.push({
        id: `approval-${step.id}`,
        type: "APPROVAL",
        title: "Yêu cầu phê duyệt chờ xử lý",
        description: `${step.ApprovalRequest.entityType} cần bạn phê duyệt.`,
        priority: 30 + (daysWaiting * 5),
        severity: daysWaiting > 3 ? "WARNING" : "INFO",
        entityType: step.ApprovalRequest.entityType,
        entityId: step.ApprovalRequest.entityId || "",
        createdAt: step.createdAt
      });
    }

    // 2. Overdue Invoices (Financial Impact)
    const overdueInvoices = await prisma.invoice.findMany({
      where: { 
        status: "OVERDUE", 
        deletedAt: null,
        ...(projectId && { projectId })
      },
      take: 20
    });

    for (const inv of overdueInvoices) {
      const daysOverdue = Math.ceil((Date.now() - (inv.dueDate || inv.issuedDate).getTime()) / (1000 * 60 * 60 * 24));
      tasks.push({
        id: `overdue-${inv.id}`,
        type: "OVERDUE",
        title: "Hóa đơn quá hạn thanh toán",
        description: `Hóa đơn ${inv.invoiceNumber} đã quá hạn ${daysOverdue} ngày.`,
        priority: 50 + Math.min(40, daysOverdue),
        severity: daysOverdue > 30 ? "CRITICAL" : "ERROR",
        entityType: "Invoice",
        entityId: inv.id,
        createdAt: inv.issuedDate,
        metadata: { amount: inv.remainingAmount }
      });
    }

    // 3. High Risk Projects (Management Intelligence)
    const riskProfiles = await ReportingService.getProjectRiskProfiles();
    const criticalRisks = riskProfiles.filter(p => p.riskScore > 60 && (!projectId || p.projectId === projectId));

    for (const risk of criticalRisks) {
      tasks.push({
        id: `risk-${risk.projectId}`,
        type: "RISK",
        title: "Cảnh báo rủi ro dự án",
        description: `Dự án ${risk.projectName} có độ rủi ro cao (${risk.riskScore}/100).`,
        priority: risk.riskScore,
        severity: risk.severity === "CRITICAL" ? "CRITICAL" : "ERROR",
        entityType: "Project",
        entityId: risk.projectId,
        createdAt: new Date(),
        metadata: { flags: risk.flags }
      });
    }

    // 4. Governance Anomalies (Operational Health)
    const health = await DiagnosticsService.systemHealthCheck();
    if (health.orphans.length > 0 || health.integrity.length > 0) {
      tasks.push({
        id: "governance-anomaly",
        type: "GOVERNANCE",
        title: "Phát hiện sai lệch hệ thống",
        description: `Có ${health.orphans.length + health.integrity.length} vấn đề về tính nhất quán dữ liệu cần xử lý.`,
        priority: 90,
        severity: "CRITICAL",
        entityType: "System",
        entityId: "diagnostics",
        createdAt: new Date()
      });
    }

    return tasks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Bulk approve multiple requests
   */
  static async bulkApprove(stepIds: string[], userId: string, comment?: string) {
    // This would call the existing approval logic in a loop or optimized transaction
    // For now, placeholder for the productivity requirement
    return { count: stepIds.length, status: "SUCCESS" };
  }
}
