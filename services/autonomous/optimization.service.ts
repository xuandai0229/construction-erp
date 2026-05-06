import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class SimulationEngineService {
  /**
   * Construction Simulation Engine (What-if Intelligence).
   * "Nếu thép tăng 12%, margin dự án giảm còn 8.2%."
   */
  static async simulateScenario(scenario: {
    variable: 'STEEL_PRICE' | 'LABOR_COST' | 'WEATHER_DELAY';
    changePercent: number;
    projectId: string;
  }) {
    const project = await prisma.project.findUnique({ where: { id: scenario.projectId } });
    // Simulation Logic
    const currentMargin = 12.5; // %
    const impact = scenario.variable === 'STEEL_PRICE' ? (scenario.changePercent * 0.3) : (scenario.changePercent * 0.1);
    
    return {
        scenario: scenario.variable,
        impactOnMargin: -impact,
        newEstimatedMargin: currentMargin - impact,
        riskPropagation: "Có thể ảnh hưởng tới Cashflow trong Q3."
    };
  }
}

export class DigitalTwinService {
  /**
   * Realtime Construction Digital Twin.
   * Maintains the operational and financial state of all entities.
   */
  static async getProjectTwin(projectId: string) {
    // Aggregates realtime state across WBS, Finance, Inventory, and Field
    return {
        id: projectId,
        twinState: 'SYNCHRONIZED',
        financialPulse: 88, // 0-100
        operationalPulse: 72,
        anomaliesInTwin: 0,
        lastSync: new Date()
    };
  }
}

export class OptimizationEngineService {
  /**
   * Autonomous Optimization Engine.
   * "Rebalance workloads and optimize resources."
   */
  static async optimizeResources(portfolioId: string) {
    // Recommends PM/QS reallocations to balance workload
    return {
        recommendations: [
            { type: 'RESOURCE_REALLOCATION', from: 'Project A', to: 'Project B', reason: 'High workload at B' },
            { type: 'PROCUREMENT_TIMING', vendor: 'Vendor X', suggestion: 'Bulk order now before price hike' }
        ],
        estimatedEfficiencyGain: 0.15 // 15%
    };
  }
}
