import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError, ApiError } from "@/lib/api-error";
import { InventoryService } from "@/services/inventory.service";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("DOCUMENT", "READ");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const { id } = await props.params;
    const doc = await prisma.inventoryDocument.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
      include: {
        project: true,
        wbs: true,
        supplier: true,
        contract: true,
        taxInvoice: true,
        lines: {
          include: {
            material: true,
            sourceWarehouse: true,
            targetWarehouse: true,
          },
        },
      },
    });

    if (!doc) {
      throw new ApiError(404, "Không tìm thấy chứng từ kho.");
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("DOCUMENT", "UPDATE");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const { id } = await props.params;
    const body = await request.json();

    const doc = await InventoryService.updateDocument(id, body, user.id);

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("DOCUMENT", "DELETE");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const { id } = await props.params;
    await InventoryService.deleteDocument(id, user.companyId, user.id);

    return NextResponse.json({ success: true, message: "Xóa chứng từ kho thành công" });
  } catch (error) {
    return handleApiError(error);
  }
}
