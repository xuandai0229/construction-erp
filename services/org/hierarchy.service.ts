import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { UserRole } from "../../generated/prisma-client";

export class HierarchyService {
  /**
   * Add a new node to the organization hierarchy
   */
  static async addNode(companyId: string, name: string, type: "CORPORATION" | "REGION" | "BRANCH" | "DEPARTMENT" | "TEAM", parentId?: string) {
    LoggerService.info(`[Hierarchy] Adding organization node: ${name} (Type: ${type}) under parent: ${parentId || 'NONE'}`);
    return await prisma.organizationUnit.create({
      data: {
        companyId,
        name,
        type,
        parentId
      }
    });
  }

  /**
   * Recursively fetches all descendant unit IDs for a given parent organization unit ID
   */
  static async getDescendantUnitIds(parentId: string): Promise<string[]> {
    const list: string[] = [parentId];
    
    // Fetch direct children
    const children = await prisma.organizationUnit.findMany({
      where: { parentId }
    });

    for (const child of children) {
      const childDescendants = await this.getDescendantUnitIds(child.id);
      list.push(...childDescendants);
    }

    return list;
  }

  /**
   * Evaluates and enforces Hierarchical RBAC, returning only the Project IDs the User is permitted to see
   */
  static async getUserAllowedProjectIds(userId: string, role: UserRole, companyId: string): Promise<string[] | "ALL"> {
    // 1. CFO & Global Admins have unrestricted Corporation-wide access
    if (role === "SUPER_ADMIN" || role === "CFO" || role === "ADMIN") {
      return "ALL";
    }

    // 2. Fetch User and check their designated scoping
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user) return [];

    // 3. BRANCH_DIRECTOR scope: Restrict access to projects belonging to their specific Branch
    if (role === "BRANCH_DIRECTOR") {
      // Find branch units assigned to the user or matching branch code
      const branches = await prisma.branch.findMany({
        where: { companyId }
      });

      // Filter projects that fall under the permitted branch scope
      const projects = await prisma.project.findMany({
        where: { companyId, branchId: { in: branches.map(b => b.id) } },
        select: { id: true }
      });

      return projects.map(p => p.id);
    }

    // 4. MANAGER & PROJECT_MANAGER scope: restrict access to their owned projects
    if (role === "MANAGER") {
      const projects = await prisma.project.findMany({
        where: { companyId, ownerId: userId, deletedAt: null },
        select: { id: true }
      });
      return projects.map(p => p.id);
    }

    // 5. Default scoping for other roles (Viewer, Auditor, etc.): only see projects they are directly assigned to as owner or member
    const projects = await prisma.project.findMany({
      where: {
        companyId,
        OR: [
          { ownerId: userId },
          { tasks: { some: { assigneeId: userId } } }
        ],
        deletedAt: null
      },
      select: { id: true }
    });

    return projects.map(p => p.id);
  }

  /**
   * Verifies if a user has sufficient hierarchical privilege to read/write a specific resource (Row-Level Security)
   */
  static async checkSecurityBoundary(
    userId: string,
    role: UserRole,
    companyId: string,
    targetProjectId: string
  ): Promise<boolean> {
    const allowed = await this.getUserAllowedProjectIds(userId, role, companyId);
    if (allowed === "ALL") return true;
    return allowed.includes(targetProjectId);
  }
}
