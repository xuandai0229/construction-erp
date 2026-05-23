import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { DependencyType, ActivityStatus } from "@/generated/prisma-client";

/**
 * CPM (Critical Path Method) Scheduling Engine
 * 
 * Implements real construction scheduling with:
 * - Forward Pass (Early Start / Early Finish)
 * - Backward Pass (Late Start / Late Finish)
 * - Float Calculation (Total Float, Free Float)
 * - Critical Path Detection
 * - Delay Propagation
 */
export class CPMEngine {

  // ═══════════════════════════════════════════════════════════════
  // ACTIVITY CRUD
  // ═══════════════════════════════════════════════════════════════

  static async createActivity(data: {
    projectId: string;
    code: string;
    name: string;
    description?: string;
    wbsId?: string;
    plannedStart: Date;
    plannedDuration: number; // calendar days
    isMilestone?: boolean;
    baselineId?: string;
  }) {
    const plannedFinish = new Date(data.plannedStart);
    plannedFinish.setDate(plannedFinish.getDate() + data.plannedDuration);

    return prisma.activity.create({
      data: {
        projectId: data.projectId,
        code: data.code,
        name: data.name,
        description: data.description,
        wbsId: data.wbsId,
        plannedStart: data.plannedStart,
        plannedFinish,
        plannedDuration: data.plannedDuration,
        isMilestone: data.isMilestone || false,
        baselineId: data.baselineId,
        status: ActivityStatus.NOT_STARTED,
      }
    });
  }

