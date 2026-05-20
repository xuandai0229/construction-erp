import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ResourceType, EquipmentStatus } from "@/generated/prisma-client";

export class ResourceService {
  // ═══════════════════════════════════════════════════════════════
  // RESOURCE POOL & ASSET MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  static async createResourcePool(data: {
    projectId: string;
    name: string;
    type: ResourceType;
    capacity: number;
    costPerDay: number;
  }) {
    return prisma.resourcePool.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        costPerDay: data.costPerDay,
      }
    });
  }

  static async createLaborCrew(data: {
    resourcePoolId: string;
    name: string;
    headCount: number;
    dailyRate: number;
    skillLevel?: string;
  }) {
    return prisma.laborCrew.create({
      data: {
        resourcePoolId: data.resourcePoolId,
        name: data.name,
        headCount: data.headCount,
        dailyRate: data.dailyRate,
        skillLevel: data.skillLevel || "STANDARD",
      }
    });
  }

  static async createEquipmentAsset(data: {
    resourcePoolId?: string;
    code: string;
    name: string;
    type: string;
    dailyRate: number;
    fuelCostPerDay?: number;
  }) {
    return prisma.equipmentAsset.create({
      data: {
        resourcePoolId: data.resourcePoolId,
        code: data.code,
        name: data.name,
        type: data.type,
        dailyRate: data.dailyRate,
        fuelCostPerDay: data.fuelCostPerDay || 0,
        status: EquipmentStatus.AVAILABLE,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ALLOCATIONS & ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════

  static async assignCrew(data: {
    crewId: string;
    activityId: string;
    startDate: Date;
    endDate?: Date;
    hoursPerDay?: number;
  }) {
    // Check for conflicts/over-allocation
    await this.checkCrewAllocationConflict(data.crewId, data.startDate, data.endDate || new Date());

    return prisma.crewAssignment.create({
      data: {
        crewId: data.crewId,
        activityId: data.activityId,
        startDate: data.startDate,
        endDate: data.endDate,
        hoursPerDay: data.hoursPerDay || 8,
      }
    });
  }

  static async assignEquipment(data: {
    equipmentId: string;
    activityId: string;
    startDate: Date;
    endDate?: Date;
    hoursPerDay?: number;
    utilization?: number;
  }) {
    // Check breakdown/maintenance
    const eq = await prisma.equipmentAsset.findUnique({ where: { id: data.equipmentId } });
    // Check conflicts/over-allocation
    await this.checkEquipmentConflict(data.equipmentId, data.startDate, data.endDate || new Date());

    // Update equipment status
    await prisma.equipmentAsset.update({
      where: { id: data.equipmentId },
      data: { status: EquipmentStatus.IN_USE }
    });

    return prisma.equipmentAssignment.create({
      data: {
        equipmentId: data.equipmentId,
        activityId: data.activityId,
        startDate: data.startDate,
        endDate: data.endDate,
        hoursPerDay: data.hoursPerDay || 8,
        utilization: data.utilization || 100,
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // EQUIPMENT MAINTENANCE & DOWNTIME
  // ═══════════════════════════════════════════════════════════════

  static async recordBreakdown(data: {
    equipmentId: string;
    startDate: Date;
    cause: string;
  }) {
    await prisma.equipmentAsset.update({
      where: { id: data.equipmentId },
      data: { status: EquipmentStatus.BREAKDOWN }
    });

    return prisma.equipmentBreakdown.create({
      data: {
        equipmentId: data.equipmentId,
        startDate: data.startDate,
        cause: data.cause,
      }
    });
  }

  static async resolveBreakdown(data: {
    breakdownId: string;
    endDate: Date;
    repairCost: number;
  }) {
    const br = await prisma.equipmentBreakdown.findUnique({ where: { id: data.breakdownId } });
    if (!br) throw new ApiError(404, "Breakdown record not found");

    const downtimeDays = Math.round((data.endDate.getTime() - br.startDate.getTime()) / (1000 * 3600 * 24));

    await prisma.equipmentBreakdown.update({
      where: { id: data.breakdownId },
      data: {
        endDate: data.endDate,
        repairCost: data.repairCost,
        downtimeDays,
      }
    });

    // Increment total downtime
    await prisma.equipmentAsset.update({
      where: { id: br.equipmentId },
      data: {
        status: EquipmentStatus.AVAILABLE,
        totalDowntimeDays: { increment: downtimeDays }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTIVITY ENGINE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Compare Planned vs Actual crew/equipment productivity
   */
  static async calculateProductivityMetrics(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        crewAssignments: { include: { crew: true } },
        resourceAssignments: { include: { equipment: true } },
      }
    });

    if (!activity) throw new ApiError(404, "Activity not found");

    // Let's assume some dynamic BOQ progress to calculate actual productivity.
    // Real construction productivity = Earned Quantity / Actual Labor Hours
    const progressEntries = await prisma.progressEntry.findMany({
      where: { BOQItem: { wbsId: activity.wbsId || "" } }
    });

    const actualQuantity = progressEntries.reduce((sum, p) => sum + Number(p.quantity), 0);

    // Total crew days allocated
    let totalLaborDays = 0;
    let laborCost = 0;
    for (const ca of activity.crewAssignments) {
      const start = ca.startDate;
      const end = ca.endDate || new Date();
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      totalLaborDays += days * ca.crew.headCount;
      laborCost += days * Number(ca.crew.dailyRate);
    }

    // Equipment days
    let eqCost = 0;
    let fuelCost = 0;
    for (const ea of activity.resourceAssignments) {
      const start = ea.startDate;
      const end = ea.endDate || new Date();
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      eqCost += days * Number(ea.equipment.dailyRate);
      fuelCost += days * Number(ea.equipment.fuelCostPerDay);
    }

    const actualLaborHours = totalLaborDays * 8;
    const productivityRate = actualLaborHours > 0 ? actualQuantity / actualLaborHours : 0; // units per man-hour
    const costPerUnit = actualQuantity > 0 ? (laborCost + eqCost + fuelCost) / actualQuantity : 0;

    return {
      activityCode: activity.code,
      activityName: activity.name,
      earnedQuantity: actualQuantity,
      totalLaborHours: actualLaborHours,
      productivityRate, // units per man-hour
      totalCost: laborCost + eqCost + fuelCost,
      costPerUnit,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONFLICT DETECTION
  // ═══════════════════════════════════════════════════════════════

  private static async checkCrewAllocationConflict(crewId: string, start: Date, end: Date) {
    const conflicts = await prisma.crewAssignment.findMany({
      where: {
        crewId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
          { startDate: { lte: end }, endDate: null }
        ]
      }
    });

    if (conflicts.length > 0) {
      throw new ApiError(400, "Xung đột tài nguyên: Tổ đội đang được phân bổ cho công việc khác trong thời gian này.");
    }
  }

  private static async checkEquipmentConflict(equipmentId: string, start: Date, end: Date) {
    const conflicts = await prisma.equipmentAssignment.findMany({
      where: {
        equipmentId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
          { startDate: { lte: end }, endDate: null }
        ]
      }
    });

    if (conflicts.length > 0) {
      throw new ApiError(400, "Xung đột thiết bị: Thiết bị này đang được phân bổ cho công việc khác trong thời gian này.");
    }
  }
}
