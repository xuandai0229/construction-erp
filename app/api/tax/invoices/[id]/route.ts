import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";
import { TaxInvoiceService } from "@/services/tax-invoice.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("INVOICE", "READ");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { id } = await props.params;
    const invoice = await TaxInvoiceService.getInvoiceById(id, user.companyId);
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("INVOICE", "UPDATE");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();

    const invoice = await TaxInvoiceService.updateInvoice(
      id,
      {
        projectId: body.projectId,
        contractId: body.contractId,
        wbsId: body.wbsId,
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
        overrideReason: body.overrideReason,
      },
      user.companyId,
      user.id
    );

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("INVOICE", "DELETE");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { id } = await props.params;
    const invoice = await TaxInvoiceService.deleteInvoice(id, user.companyId, user.id);
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
