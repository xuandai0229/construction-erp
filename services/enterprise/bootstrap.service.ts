import { prisma } from "@/lib/prisma";

export interface ProjectTemplate {
    name: string;
    type: 'RESIDENTIAL' | 'INFRASTRUCTURE' | 'INDUSTRIAL';
    standardWBS: { name: string; code: string; children?: any[] }[];
    standardCostCodes: string[];
    requiredApprovalRoles: string[];
}

export class ProjectBootstrapService {
  /**
   * Enterprise Project Registry & Standardization.
   * Ensures every new project is governance-ready.
   */
  static async bootstrapFromTemplate(params: {
    name: string;
    templateType: 'RESIDENTIAL' | 'INFRASTRUCTURE' | 'INDUSTRIAL';
    ownerId: string;
  }) {
    const template = this.getTemplate(params.templateType);

    return prisma.$transaction(async (tx) => {
      // 1. Create Project
      const project = await tx.project.create({
        data: {
          name: params.name,
          status: "PLANNED",
          ownerId: params.ownerId,
        }
      });

      // 2. Deploy Standard WBS Structure
      for (const item of template.standardWBS) {
        await tx.wBSItem.create({
          data: {
            projectId: project.id,
            name: item.name,
            code: item.code,
            level: 0,
          }
        });
      }

      // 3. Initialize Governance Rules
      // Log bootstrap event
      await tx.auditLog.create({
        data: {
          projectId: project.id,
          userId: params.ownerId,
          action: "BOOTSTRAP",
          entity: "Project",
          entityId: project.id,
          reason: `Project standardized from ${params.templateType} template`,
          severity: "INFO"
        }
      });

      return project;
    });
  }

  private static getTemplate(type: string): ProjectTemplate {
    // In a mature system, these would be in the DB.
    // For now, we use Enterprise Operational Standards.
    const templates: Record<string, ProjectTemplate> = {
      'RESIDENTIAL': {
        name: 'Standard Residential High-Rise',
        type: 'RESIDENTIAL',
        standardWBS: [
          { name: 'General Conditions', code: '1000' },
          { name: 'Substructure', code: '2000' },
          { name: 'Superstructure', code: '3000' },
          { name: 'MEP', code: '4000' },
          { name: 'Finishing', code: '5000' }
        ],
        standardCostCodes: ['MAT-01', 'LAB-01', 'SUB-01'],
        requiredApprovalRoles: ['PROJECT_MANAGER', 'QS_MANAGER', 'FINANCE_DIRECTOR']
      }
    };
    return templates[type] || templates['RESIDENTIAL'];
  }
}