  static async addDependency(data: {
    predecessorId: string;
    successorId: string;
    type?: DependencyType;
    lagDays?: number;
  }) {
    // Validate no circular dependency
    await this.validateNoCycle(data.predecessorId, data.successorId);

    return prisma.activityDependency.create({
      data: {
        predecessorId: data.predecessorId,
        successorId: data.successorId,
        type: data.type || DependencyType.FS,
        lagDays: data.lagDays || 0,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CPM FORWARD PASS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
   * ES = max(EF of all predecessors + lag)
   * EF = ES + Duration
   */
  static async runForwardPass(projectId: string): Promise<Map<string, { es: Date; ef: Date }>> {
    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null },
      include: {
        predecessors: { include: { predecessor: true } },
      },
      orderBy: { plannedStart: 'asc' }
    });

    const result = new Map<string, { es: Date; ef: Date }>();
    const resolved = new Set<string>();

    // Topological sort via Kahn's algorithm
    const sorted = await this.topologicalSort(projectId);

    for (const actId of sorted) {
      const act = activities.find(a => a.id === actId);
      if (!act) continue;

      let es: Date;

      if (act.predecessors.length === 0) {
        // Start activity: ES = plannedStart
        es = act.plannedStart || new Date();
      } else {
        // ES = max(predecessor finish + lag) based on dependency type
        let maxDate = new Date(0);

        for (const dep of act.predecessors) {
          const predResult = result.get(dep.predecessorId);
          if (!predResult) continue;

          let depDate: Date;
          switch (dep.type) {
            case DependencyType.FS: // Finish-to-Start
              depDate = new Date(predResult.ef);
              break;
            case DependencyType.SS: // Start-to-Start
              depDate = new Date(predResult.es);
              break;
            case DependencyType.FF: // Finish-to-Finish — successor finish = pred finish + lag
              depDate = new Date(predResult.ef);
              depDate.setDate(depDate.getDate() - (act.plannedDuration || 0));
              break;
            case DependencyType.SF: // Start-to-Finish
              depDate = new Date(predResult.es);
              depDate.setDate(depDate.getDate() - (act.plannedDuration || 0));
              break;
            default:
              depDate = new Date(predResult.ef);
          }

          // Apply lag
          depDate.setDate(depDate.getDate() + dep.lagDays);

          if (depDate > maxDate) {
            maxDate = depDate;
          }
        }

        es = maxDate > new Date(0) ? maxDate : (act.plannedStart || new Date());
      }

      const ef = new Date(es);
      ef.setDate(ef.getDate() + (act.plannedDuration || 0));

      result.set(act.id, { es, ef });
      resolved.add(act.id);
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // CPM BACKWARD PASS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Backward Pass: Calculate Late Start (LS) and Late Finish (LF)
   * LF = min(LS of all successors - lag)
   * LS = LF - Duration
   */
  static async runBackwardPass(
    projectId: string,
    forwardResults: Map<string, { es: Date; ef: Date }>
  ): Promise<Map<string, { ls: Date; lf: Date }>> {
    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null },
      include: {
        successors: { include: { successor: true } },
      }
    });

    const result = new Map<string, { ls: Date; lf: Date }>();

    // Find project finish (max EF)
    let projectFinish = new Date(0);
    for (const [, fwd] of forwardResults) {
      if (fwd.ef > projectFinish) projectFinish = new Date(fwd.ef);
    }

    // Reverse topological order
    const sorted = await this.topologicalSort(projectId);
    const reversed = [...sorted].reverse();

    for (const actId of reversed) {
      const act = activities.find(a => a.id === actId);
      if (!act) continue;

      let lf: Date;

      if (act.successors.length === 0) {
        // End activity: LF = project finish
        lf = new Date(projectFinish);
      } else {
        // LF = min(LS of successors - lag)
        let minDate = new Date(8640000000000000); // Max date

        for (const dep of act.successors) {
          const succResult = result.get(dep.successorId);
          if (!succResult) continue;

          let depDate: Date;
          switch (dep.type) {
            case DependencyType.FS:
              depDate = new Date(succResult.ls);
              break;
            case DependencyType.SS:
              depDate = new Date(succResult.ls);
              depDate.setDate(depDate.getDate() + (act.plannedDuration || 0));
              break;
            case DependencyType.FF:
              depDate = new Date(succResult.lf);
              break;
            case DependencyType.SF:
              depDate = new Date(succResult.lf);
              depDate.setDate(depDate.getDate() + (act.plannedDuration || 0));
              break;
            default:
              depDate = new Date(succResult.ls);
          }

          depDate.setDate(depDate.getDate() - dep.lagDays);

          if (depDate < minDate) {
            minDate = depDate;
          }
        }

        lf = minDate;
      }

      const ls = new Date(lf);
      ls.setDate(ls.getDate() - (act.plannedDuration || 0));

      result.set(act.id, { ls, lf });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // CRITICAL PATH CALCULATION
  // ═══════════════════════════════════════════════════════════════

  static async calculateCriticalPath(projectId: string) {
    const forwardResults = await this.runForwardPass(projectId);
    const backwardResults = await this.runBackwardPass(projectId, forwardResults);

    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null },
      include: {
        predecessors: true,
        successors: true,
      }
    });

    const criticalActivities: string[] = [];
    const nearCriticalActivities: string[] = [];

    for (const act of activities) {
      const fwd = forwardResults.get(act.id);
      const bwd = backwardResults.get(act.id);

      if (!fwd || !bwd) continue;

      // Total Float = LS - ES (in days)
      const totalFloat = Math.round((bwd.ls.getTime() - fwd.es.getTime()) / (1000 * 3600 * 24));

      // Free Float = min(ES_successor) - EF_current
      let freeFloat = totalFloat;
      if (act.successors && act.successors.length > 0) {
        let minSuccES = Infinity;
        for (const dep of act.successors) {
          const succFwd = forwardResults.get(dep.successorId);
          if (succFwd) {
            const succESdays = succFwd.es.getTime() / (1000 * 3600 * 24);
            if (succESdays < minSuccES) minSuccES = succESdays;
          }
        }
        if (minSuccES < Infinity) {
          freeFloat = Math.round(minSuccES - fwd.ef.getTime() / (1000 * 3600 * 24));
        }
      }

      const isCritical = totalFloat <= 0;
      const isNearCritical = !isCritical && totalFloat <= 5;

      if (isCritical) criticalActivities.push(act.id);
      if (isNearCritical) nearCriticalActivities.push(act.id);

      // Update activity with CPM results
      await prisma.activity.update({
        where: { id: act.id },
        data: {
          earlyStart: fwd.es,
          earlyFinish: fwd.ef,
          lateStart: bwd.ls,
          lateFinish: bwd.lf,
          totalFloat,
          freeFloat: Math.max(0, freeFloat),
          isCritical,
          isNearCritical,
        }
      });
    }

