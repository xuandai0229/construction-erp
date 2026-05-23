import { prisma } from "@/lib/prisma";
import { UserRole } from "../generated/prisma-client";

export class AIContextService {
  /**
   * Builds a structured context for the AI based on the current user and active project.
   */
  static async getContext(userId: string, projectId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user) throw new Error("User context missing");

    const context: any = {
      user: {
        role: user.role,
        company: user.company?.name
      },
      now: new Date()
    };

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { SiteLog: { take: 5, orderBy: { date: 'desc' } } }
      });
      
      if (project) {
        context.project = {
          name: project.name,
          status: project.status,
          recentLogs: project.SiteLog.map(l => l.progress)
        };
      }
    }

    return context;
  }
}
