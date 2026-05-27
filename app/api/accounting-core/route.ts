import { handleApiError, successResponse } from "@/lib/api-error";
import { ConstructionAccountingService } from "@/services/construction-accounting.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "workspace";
    const projectId = searchParams.get("projectId") || undefined;
    const contractId = searchParams.get("contractId") || undefined;

    if (action === "workspace") {
      return successResponse(await ConstructionAccountingService.getWorkspace());
    }
    if (action === "project") {
      if (!projectId) return successResponse(null);
      return successResponse(await ConstructionAccountingService.getProjectLedger(projectId));
    }
    if (action === "contract") {
      if (!contractId) throw new Error("contractId is required");
      return successResponse(await ConstructionAccountingService.getContractDetail(contractId));
    }
    if (action === "audit") {
      return successResponse(await ConstructionAccountingService.auditOrphanDocuments(projectId));
    }

    return successResponse(await ConstructionAccountingService.getWorkspace());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "createSupplier") {
      return successResponse(await ConstructionAccountingService.createSupplier(body), null, 201);
    }
    if (action === "linkSupplier") {
      return successResponse(await ConstructionAccountingService.linkSupplierToProject(body.projectId, body.supplierId), null, 201);
    }
    if (action === "createContract") {
      return successResponse(await ConstructionAccountingService.createContract(body), null, 201);
    }
    if (action === "createAcceptance") {
      return successResponse(await ConstructionAccountingService.createAcceptance(body), null, 201);
    }
    if (action === "createInvoice") {
      return successResponse(await ConstructionAccountingService.createInvoice(body), null, 201);
    }
    if (action === "createPayment") {
      return successResponse(await ConstructionAccountingService.createPayment(body), null, 201);
    }
    if (action === "createPaymentPlan") {
      return successResponse(await ConstructionAccountingService.createPaymentPlan(body), null, 201);
    }
    if (action === "createChecklistItem") {
      return successResponse(await ConstructionAccountingService.createChecklistItem(body), null, 201);
    }

    throw new Error("Unsupported accounting action.");
  } catch (error) {
    return handleApiError(error);
  }
}
