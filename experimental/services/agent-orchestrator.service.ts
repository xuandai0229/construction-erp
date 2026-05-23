import { prisma } from "@/lib/prisma";
import { CopilotService } from "./copilot.service";

export type AgentResponse = {
  agentName: string;
  action: string;
  result: any;
  reasoning: string;
};

export class AgentOrchestratorService {
  /**
   * Orchestrates multi-agent workflows based on complex operational needs.
   */
  static async orchestrate(task: string, userId: string, projectId: string) {
    console.log(`[Orchestrator] Task received: ${task}`);

    // 1. Determine which agents are needed (Routing)
    const agentsNeeded: string[] = [];
    if (task.toLowerCase().includes("risk") || task.toLowerCase().includes("rủi ro")) {
      agentsNeeded.push("PM_AGENT");
    }
    if (task.toLowerCase().includes("cost") || task.toLowerCase().includes("chi phí") || task.toLowerCase().includes("margin")) {
      agentsNeeded.push("CFO_AGENT");
    }

    const results: AgentResponse[] = [];

    // 2. Execute agent actions (In parallel or sequence)
    for (const agent of agentsNeeded) {
      const result = await this.runAgent(agent, task, userId, projectId);
      results.push(result);
    }

    return {
      task,
      agentsInvolved: agentsNeeded,
      consolidatedResults: results,
      timestamp: new Date()
    };
  }

  private static async runAgent(agentName: string, task: string, userId: string, projectId: string): Promise<AgentResponse> {
    // Placeholder for real agent logic
    const copilotResponse = await CopilotService.ask(task, userId, projectId);
    
    return {
      agentName,
      action: "ANALYZE",
      result: copilotResponse.data,
      reasoning: `As ${agentName}, I performed an analysis of the requested ${task}.`
    };
  }
}
