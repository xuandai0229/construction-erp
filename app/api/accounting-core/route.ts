import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { ConstructionAccountingService } from "@/services/construction-accounting.service";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, requireProjectAccess } from "@/lib/route-security";
import { z } from "zod";

const supplierSchema = z.object({
  action: z.literal("createSupplier"),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const linkSupplierSchema = z.object({
  action: z.literal("linkSupplier"),
  projectId: z.string().uuid(),
  supplierId: z.string().uuid(),
});

const contractSchema = z.object({
  action: z.literal("createContract"),
  projectId: z.string().uuid(),
  supplierId: z.string().uuid(),
  contractCode: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(255),
  originalValue: z.number().positive(),
  signedDate: z.string().optional(),
});

const acceptanceSchema = z.object({
  action: z.literal("createAcceptance"),
  contractId: z.string().uuid(),
  acceptanceNumber: z.string().trim().min(1).max(100),
  amount: z.number().positive(),
  date: z.string().optional(),
  note: z.string().max(1000).optional(),
});

const invoiceSchema = z.object({
  action: z.literal("createInvoice"),
  contractId: z.string().uuid(),
  invoiceNumber: z.string().trim().max(100).optional(),
  amount: z.number().positive(),
  issuedDate: z.string().optional(),
  dueDate: z.string().optional(),
  note: z.string().max(1000).optional(),
});

const paymentSchema = z.object({
  action: z.literal("createPayment"),
  contractId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  date: z.string().optional(),
  description: z.string().max(500).optional(),
});

const paymentPlanSchema = z.object({
  action: z.literal("createPaymentPlan"),
  contractId: z.string().uuid(),
  dueDate: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
});

const checklistSchema = z.object({
  action: z.literal("createChecklistItem"),
  contractId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  status: z.string().max(50).optional(),
  note: z.string().max(1000).optional(),
});

const postSchema = z.discriminatedUnion("action", [
  supplierSchema,
  linkSupplierSchema,
  contractSchema,
  acceptanceSchema,
  invoiceSchema,
  paymentSchema,
  paymentPlanSchema,
  checklistSchema,
]);

async function requireContractProjectAccess(contractId: string) {
  const user = await requirePermission("PAYMENT", "READ");
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { projectId: true },
  });
  if (!contract) throw new ApiError(404, "Contract not found");
  await requireProjectAccess(user, contract.projectId);
  return user;
}

async function requireAccountingActionAccess(data: z.infer<typeof postSchema>) {
  if (data.action === "createSupplier") {
    return requirePermission("DOCUMENT", "CREATE");
  }
  if (data.action === "linkSupplier" || data.action === "createContract") {
    const user = await requirePermission("DOCUMENT", "CREATE");
    await requireProjectAccess(user, data.projectId);
    return user;
  }
  if (data.action === "createAcceptance" || data.action === "createPaymentPlan" || data.action === "createChecklistItem") {
    return requireContractProjectAccess(data.contractId);
  }
  if (data.action === "createInvoice") {
    const user = await requirePermission("INVOICE", "CREATE");
    const contract = await prisma.contract.findFirst({
      where: { id: data.contractId, deletedAt: null },
      select: { projectId: true },
    });
    if (!contract) throw new ApiError(404, "Contract not found");
    await requireProjectAccess(user, contract.projectId);
    return user;
  }
  const user = await requirePermission("PAYMENT", "CREATE");
  const contract = await prisma.contract.findFirst({
    where: { id: data.contractId, deletedAt: null },
    select: { projectId: true },
  });
  if (!contract) throw new ApiError(404, "Contract not found");
  await requireProjectAccess(user, contract.projectId);
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requirePermission("REPORT", "READ");
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "workspace";
    const projectId = searchParams.get("projectId") || undefined;
    const contractId = searchParams.get("contractId") || undefined;

    if (action === "workspace") {
      return successResponse(await ConstructionAccountingService.getWorkspace(user.companyId));
    }
    if (action === "project") {
      if (!projectId) return successResponse(null);
      await requireProjectAccess(user, projectId);
      return successResponse(await ConstructionAccountingService.getProjectLedger(projectId));
    }
    if (action === "contract") {
      if (!contractId) throw new Error("contractId is required");
      await requireContractProjectAccess(contractId);
      return successResponse(await ConstructionAccountingService.getContractDetail(contractId));
    }
    if (action === "audit") {
      if (projectId) await requireProjectAccess(user, projectId);
      return successResponse(await ConstructionAccountingService.auditOrphanDocuments(projectId));
    }

    return successResponse(await ConstructionAccountingService.getWorkspace(user.companyId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const data = postSchema.parse(await request.json());
    const action = data.action;
    await requireAccountingActionAccess(data);

    if (action === "createSupplier") {
      return successResponse(await ConstructionAccountingService.createSupplier(data), null, 201);
    }
    if (action === "linkSupplier") {
      return successResponse(await ConstructionAccountingService.linkSupplierToProject(data.projectId, data.supplierId), null, 201);
    }
    if (action === "createContract") {
      return successResponse(await ConstructionAccountingService.createContract(data), null, 201);
    }
    if (action === "createAcceptance") {
      return successResponse(await ConstructionAccountingService.createAcceptance(data), null, 201);
    }
    if (action === "createInvoice") {
      return successResponse(await ConstructionAccountingService.createInvoice(data), null, 201);
    }
    if (action === "createPayment") {
      return successResponse(await ConstructionAccountingService.createPayment(data), null, 201);
    }
    if (action === "createPaymentPlan") {
      return successResponse(await ConstructionAccountingService.createPaymentPlan(data), null, 201);
    }
    if (action === "createChecklistItem") {
      return successResponse(await ConstructionAccountingService.createChecklistItem(data), null, 201);
    }

    throw new Error("Unsupported accounting action.");
  } catch (error) {
    return handleApiError(error);
  }
}
