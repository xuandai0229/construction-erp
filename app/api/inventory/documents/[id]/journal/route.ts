import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError, ApiError } from "@/lib/api-error";
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

    const journal = await prisma.journalEntry.findFirst({
      where: {
        sourceType: "INVENTORY_DOCUMENT",
        sourceId: id,
        deletedAt: null,
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: journal });
  } catch (error) {
    return handleApiError(error);
  }
}
