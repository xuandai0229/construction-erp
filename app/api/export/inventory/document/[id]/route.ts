import { handleApiError, ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/route-security";
import { generateCsvResponse } from "@/lib/export/accountingExport";
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

    const headers = [
      "So phieu",
      "Ngay hach toan",
      "Loai phieu",
      "Trang thai",
      "Dien giai",
      "Ma vat tu",
      "Ten vat tu",
      "Don vi tinh",
      "Kho nguon",
      "Kho dich",
      "So luong",
      "Don gia",
      "Thanh tien"
    ];

    const rows = doc.lines.map(line => [
      doc.documentNo,
      new Date(doc.documentDate).toLocaleDateString("vi-VN"),
      doc.documentType,
      doc.status,
      doc.description || "",
      line.material.code,
      line.material.name,
      line.material.unit,
      line.sourceWarehouse?.code || "-",
      line.targetWarehouse?.code || "-",
      String(line.quantity),
      String(line.unitCost),
      String(Number(line.quantity) * Number(line.unitCost))
    ]);

    const filename = `ChiTietPhieu_${doc.documentNo}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: doc.projectId || "",
      reportType: "INVENTORY_DOC_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat chi tiet chung tu kho ${doc.documentNo}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
