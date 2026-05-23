import { ForecastService } from "./forecast.service";
import { round } from "@/lib/math";

export class EnterpriseSimulationEngine {
  /**
   * Simulates the impact of a potential cost increase on project EAC.
   */
  static async simulateCostImpact(projectId: string, additionalCost: number) {
    const currentForecast = await ForecastService.getProjectForecast(projectId);
    
    const simulatedEAC = currentForecast.eac + additionalCost;
    const simulatedVAC = currentForecast.bac - simulatedEAC;
    
    return {
      projectId,
      currentEAC: currentForecast.eac,
      simulatedEAC: round(simulatedEAC),
      simulatedVAC: round(simulatedVAC),
      riskDelta: simulatedVAC < currentForecast.vac ? "INCREASED" : "STABLE",
      impactLevel: (additionalCost / currentForecast.bac) > 0.05 ? "SIGNIFICANT" : "MINOR"
    };
  }

  /**
   * Simulates escalation chain propagation.
   */
  static simulateEscalation(level: number) {
    const roles = ["PM", "BRANCH_DIRECTOR", "CFO", "GROUP_DIRECTOR", "SUPER_ADMIN"];
    return roles.slice(0, level + 1);
  }
}
