import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Severity = "RED" | "YELLOW" | "GREEN";
type WarningStatus = "NEW" | "CHECKING" | "RESOLVED" | "IGNORED_WITH_REASON";

type AccountingWarning = {
  id: string;
  severity: Severity;
  reason: string;
  amount: number;
  documentType: string;
  documentId: string;
  contractId?: string;
  href?: string;
  status: WarningStatus;
};

const n = (value: unknown) => Number(value || 0);
const iso = (value?: Date | null) => (value ? value.toISOString() : null);
const today = () => new Date();

function addWarning(
  warnings: AccountingWarning[],
  input: Omit<AccountingWarning, "id" | "status"> & { status?: WarningStatus },
) {
  warnings.push({
    id: `${input.documentType}:${input.documentId}:${warnings.length}`,
    status: input.status || "NEW",
    ...input,
  });
}

function planStatus(dueDate: Date, plannedAmount: number, paidAmount: number) {
  if (paidAmount >= plannedAmount) return "PAID";
  const now = today();
  const due = new Date(dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / msPerDay);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 7) return "DUE";
  return "NOT_DUE";
}

export class ConstructionAccountingService {
  static async getWorkspace(companyId?: string | null) {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, ...(companyId && { companyId }) },
      select: { id: true, name: true, contractValue: true },
      orderBy: { createdAt: "desc" },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });

    return {
      projects: projects.map((p) => ({ ...p, contractValue: n(p.contractValue) })),
      suppliers,
    };
  }

  static async getProjectLedger(projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, name: true, contractValue: true },
    });
    if (!project) throw new ApiError(404, "Không tìm thấy công trình.");

    const projectSuppliers = await prisma.projectSupplier.findMany({
      where: { projectId },
      include: {
        supplier: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const contracts = await prisma.contract.findMany({
      where: { projectId, deletedAt: null },
      include: {
        supplier: true,
        project: { select: { id: true, name: true } },
        acceptances: { where: { deletedAt: null }, orderBy: { date: "desc" } },
        invoices: { where: { deletedAt: null }, orderBy: { issuedDate: "desc" } },
        payments: { where: { deletedAt: null }, orderBy: { date: "desc" } },
        paymentPlans: { orderBy: { dueDate: "asc" } },
        documentChecklist: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const contractRows = contracts.map((contract) => this.mapContract(contract));
    const reports = this.buildReports(contractRows);
    const warnings = [
      ...contractRows.flatMap((contract) => contract.warnings),
      ...(await this.auditOrphanDocuments(projectId)),
    ];

    return {
      project: { ...project, contractValue: n(project.contractValue) },
      suppliers: projectSuppliers.map((ps) => ({
        id: ps.supplier.id,
        code: ps.supplier.code,
        name: ps.supplier.name,
      })),
      contracts: contractRows,
      reports,
      warnings,
    };
  }

  static async getContractDetail(contractId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, deletedAt: null },
      include: {
        supplier: true,
        project: { select: { id: true, name: true } },
        acceptances: { where: { deletedAt: null }, orderBy: { date: "desc" } },
        invoices: { where: { deletedAt: null }, orderBy: { issuedDate: "desc" } },
        payments: { where: { deletedAt: null }, orderBy: { date: "desc" } },
        paymentPlans: { orderBy: { dueDate: "asc" } },
        documentChecklist: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng.");
    return this.mapContract(contract);
  }

  static async createSupplier(data: { code: string; name: string; description?: string }) {
    const code = data.code?.trim();
    if (!code) throw new ApiError(400, "Mã nhà cung cấp là bắt buộc.");
    if (!data.name?.trim()) throw new ApiError(400, "Tên nhà cung cấp là bắt buộc.");

    return prisma.supplier.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description,
      },
    });
  }

  static async linkSupplierToProject(projectId: string, supplierId: string) {
    await this.assertProjectAndSupplier(projectId, supplierId);
    return prisma.projectSupplier.upsert({
      where: { projectId_supplierId: { projectId, supplierId } },
      create: { projectId, supplierId },
      update: {},
      include: { supplier: true, project: true },
    });
  }

  static async createContract(data: {
    projectId: string;
    supplierId: string;
    contractCode: string;
    title: string;
    originalValue: number;
    signedDate?: string;
  }) {
    await this.assertProjectAndSupplier(data.projectId, data.supplierId);
    await this.linkSupplierToProject(data.projectId, data.supplierId);

    if (!data.contractCode?.trim()) throw new ApiError(400, "Mã hợp đồng là bắt buộc.");
    if (!data.title?.trim()) throw new ApiError(400, "Tên hợp đồng là bắt buộc.");
    if (n(data.originalValue) <= 0) throw new ApiError(400, "Giá trị hợp đồng phải lớn hơn 0.");

    return prisma.contract.create({
      data: {
        projectId: data.projectId,
        supplierId: data.supplierId,
        contractCode: data.contractCode.trim(),
        title: data.title.trim(),
        originalValue: n(data.originalValue),
        currentValue: n(data.originalValue),
        signedDate: data.signedDate ? new Date(data.signedDate) : null,
        status: "ACTIVE",
      },
    });
  }

  static async createAcceptance(data: {
    contractId: string;
    acceptanceNumber: string;
    amount: number;
    date?: string;
    note?: string;
  }) {
    const contract = await this.assertContract(data.contractId);
    if (!data.acceptanceNumber?.trim()) throw new ApiError(400, "Số nghiệm thu là bắt buộc.");
    if (n(data.amount) <= 0) throw new ApiError(400, "Giá trị nghiệm thu phải lớn hơn 0.");

    return prisma.acceptance.create({
      data: {
        contractId: contract.id,
        acceptanceNumber: data.acceptanceNumber.trim(),
        amount: n(data.amount),
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note,
      },
    });
  }

  static async createInvoice(data: {
    contractId: string;
    invoiceNumber?: string;
    amount: number;
    issuedDate?: string;
    dueDate?: string;
    note?: string;
  }) {
    const contract = await this.assertContract(data.contractId);
    if (n(data.amount) <= 0) throw new ApiError(400, "Giá trị hóa đơn phải lớn hơn 0.");

    const wbsId = await this.getFallbackWbsId(contract.projectId);
    return prisma.invoice.create({
      data: {
        projectId: contract.projectId,
        wbsId,
        contractId: contract.id,
        invoiceNumber: data.invoiceNumber?.trim() || null,
        amount: n(data.amount),
        netAmount: n(data.amount),
        vatRate: 0,
        vatAmount: 0,
        retentionRate: 0,
        retentionAmount: 0,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidAmount: 0,
        remainingAmount: n(data.amount),
        status: "SENT",
        note: data.note,
      },
    });
  }

  static async createPayment(data: {
    contractId: string;
    invoiceId?: string | null;
    amount: number;
    date?: string;
    description?: string;
  }) {
    const contract = await this.assertContract(data.contractId);
    if (n(data.amount) <= 0) throw new ApiError(400, "Số tiền thanh toán phải lớn hơn 0.");

    return prisma.$transaction(async (tx) => {
      const invoiceId = data.invoiceId || null;
      if (invoiceId) {
        const invoice = await tx.invoice.findFirst({
          where: { id: invoiceId, contractId: contract.id, deletedAt: null },
        });
        if (!invoice) throw new ApiError(400, "Hóa đơn không thuộc hợp đồng đã chọn.");
        const newPaid = n(invoice.paidAmount) + n(data.amount);
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            remainingAmount: Math.max(0, n(invoice.amount) - newPaid),
            status: newPaid >= n(invoice.amount) ? "PAID" : "PARTIAL",
            version: { increment: 1 },
          },
        });
      }

      return tx.payment.create({
        data: {
          projectId: contract.projectId,
          contractId: contract.id,
          invoiceId,
          amount: n(data.amount),
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
        },
      });
    });
  }

  static async createPaymentPlan(data: {
    contractId: string;
    dueDate: string;
    amount: number;
    paymentMethod?: string;
    note?: string;
  }) {
    const contract = await this.assertContract(data.contractId);
    if (!data.dueDate) throw new ApiError(400, "Ngày dự kiến thanh toán là bắt buộc.");
    if (n(data.amount) <= 0) throw new ApiError(400, "Số tiền kế hoạch phải lớn hơn 0.");

    return prisma.paymentPlan.create({
      data: {
        contractId: contract.id,
        dueDate: new Date(data.dueDate),
        amount: n(data.amount),
        paymentMethod: data.paymentMethod,
        note: data.note,
      },
    });
  }

  static async createChecklistItem(data: { contractId: string; name: string; status?: string; note?: string }) {
    const contract = await this.assertContract(data.contractId);
    if (!data.name?.trim()) throw new ApiError(400, "Tên hồ sơ là bắt buộc.");
    return prisma.documentChecklist.create({
      data: {
        contractId: contract.id,
        name: data.name.trim(),
        status: data.status || "MISSING",
        note: data.note,
      },
    });
  }

  static async auditOrphanDocuments(projectId?: string) {
    const warnings: AccountingWarning[] = [];
    const [payments, invoices, contracts] = await Promise.all([
      prisma.payment.findMany({
        where: { deletedAt: null, contractId: null, ...(projectId && { projectId }) },
        select: { id: true, amount: true, projectId: true },
      }),
      prisma.invoice.findMany({
        where: { deletedAt: null, contractId: null, ...(projectId && { projectId }) },
        select: { id: true, amount: true, projectId: true },
      }),
      prisma.contract.findMany({
        where: {
          deletedAt: null,
          OR: [{ supplierId: null }, { contractCode: null }],
          ...(projectId && { projectId }),
        },
        select: { id: true, currentValue: true, supplierId: true, contractCode: true },
      }),
    ]);

    payments.forEach((payment) =>
      addWarning(warnings, {
        severity: "RED",
        reason: "Thanh toán cũ chưa gắn hợp đồng gốc.",
        amount: n(payment.amount),
        documentType: "Payment",
        documentId: payment.id,
      }),
    );
    invoices.forEach((invoice) =>
      addWarning(warnings, {
        severity: "RED",
        reason: "Hóa đơn cũ chưa gắn hợp đồng gốc.",
        amount: n(invoice.amount),
        documentType: "Invoice",
        documentId: invoice.id,
      }),
    );
    contracts.forEach((contract) =>
      addWarning(warnings, {
        severity: "RED",
        reason: "Hợp đồng thiếu nhà cung cấp hoặc mã hợp đồng.",
        amount: n(contract.currentValue),
        documentType: "Contract",
        documentId: contract.id,
        contractId: contract.id,
        href: `/accounting/contracts/${contract.id}`,
      }),
    );
    return warnings;
  }

  private static async assertProjectAndSupplier(projectId: string, supplierId: string) {
    const [project, supplier] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, deletedAt: null } }),
      prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null } }),
    ]);
    if (!project) throw new ApiError(404, "Không tìm thấy công trình.");
    if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp.");
  }

  private static async assertContract(contractId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, deletedAt: null },
      select: { id: true, projectId: true, supplierId: true, currentValue: true },
    });
    if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng.");
    if (!contract.supplierId) throw new ApiError(400, "Hợp đồng chưa gắn nhà cung cấp.");
    return contract;
  }

  private static async getFallbackWbsId(projectId: string) {
    const wbs = await prisma.wBSItem.findFirst({
      where: { projectId, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!wbs) {
      throw new ApiError(
        400,
        "Công trình chưa có WBS. Cần tạo ít nhất một hạng mục để lưu hóa đơn theo schema hiện tại.",
      );
    }
    return wbs.id;
  }

  private static mapContract(contract: any) {
    const totalAcceptance = contract.acceptances.reduce((sum: number, row: any) => sum + n(row.amount), 0);
    const totalInvoice = contract.invoices.reduce((sum: number, row: any) => sum + n(row.amount), 0);
    const totalPayment = contract.payments.reduce((sum: number, row: any) => sum + n(row.amount), 0);
    const contractValue = n(contract.currentValue);
    const payableBase = Math.min(totalAcceptance, totalInvoice);
    const debt = payableBase - totalPayment;
    const missingDocs = contract.documentChecklist.filter((doc: any) => doc.status !== "SUBMITTED");
    const plans = contract.paymentPlans.map((plan: any) => ({
      id: plan.id,
      dueDate: iso(plan.dueDate),
      amount: n(plan.amount),
      paymentMethod: plan.paymentMethod,
      note: plan.note,
      status: planStatus(plan.dueDate, n(plan.amount), totalPayment),
    }));

    const warnings: AccountingWarning[] = [];
    const href = `/accounting/contracts/${contract.id}`;

    if (totalAcceptance > contractValue) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Tổng nghiệm thu vượt giá trị hợp đồng.",
        amount: totalAcceptance - contractValue,
        documentType: "Contract",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (totalInvoice > totalAcceptance) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Tổng hóa đơn vượt tổng nghiệm thu.",
        amount: totalInvoice - totalAcceptance,
        documentType: "Invoice",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (totalPayment > totalAcceptance) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Tổng thanh toán vượt tổng nghiệm thu.",
        amount: totalPayment - totalAcceptance,
        documentType: "Payment",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (totalPayment > totalInvoice) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Tổng thanh toán vượt tổng hóa đơn.",
        amount: totalPayment - totalInvoice,
        documentType: "Payment",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (totalPayment > 0 && totalInvoice === 0) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Có thanh toán khi chưa có hóa đơn.",
        amount: totalPayment,
        documentType: "Payment",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (totalPayment > 0 && totalAcceptance === 0) {
      addWarning(warnings, {
        severity: "RED",
        reason: "Có thanh toán khi chưa có nghiệm thu.",
        amount: totalPayment,
        documentType: "Payment",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (debt < 0) {
      addWarning(warnings, {
        severity: "YELLOW",
        reason: "Công nợ âm bất thường.",
        amount: Math.abs(debt),
        documentType: "Contract",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    if (missingDocs.length > 0) {
      addWarning(warnings, {
        severity: "YELLOW",
        reason: "Hợp đồng thiếu hồ sơ chứng từ.",
        amount: missingDocs.length,
        documentType: "DocumentChecklist",
        documentId: contract.id,
        contractId: contract.id,
        href,
      });
    }
    plans
      .filter((plan: any) => plan.status === "DUE" || plan.status === "OVERDUE")
      .forEach((plan: any) =>
        addWarning(warnings, {
          severity: plan.status === "OVERDUE" ? "RED" : "YELLOW",
          reason: plan.status === "OVERDUE" ? "Kế hoạch thanh toán quá hạn." : "Kế hoạch thanh toán đến hạn.",
          amount: n(plan.amount),
          documentType: "PaymentPlan",
          documentId: plan.id,
          contractId: contract.id,
          href,
        }),
      );

    return {
      id: contract.id,
      projectId: contract.projectId,
      projectName: contract.project?.name || "",
      supplierId: contract.supplierId,
      supplierCode: contract.supplier?.code || "",
      supplierName: contract.supplier?.name || contract.contractorName || "Chưa rõ",
      contractCode: contract.contractCode || contract.contractNumber || contract.id.slice(0, 8),
      title: contract.title,
      contractValue,
      totalAcceptance,
      totalInvoice,
      totalPayment,
      debt,
      status: contract.status,
      signedDate: iso(contract.signedDate),
      acceptances: contract.acceptances.map((row: any) => ({
        id: row.id,
        acceptanceNumber: row.acceptanceNumber,
        amount: n(row.amount),
        date: iso(row.date),
        note: row.note,
        contractId: contract.id,
      })),
      invoices: contract.invoices.map((row: any) => ({
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        amount: n(row.amount),
        issuedDate: iso(row.issuedDate),
        dueDate: iso(row.dueDate),
        paidAmount: n(row.paidAmount),
        remainingAmount: n(row.remainingAmount),
        note: row.note,
        contractId: contract.id,
      })),
      payments: contract.payments.map((row: any) => ({
        id: row.id,
        invoiceId: row.invoiceId,
        amount: n(row.amount),
        date: iso(row.date),
        description: row.description,
        contractId: contract.id,
      })),
      paymentPlans: plans,
      documentChecklist: contract.documentChecklist.map((row: any) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        note: row.note,
      })),
      warnings,
    };
  }

  private static buildReports(contracts: any[]) {
    const bySupplier = new Map<string, any>();
    const byProject = new Map<string, any>();
    const byContract = contracts.map((contract) => ({
      contractId: contract.id,
      contractCode: contract.contractCode,
      projectId: contract.projectId,
      projectName: contract.projectName,
      supplierId: contract.supplierId,
      supplierCode: contract.supplierCode,
      supplierName: contract.supplierName,
      contractValue: contract.contractValue,
      acceptance: contract.totalAcceptance,
      invoice: contract.totalInvoice,
      payment: contract.totalPayment,
      debt: contract.debt,
      href: `/accounting/contracts/${contract.id}`,
    }));

    byContract.forEach((row) => {
      const supplierKey = row.supplierId || "NO_SUPPLIER";
      const supplier = bySupplier.get(supplierKey) || {
        supplierId: row.supplierId,
        supplierCode: row.supplierCode,
        supplierName: row.supplierName,
        contractValue: 0,
        acceptance: 0,
        invoice: 0,
        payment: 0,
        debt: 0,
      };
      supplier.contractValue += row.contractValue;
      supplier.acceptance += row.acceptance;
      supplier.invoice += row.invoice;
      supplier.payment += row.payment;
      supplier.debt += row.debt;
      bySupplier.set(supplierKey, supplier);

      const project = byProject.get(row.projectId) || {
        projectId: row.projectId,
        projectName: row.projectName,
        contractValue: 0,
        acceptance: 0,
        invoice: 0,
        payment: 0,
        debt: 0,
      };
      project.contractValue += row.contractValue;
      project.acceptance += row.acceptance;
      project.invoice += row.invoice;
      project.payment += row.payment;
      project.debt += row.debt;
      byProject.set(row.projectId, project);
    });

    return {
      advancePaymentBySupplier: Array.from(bySupplier.values()),
      payableBySupplier: Array.from(bySupplier.values()),
      payableByProject: Array.from(byProject.values()),
      payableByContract: byContract,
      acceptanceByContract: byContract,
      invoiceByContract: byContract,
      paymentByContract: byContract,
      overContractValue: byContract.filter((row) => row.acceptance > row.contractValue || row.invoice > row.contractValue || row.payment > row.contractValue),
      missingDocuments: contracts.flatMap((contract) =>
        contract.documentChecklist
          .filter((doc: any) => doc.status !== "SUBMITTED")
          .map((doc: any) => ({ ...doc, contractId: contract.id, contractCode: contract.contractCode, supplierName: contract.supplierName })),
      ),
      paymentPlan: contracts.flatMap((contract) =>
        contract.paymentPlans.map((plan: any) => ({ ...plan, contractId: contract.id, contractCode: contract.contractCode, supplierName: contract.supplierName })),
      ),
      overduePaymentPlan: contracts.flatMap((contract) =>
        contract.paymentPlans
          .filter((plan: any) => plan.status === "OVERDUE")
          .map((plan: any) => ({ ...plan, contractId: contract.id, contractCode: contract.contractCode, supplierName: contract.supplierName })),
      ),
      projectSummary: Array.from(byProject.values()),
      supplierAcrossProjects: Array.from(bySupplier.values()),
      projectAcrossSuppliers: byContract,
    };
  }
}
