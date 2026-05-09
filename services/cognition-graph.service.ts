import { prisma } from "@/lib/prisma";

export type CognitionNode = {
  id: string;
  type: "PROJECT" | "BRANCH" | "SUPPLIER" | "RISK" | "METRIC";
  label: string;
};

export type CognitionEdge = {
  from: string;
  to: string;
  relation: "DEPENDS_ON" | "IMPACTS" | "ESCALATES_TO" | "CAUSED_BY";
};

export class EnterpriseCognitionGraph {
  /**
   * Generates a structural graph of the enterprise's operational dependencies.
   */
  static async getOperationalGraph(companyId: string) {
    const [projects, branches] = await Promise.all([
      prisma.project.findMany({ where: { companyId } }),
      prisma.branch.findMany({ where: { companyId } }),
    ]);

    const nodes: CognitionNode[] = [];
    const edges: CognitionEdge[] = [];

    // 1. Map Branches to Projects
    branches.forEach(b => {
      nodes.push({ id: b.id, type: "BRANCH", label: b.name });
      const bProjects = projects.filter(p => p.branchId === b.id);
      bProjects.forEach(p => {
        nodes.push({ id: p.id, type: "PROJECT", label: p.name });
        edges.push({ from: p.id, to: b.id, relation: "ESCALATES_TO" });
      });
    });

    // 2. Map Risks (Placeholder for metric nodes)
    nodes.push({ id: "METRIC-MARGIN", type: "METRIC", label: "Group Margin" });

    return { nodes, edges };
  }
}
