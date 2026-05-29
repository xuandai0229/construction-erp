import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError, ApiError } from "@/lib/api-error";
import { InventoryService } from "@/services/inventory.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requirePermission("DOCUMENT", "READ");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId: user.companyId,
        deletedAt: null,
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, data: warehouses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("DOCUMENT", "CREATE");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const body = await request.json();
    const warehouse = await InventoryService.createWarehouse(
      {
        companyId: user.companyId,
        projectId: body.projectId,
        code: body.code,
        name: body.name,
        address: body.address,
        managerName: body.managerName,
      },
      user.id
    );

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error) {
    return handleApiError(error);
  }
}
