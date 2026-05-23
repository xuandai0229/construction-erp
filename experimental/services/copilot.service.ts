import { AIContextService } from "./ai-context.service";
import { SemanticQueryEngine } from "./semantic-query.engine";
import { AuditService } from "./audit.service";

export class CopilotService {
  /**
   * Orchestrates the AI assistance flow.
   */
  static async ask(query: string, userId: string, projectId: string) {
    const context = await AIContextService.getContext(userId, projectId);
    
    // Simple intent detection (Placeholder for real NLU)
    let intent = "RISK_ANALYSIS";
    if (query.toLowerCase().includes("cost") || query.toLowerCase().includes("dự báo")) {
      intent = "COST_FORECAST";
    } else if (query.toLowerCase().includes("bất thường") || query.toLowerCase().includes("lỗi")) {
      intent = "ANOMALY_CHECK";
    }

    const data = await SemanticQueryEngine.executeIntent(intent, { projectId });

    const response = {
      query,
      intent,
      data,
      reasoningTrace: `Based on your role as ${context.user.role}, I analyzed the ${intent} for project ${context.project.name}.`,
      confidence: 0.95
    };

    await AuditService.log({
      userId,
      action: "UPDATE", // Using UPDATE for intelligence interactions
      entity: "AICopilot",
      entityId: projectId,
      newData: { query, intent }
    });

    return response;
  }
}
