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

    const items = await prisma.materialItem.findMany({
      where: {
        companyId: user.companyId,
        deletedAt: null,
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, data: items });
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
    const item = await InventoryService.createMaterialItem(
      {
        companyId: user.companyId,
        code: body.code,
        name: body.name,
        unit: body.unit,
        group: body.group,
        defaultWarehouseId: body.defaultWarehouseId,
        inventoryAccount: body.inventoryAccount,
        expenseAccount: body.expenseAccount,
        vatRate: body.vatRate,
      },
      user.id
    );

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return handleApiError(error);
  }
}
