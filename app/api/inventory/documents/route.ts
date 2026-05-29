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

    const docs = await prisma.inventoryDocument.findMany({
      where: {
        companyId: user.companyId,
        deletedAt: null,
      },
      orderBy: { documentDate: "desc" },
      include: {
        project: true,
        wbs: true,
        supplier: true,
        lines: {
          include: {
            material: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: docs });
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
    const doc = await InventoryService.createDocument(
      {
        companyId: user.companyId,
        projectId: body.projectId,
        wbsId: body.wbsId,
        documentType: body.documentType,
        documentNo: body.documentNo,
        documentDate: body.documentDate,
        accountingDate: body.accountingDate,
        supplierId: body.supplierId,
        contractId: body.contractId,
        vatInvoiceId: body.vatInvoiceId,
        sourceWarehouseId: body.sourceWarehouseId,
        targetWarehouseId: body.targetWarehouseId,
        partnerName: body.partnerName,
        description: body.description,
        lines: body.lines,
      },
      user.id
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return handleApiError(error);
  }
}
