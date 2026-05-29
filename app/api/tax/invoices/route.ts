import { NextResponse } from "next/server";
import { requirePermission, requireCompanyScope } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";
import { TaxInvoiceService } from "@/services/tax-invoice.service";
import { TaxInvoiceType, TaxInvoiceStatus } from "@/generated/prisma-client";

export async function GET(request: Request) {
  try {
    const user = await requirePermission("INVOICE", "READ");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const invoiceType = searchParams.get("invoiceType") as TaxInvoiceType || undefined;
    const status = searchParams.get("status") as TaxInvoiceStatus || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await TaxInvoiceService.getInvoices({
      companyId: user.companyId,
      projectId,
      invoiceType,
      status,
      search,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("INVOICE", "CREATE");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const body = await request.json();
    
    // Ensure tenant isolation
    await requireCompanyScope(user, body.companyId || user.companyId);

    const invoice = await TaxInvoiceService.createInvoice(
      {
        companyId: body.companyId || user.companyId,
        projectId: body.projectId,
        contractId: body.contractId,
        wbsId: body.wbsId,
        invoiceType: body.invoiceType as TaxInvoiceType,
        invoiceNumber: body.invoiceNumber,
        invoiceSeries: body.invoiceSeries,
        invoiceTemplate: body.invoiceTemplate,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        partnerName: body.partnerName,
        partnerTaxCode: body.partnerTaxCode,
        partnerAddress: body.partnerAddress,
        netAmount: Number(body.netAmount),
        vatRate: Number(body.vatRate),
        vatAmount: Number(body.vatAmount),
        description: body.description,
        sourceType: body.sourceType,
        sourceId: body.sourceId,
        overrideReason: body.overrideReason,
      },
      user.id
    );

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