    return {
      totalActivities: activities.length,
      criticalActivities: criticalActivities.length,
      nearCriticalActivities: nearCriticalActivities.length,
      criticalPath: criticalActivities,
      nearCriticalPath: nearCriticalActivities,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DELAY PROPAGATION ENGINE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Record a delay event and propagate its impact through dependencies.
   * 
   * Chain: Delayed Activity → Successor Delay → Critical Path Shift
   *        → Billing Delay → Revenue Delay → Liquidity Stress
   */
  static async recordDelay(data: {
    activityId: string;
    projectId: string;
    category: string;
    description: string;
    delayDays: number;
    isExcusable?: boolean;
    isCompensable?: boolean;
    impactCost?: number;
  }) {
    // 1. Create delay event
    const delay = await prisma.delayEvent.create({
      data: {
        activityId: data.activityId,
        projectId: data.projectId,
        category: data.category as any,
        description: data.description,
        delayDays: data.delayDays,
        startDate: new Date(),
        isExcusable: data.isExcusable || false,
        isCompensable: data.isCompensable || false,
        impactCost: data.impactCost,
        status: "ACTIVE",
      }
    });

    // 2. Update activity forecast
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId },
      include: { successors: true }
    });

    if (activity) {
      const currentFinish = activity.forecastFinish || activity.plannedFinish || new Date();
      const newForecast = new Date(currentFinish);
      newForecast.setDate(newForecast.getDate() + data.delayDays);

      await prisma.activity.update({
        where: { id: data.activityId },
        data: {
          forecastFinish: newForecast,
          status: activity.status === ActivityStatus.NOT_STARTED
            ? ActivityStatus.NOT_STARTED
            : ActivityStatus.IN_PROGRESS,
        }
      });

      // 3. Propagate to successors (cascade)
      const propagationLog: string[] = [];
      await this.propagateDelay(data.activityId, data.delayDays, propagationLog);

      // 4. Recalculate critical path
      const cpm = await this.calculateCriticalPath(data.projectId);

      return {
        delayEvent: delay,
        propagation: propagationLog,
        criticalPathShift: cpm,
      };
    }

    return { delayEvent: delay, propagation: [], criticalPathShift: null };
  }

  private static async propagateDelay(
    activityId: string,
    delayDays: number,
    log: string[]
  ) {
    const deps = await prisma.activityDependency.findMany({
      where: { predecessorId: activityId },
      include: { successor: true }
    });

    for (const dep of deps) {
      const successor = dep.successor;
      if (!successor || successor.status === ActivityStatus.COMPLETED) continue;

      // Only FS and SS dependencies propagate delays directly
      let propagatedDays = delayDays;
      if (dep.type === DependencyType.FF || dep.type === DependencyType.SF) {
        propagatedDays = Math.max(0, delayDays - (dep.lagDays || 0));
      }

      if (propagatedDays <= 0) continue;

      const currentForecast = successor.forecastFinish || successor.plannedFinish;
      if (currentForecast) {
        const newForecast = new Date(currentForecast);
        newForecast.setDate(newForecast.getDate() + propagatedDays);

        await prisma.activity.update({
          where: { id: successor.id },
          data: { forecastFinish: newForecast }
        });

        log.push(`${successor.code} (${successor.name}): +${propagatedDays} days → forecast ${newForecast.toISOString().split('T')[0]}`);

        // Recurse
        await this.propagateDelay(successor.id, propagatedDays, log);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BASELINE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  static async createBaseline(projectId: string, name: string, description?: string) {
    // Deactivate previous baselines
    await prisma.baselineSchedule.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false }
    });

    // Find the next version number
    const lastBaseline = await prisma.baselineSchedule.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' }
    });

    const version = (lastBaseline?.version || 0) + 1;

    const baseline = await prisma.baselineSchedule.create({
      data: {
        projectId,
        version,
        name,
        description,
        isActive: true,
      }
    });

    // Link all current activities to this baseline
    await prisma.activity.updateMany({
      where: { projectId, deletedAt: null },
      data: { baselineId: baseline.id }
    });

    return baseline;
  }

  /**
   * Compute schedule variance: baseline vs actual/forecast
   */
  static async getScheduleVariance(projectId: string) {
    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { plannedStart: 'asc' }
    });

    const variances = activities.map(act => {
      const baseline = act.plannedFinish;
      const forecast = act.forecastFinish || act.actualFinish || act.plannedFinish;

      const delayDays = baseline && forecast
        ? Math.round((forecast.getTime() - baseline.getTime()) / (1000 * 3600 * 24))
        : 0;

      return {
        code: act.code,
        name: act.name,
        plannedFinish: baseline?.toISOString().split('T')[0],
        forecastFinish: forecast?.toISOString().split('T')[0],
        delayDays,
        isCritical: act.isCritical,
        totalFloat: act.totalFloat,
        status: act.status,
      };
    });

    const totalDelay = Math.max(0, ...variances.map(v => v.delayDays));
    const criticalDelayed = variances.filter(v => v.isCritical && v.delayDays > 0);

    return {
      activities: variances,
      projectDelayDays: totalDelay,
      criticalActivitiesDelayed: criticalDelayed.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private static async topologicalSort(projectId: string): Promise<string[]> {
    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null },
      include: { predecessors: true }
    });

    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const act of activities) {
      inDegree.set(act.id, act.predecessors.length);
      if (!adjacency.has(act.id)) adjacency.set(act.id, []);
    }

    // Build adjacency from dependencies
    const deps = await prisma.activityDependency.findMany({
      where: {
        predecessor: { projectId, deletedAt: null }
      }
    });

    for (const dep of deps) {
      const adj = adjacency.get(dep.predecessorId) || [];
      adj.push(dep.successorId);
      adjacency.set(dep.predecessorId, adj);
    }

    // BFS
    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== activities.length) {
      throw new ApiError(400, "LỖI: Phát hiện vòng lặp phụ thuộc (Circular Dependency) trong lưới tiến độ.");
    }

    return sorted;
  }

  private static async validateNoCycle(predecessorId: string, successorId: string) {
    // Check if successorId can reach predecessorId (would create a cycle)
    const visited = new Set<string>();
    const stack = [successorId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === predecessorId) {
        throw new ApiError(400, "LỖI: Thêm phụ thuộc này sẽ tạo vòng lặp (Circular Dependency).");
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = await prisma.activityDependency.findMany({
        where: { predecessorId: current }
      });

      for (const dep of deps) {
        stack.push(dep.successorId);
      }
    }
  }

  /**
   * Start an activity (set actualStart)
   */
  static async startActivity(activityId: string) {
    return prisma.activity.update({
      where: { id: activityId },
      data: {
        actualStart: new Date(),
        status: ActivityStatus.IN_PROGRESS,
      }
    });
  }

  /**
   * Complete an activity (set actualFinish)
   */
  static async completeActivity(activityId: string) {
    const act = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!act) throw new ApiError(404, "Activity not found");

    const actualDuration = act.actualStart
      ? Math.round((new Date().getTime() - act.actualStart.getTime()) / (1000 * 3600 * 24))
      : act.plannedDuration;

    return prisma.activity.update({
      where: { id: activityId },
      data: {
        actualFinish: new Date(),
        actualDuration,
        status: ActivityStatus.COMPLETED,
        percentComplete: 100,
      }
    });
  }
}
