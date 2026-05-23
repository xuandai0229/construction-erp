import { MetaReasoningService } from "./meta-reasoning.service";
import { EnterpriseAIConstitutionService } from "./ai-constitution.service";

export class AITrustCenterService {
  static async getTrustMetrics(projectId: string) {
    const meta = await MetaReasoningService.evaluateIntelligence(projectId);
    const rules = EnterpriseAIConstitutionService.getConstitutionalRules();

    return {
      projectId,
      trustScore: meta.integrityScore,
      governanceStatus: meta.status,
      hallucinationRisk: meta.integrityScore < 50 ? "HIGH" : "LOW",
      constitutionalCompliance: 100, // Placeholder
      activeFlags: meta.flags,
      timestamp: new Date()
    };
  }
}
