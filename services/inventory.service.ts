import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { assertPeriodNotLocked } from "@/lib/period";
import { AuditService } from "./audit.service";
import { LoggerService } from "./logger.service";
import { InventoryPolicy } from "@/lib/accounting/inventoryPolicy";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { Decimal } from "decimal.js";
import {
  InventoryDocumentType,
  InventoryDocumentStatus,
  TransactionType,
  Prisma,
} from "../generated/prisma-client";

export interface CreateDocumentLineInput {
  materialItemId: string;
  quantity: number;
  unitCost: number;
  vatRate?: number;
  vatAmount?: number;
  debitAccount?: string;
  creditAccount?: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  projectId?: string;
  wbsId?: string;
}

export interface CreateDocumentInput {
  companyId?: string;
  projectId?: string;
  wbsId?: string;
  documentType: InventoryDocumentType;
  documentNo?: string;
  documentDate?: Date | string;
  accountingDate?: Date | string;
  supplierId?: string;
  contractId?: string;
  vatInvoiceId?: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  partnerName?: string;
  description?: string;
  lines: CreateDocumentLineInput[];
}

export class InventoryService {
  /**
   * Create Material Item
   */
  static async createMaterialItem(
    input: {
      companyId?: string;
      code: string;
      name: string;
      unit: string;
      group?: string;
      defaultWarehouseId?: string;
      inventoryAccount?: string;
      expenseAccount?: string;
      vatRate?: number;
    },
    userId: string
  ) {
    let finalCompanyId = input.companyId;
    if (!finalCompanyId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      finalCompanyId = user?.companyId || undefined;
    }
    if (!finalCompanyId) {
      throw new ApiError(400, "LỖI HỆ THỐNG: Người dùng không thuộc công ty/tenant nào");
    }

    const codeUpper = input.code.trim().toUpperCase();

    const existing = await prisma.materialItem.findFirst({
      where: {
        companyId: finalCompanyId,
        code: codeUpper,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ApiError(400, `Mã vật tư '${codeUpper}' đã tồn tại trong hệ thống.`);
    }

    const item = await prisma.materialItem.create({
      data: {
        companyId: finalCompanyId,
        code: codeUpper,
        name: input.name,
        unit: input.unit,
        group: input.group || null,
        defaultWarehouseId: input.defaultWarehouseId || null,
        inventoryAccount: input.inventoryAccount || "152",
        expenseAccount: input.expenseAccount || "621",
        vatRate: new Prisma.Decimal(input.vatRate ?? 10),
      },
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "MaterialItem",
      entityId: item.id,
      newData: item,
    });

    return item;
  }

  /**
   * Create Warehouse
   */
  static async createWarehouse(
    input: {
      companyId?: string;
      projectId?: string;
      code: string;
      name: string;
      address?: string;
      managerName?: string;
    },
    userId: string
  ) {
    let finalCompanyId = input.companyId;
    if (!finalCompanyId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      finalCompanyId = user?.companyId || undefined;
    }
    if (!finalCompanyId) {
      throw new ApiError(400, "LỖI HỆ THỐNG: Người dùng không thuộc công ty/tenant nào");
    }

    const codeUpper = input.code.trim().toUpperCase();

    const existing = await prisma.warehouse.findFirst({
      where: {
        companyId: finalCompanyId,
        code: codeUpper,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ApiError(400, `Mã kho '${codeUpper}' đã tồn tại trong hệ thống.`);
    }

    const wh = await prisma.warehouse.create({
      data: {
        companyId: finalCompanyId,
        projectId: input.projectId || null,
        code: codeUpper,
        name: input.name,
        address: input.address || null,
        managerName: input.managerName || null,
      },
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "Warehouse",
      entityId: wh.id,
      newData: wh,
    });

    return wh;
  }

  /**
   * Create Document (Draft)
   */
  static async createDocument(input: CreateDocumentInput, userId: string) {
    if (!input.lines || input.lines.length === 0) {
      throw new ApiError(400, "Phiếu kho phải có ít nhất một dòng vật tư chi tiết.");
    }

    const docDate = input.documentDate ? new Date(input.documentDate) : new Date();
    const accDate = input.accountingDate ? new Date(input.accountingDate) : new Date();

    await assertPeriodNotLocked(accDate);

    // Validate line maths
    for (const l of input.lines) {
      InventoryPolicy.validateLineMath(l.quantity, l.unitCost);
    }

    return prisma.$transaction(async (tx) => {
      let finalCompanyId = input.companyId;
      if (!finalCompanyId) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        finalCompanyId = user?.companyId || undefined;
      }
      if (!finalCompanyId) {
        throw new ApiError(400, "LỖI HỆ THỐNG: Người dùng không thuộc công ty/tenant nào");
      }

      // Generate documentNo
      let finalDocumentNo = input.documentNo;
      if (!finalDocumentNo) {
        const yearMonth = accDate.toISOString().slice(0, 7).replace("-", "");
        let prefix = "PN";
        if (
          input.documentType === "ISSUE_TO_PROJECT" ||
          input.documentType === "ISSUE_TO_COST" ||
          input.documentType === "TRANSFER_OUT" ||
          input.documentType === "ADJUSTMENT_OUT"
        ) {
          prefix = "PX";
        }
        const startsWithPattern = `${prefix}-${yearMonth}-`;
        const count = await tx.inventoryDocument.count({
          where: {
            companyId: finalCompanyId,
            documentType: input.documentType,
            documentNo: { startsWith: startsWithPattern },
            deletedAt: null,
          },
        });
        finalDocumentNo = `${startsWithPattern}${String(count + 1).padStart(4, "0")}`;
      }

      // Verify unique document number
      const existing = await tx.inventoryDocument.findFirst({
        where: {
          companyId: finalCompanyId,
          documentType: input.documentType,
          documentNo: finalDocumentNo,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ApiError(400, `Số chứng từ ${finalDocumentNo} đã tồn tại trong hệ thống.`);
      }

      // Calculate totals
      let net = new Decimal(0);
      let vat = new Decimal(0);

      const dbLinesData = [];
      for (const line of input.lines) {
        const qtyDec = new Decimal(line.quantity.toString());
        const costDec = new Decimal(line.unitCost.toString());
        const amtDec = qtyDec.times(costDec);
        net = net.plus(amtDec);

        const vRateDec = new Decimal((line.vatRate ?? 0).toString());
        const vAmtDec = line.vatAmount
          ? new Decimal(line.vatAmount.toString())
          : amtDec.times(vRateDec.dividedBy(100)).toDecimalPlaces(2);
        vat = vat.plus(vAmtDec);

        dbLinesData.push({
          materialItemId: line.materialItemId,
          quantity: new Prisma.Decimal(line.quantity.toString()),
          unitCost: new Prisma.Decimal(line.unitCost.toString()),
          amount: new Prisma.Decimal(amtDec.toString()),
          vatRate: new Prisma.Decimal((line.vatRate ?? 0).toString()),
          vatAmount: new Prisma.Decimal(vAmtDec.toString()),
          grossAmount: new Prisma.Decimal(amtDec.plus(vAmtDec).toString()),
          debitAccount: line.debitAccount || null,
          creditAccount: line.creditAccount || null,
          sourceWarehouseId: line.sourceWarehouseId || input.sourceWarehouseId || null,
          targetWarehouseId: line.targetWarehouseId || input.targetWarehouseId || null,
          projectId: line.projectId || input.projectId || null,
          wbsId: line.wbsId || input.wbsId || null,
        });
      }

      const gross = net.plus(vat);

      const doc = await tx.inventoryDocument.create({
        data: {
          companyId: finalCompanyId,
          projectId: input.projectId || null,
          wbsId: input.wbsId || null,
          documentType: input.documentType,
          documentNo: finalDocumentNo,
          documentDate: docDate,
          accountingDate: accDate,
          status: "DRAFT",
          supplierId: input.supplierId || null,
          contractId: input.contractId || null,
          vatInvoiceId: input.vatInvoiceId || null,
          sourceWarehouseId: input.sourceWarehouseId || null,
          targetWarehouseId: input.targetWarehouseId || null,
          partnerName: input.partnerName || null,
          description: input.description || null,
          netAmount: new Prisma.Decimal(net.toString()),
          vatAmount: new Prisma.Decimal(vat.toString()),
          grossAmount: new Prisma.Decimal(gross.toString()),
          createdBy: userId,
          lines: {
            create: dbLinesData,
          },
        },
        include: {
          lines: {
            include: {
              material: true,
            },
          },
        },
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "InventoryDocument",
        entityId: doc.id,
        newData: doc,
      });

      await LoggerService.info(`Created InventoryDocument ${doc.documentNo} (${doc.documentType}) by user ${userId}`);
      return doc;
    });
  }

  /**
   * Update Document (Draft only)
   */
  static async updateDocument(id: string, input: Partial<CreateDocumentInput>, userId: string) {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "DRAFT") {
      throw new ApiError(400, "Chỉ chứng từ ở trạng thái Nháp (DRAFT) mới có thể chỉnh sửa.");
    }

    const accDate = input.accountingDate ? new Date(input.accountingDate) : doc.accountingDate;
    await assertPeriodNotLocked(accDate);

    // If new lines are provided, validate them
    if (input.lines) {
      if (input.lines.length === 0) throw new ApiError(400, "Phiếu kho phải có ít nhất một dòng.");
      for (const l of input.lines) {
        InventoryPolicy.validateLineMath(l.quantity, l.unitCost);
      }
    }

    return prisma.$transaction(async (tx) => {
      // If updating lines, delete the old ones first
      if (input.lines) {
        await tx.inventoryDocumentLine.deleteMany({
          where: { inventoryDocumentId: id },
        });

        // Calculate totals
        let net = new Decimal(0);
        let vat = new Decimal(0);

        const dbLinesData = [];
        for (const line of input.lines) {
          const qtyDec = new Decimal(line.quantity.toString());
          const costDec = new Decimal(line.unitCost.toString());
          const amtDec = qtyDec.times(costDec);
          net = net.plus(amtDec);

          const vRateDec = new Decimal((line.vatRate ?? 0).toString());
          const vAmtDec = line.vatAmount
            ? new Decimal(line.vatAmount.toString())
            : amtDec.times(vRateDec.dividedBy(100)).toDecimalPlaces(2);
          vat = vat.plus(vAmtDec);

          dbLinesData.push({
            inventoryDocumentId: id,
            materialItemId: line.materialItemId,
            quantity: new Prisma.Decimal(line.quantity.toString()),
            unitCost: new Prisma.Decimal(line.unitCost.toString()),
            amount: new Prisma.Decimal(amtDec.toString()),
            vatRate: new Prisma.Decimal((line.vatRate ?? 0).toString()),
            vatAmount: new Prisma.Decimal(vAmtDec.toString()),
            grossAmount: new Prisma.Decimal(amtDec.plus(vAmtDec).toString()),
            debitAccount: line.debitAccount || null,
            creditAccount: line.creditAccount || null,
            sourceWarehouseId: line.sourceWarehouseId || input.sourceWarehouseId || doc.sourceWarehouseId || null,
            targetWarehouseId: line.targetWarehouseId || input.targetWarehouseId || doc.targetWarehouseId || null,
            projectId: line.projectId || input.projectId || doc.projectId || null,
            wbsId: line.wbsId || input.wbsId || doc.wbsId || null,
          });
        }

        const gross = net.plus(vat);

        await tx.inventoryDocumentLine.createMany({
          data: dbLinesData,
        });

        await tx.inventoryDocument.update({
          where: { id },
          data: {
            netAmount: new Prisma.Decimal(net.toString()),
            vatAmount: new Prisma.Decimal(vat.toString()),
            grossAmount: new Prisma.Decimal(gross.toString()),
          },
        });
      }

      // Update remaining header fields
      const updated = await tx.inventoryDocument.update({
        where: { id },
        data: {
          projectId: input.projectId !== undefined ? input.projectId : doc.projectId,
          wbsId: input.wbsId !== undefined ? input.wbsId : doc.wbsId,
          documentDate: input.documentDate ? new Date(input.documentDate) : doc.documentDate,
          accountingDate: accDate,
          supplierId: input.supplierId !== undefined ? input.supplierId : doc.supplierId,
          contractId: input.contractId !== undefined ? input.contractId : doc.contractId,
          vatInvoiceId: input.vatInvoiceId !== undefined ? input.vatInvoiceId : doc.vatInvoiceId,
          sourceWarehouseId: input.sourceWarehouseId !== undefined ? input.sourceWarehouseId : doc.sourceWarehouseId,
          targetWarehouseId: input.targetWarehouseId !== undefined ? input.targetWarehouseId : doc.targetWarehouseId,
          partnerName: input.partnerName !== undefined ? input.partnerName : doc.partnerName,
          description: input.description !== undefined ? input.description : doc.description,
        },
        include: {
          lines: {
            include: {
              material: true,
            },
          },
        },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "InventoryDocument",
        entityId: id,
        newData: updated,
      });

      return updated;
    });
  }

  /**
   * Submit Document
   */
  static async submitDocument(id: string, userId: string) {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "DRAFT") {
      throw new ApiError(400, "Chỉ chứng từ ở trạng thái Nháp (DRAFT) mới có thể trình duyệt.");
    }

    await assertPeriodNotLocked(doc.accountingDate);

    const updated = await prisma.inventoryDocument.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    await AuditService.log({
      userId,
      action: "SUBMIT",
      entity: "InventoryDocument",
      entityId: id,
      newData: updated,
    });

    return updated;
  }

  /**
   * Reject Document
   */
  static async rejectDocument(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Lý do từ chối duyệt chứng từ phải có tối thiểu 5 ký tự.");
    }

    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "SUBMITTED") {
      throw new ApiError(400, "Chỉ chứng từ ở trạng thái Chờ duyệt (SUBMITTED) mới có thể từ chối.");
    }

    // Segregation of Duties - Creator cannot approve/reject
    if (doc.createdBy === userId) {
      throw new ApiError(403, "Nguyên tắc bất kiêm nhiệm: Người tạo phiếu không được phép phê duyệt hoặc từ chối phiếu của mình.");
    }

    await assertPeriodNotLocked(doc.accountingDate);

    const updated = await prisma.inventoryDocument.update({
      where: { id },
      data: {
        status: "DRAFT",
        rejectReason: reason,
      },
    });

    await AuditService.log({
      userId,
      action: "REJECT",
      entity: "InventoryDocument",
      entityId: id,
      newData: updated,
    });

    return updated;
  }

  /**
   * Approve Document
   */
  static async approveDocument(id: string, userId: string) {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "SUBMITTED") {
      throw new ApiError(400, "Chỉ chứng từ ở trạng thái Chờ duyệt (SUBMITTED) mới có thể duyệt.");
    }

    // Segregation of Duties - Creator cannot approve
    if (doc.createdBy === userId) {
      throw new ApiError(403, "Nguyên tắc bất kiêm nhiệm: Người tạo phiếu không được phép phê duyệt hoặc từ chối phiếu của mình.");
    }

    await assertPeriodNotLocked(doc.accountingDate);

    const updated = await prisma.inventoryDocument.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    await AuditService.log({
      userId,
      action: "APPROVE",
      entity: "InventoryDocument",
      entityId: id,
      newData: updated,
    });

    return updated;
  }

  /**
   * Post Document to Ledger & update stock balance
   */
  static async postDocument(id: string, userId: string) {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "APPROVED") {
      throw new ApiError(400, "Chỉ chứng từ đã duyệt (APPROVED) mới có thể hạch toán ghi sổ.");
    }

    await assertPeriodNotLocked(doc.accountingDate);

    return prisma.$transaction(async (tx) => {
      const journalLines = [];

      for (const line of doc.lines) {
        const material = line.material;
        const qtyDec = new Decimal(line.quantity.toString());

        // Determine if this line acts as an Input (Receipt) or Output (Issue)
        const isInput =
          doc.documentType === "PURCHASE_RECEIPT" ||
          doc.documentType === "RETURN_RECEIPT" ||
          doc.documentType === "ADJUSTMENT_IN" ||
          doc.documentType === "TRANSFER_IN";

        const isTransfer = doc.documentType === "TRANSFER_OUT" || doc.documentType === "TRANSFER_IN";

        // Warehouse checks
        const whId = isInput ? line.targetWarehouseId : line.sourceWarehouseId;
        if (!whId) {
          throw new ApiError(400, `Dòng hàng thiếu thông tin Kho tương ứng với loại chứng từ ${doc.documentType}.`);
        }

        const wh = await tx.warehouse.findUnique({ where: { id: whId } });
        if (!wh) throw new ApiError(404, `Không tìm thấy kho ID ${whId}`);

        // Get current balance
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            warehouseId_materialItemId_projectId_wbsId: {
              warehouseId: whId,
              materialItemId: line.materialItemId,
              projectId: line.projectId || "GLOBAL",
              wbsId: line.wbsId || "GLOBAL",
            },
          },
        });

        const currentQty = balance ? new Decimal(balance.quantity.toString()) : new Decimal(0);
        const currentTotalCost = balance ? new Decimal(balance.totalCost.toString()) : new Decimal(0);
        const currentAvgCost = balance ? new Decimal(balance.avgCost.toString()) : new Decimal(0);

        let finalUnitCost = new Decimal(line.unitCost.toString());
        let finalAmount = new Decimal(line.amount.toString());

        if (isInput) {
          // INPUT logic (Receipts): Moving Average Cost updating
          const nextState = InventoryPolicy.calculateMovingAverage(
            currentQty,
            currentTotalCost,
            qtyDec,
            finalAmount
          );

          await tx.inventoryBalance.upsert({
            where: {
              warehouseId_materialItemId_projectId_wbsId: {
                warehouseId: whId,
                materialItemId: line.materialItemId,
                projectId: line.projectId || "GLOBAL",
                wbsId: line.wbsId || "GLOBAL",
              },
            },
            create: {
              companyId: doc.companyId,
              warehouseId: whId,
              materialItemId: line.materialItemId,
              projectId: line.projectId || "GLOBAL",
              wbsId: line.wbsId || "GLOBAL",
              quantity: new Prisma.Decimal(nextState.qty.toString()),
              totalCost: new Prisma.Decimal(nextState.totalCost.toString()),
              avgCost: new Prisma.Decimal(nextState.avgCost.toString()),
            },
            update: {
              quantity: new Prisma.Decimal(nextState.qty.toString()),
              totalCost: new Prisma.Decimal(nextState.totalCost.toString()),
              avgCost: new Prisma.Decimal(nextState.avgCost.toString()),
            },
          });

          // Insert Movement
          await tx.inventoryMovement.create({
            data: {
              companyId: doc.companyId,
              inventoryDocumentId: doc.id,
              inventoryDocumentLineId: line.id,
              materialItemId: line.materialItemId,
              warehouseId: whId,
              projectId: line.projectId || null,
              wbsId: line.wbsId || null,
              movementDate: doc.accountingDate,
              documentType: doc.documentType,
              documentNo: doc.documentNo,
              quantity: new Prisma.Decimal(qtyDec.toString()),
              unitCost: new Prisma.Decimal(finalUnitCost.toString()),
              amount: new Prisma.Decimal(finalAmount.toString()),
            },
          });
        } else {
          // OUTPUT logic (Issues): grab current average cost as final unit cost!
          finalUnitCost = currentAvgCost.greaterThan(0) ? currentAvgCost : new Decimal(line.unitCost.toString());
          finalAmount = qtyDec.times(finalUnitCost).toDecimalPlaces(2);

          // Negative Stock Check
          InventoryPolicy.assertStockAvailable(currentQty, qtyDec, material.code, wh.code);

          const nextQty = currentQty.minus(qtyDec);
          const nextTotal = currentTotalCost.minus(finalAmount);

          await tx.inventoryBalance.update({
            where: {
              warehouseId_materialItemId_projectId_wbsId: {
                warehouseId: whId,
                materialItemId: line.materialItemId,
                projectId: line.projectId || "GLOBAL",
                wbsId: line.wbsId || "GLOBAL",
              },
            },
            data: {
              quantity: new Prisma.Decimal(nextQty.toString()),
              totalCost: new Prisma.Decimal(nextTotal.toString()),
              // avgCost stays the same when issuing
            },
          });

          // Update actual issue cost on document line for audit trail
          await tx.inventoryDocumentLine.update({
            where: { id: line.id },
            data: {
              unitCost: new Prisma.Decimal(finalUnitCost.toString()),
              amount: new Prisma.Decimal(finalAmount.toString()),
              grossAmount: new Prisma.Decimal(finalAmount.toString()),
            },
          });

          // Insert Movement (as negative quantity!)
          await tx.inventoryMovement.create({
            data: {
              companyId: doc.companyId,
              inventoryDocumentId: doc.id,
              inventoryDocumentLineId: line.id,
              materialItemId: line.materialItemId,
              warehouseId: whId,
              projectId: line.projectId || null,
              wbsId: line.wbsId || null,
              movementDate: doc.accountingDate,
              documentType: doc.documentType,
              documentNo: doc.documentNo,
              quantity: new Prisma.Decimal(qtyDec.negated().toString()),
              unitCost: new Prisma.Decimal(finalUnitCost.toString()),
              amount: new Prisma.Decimal(finalAmount.toString()),
            },
          });
        }

        // Hạch toán kế toán kép (Double Entry logic)
        const debitAcct = line.debitAccount || (isInput ? material.inventoryAccount : material.expenseAccount);
        const creditAcct = line.creditAccount || (isInput ? "3310" : material.inventoryAccount);

        if (finalAmount.greaterThan(0)) {
          journalLines.push({ accountCode: debitAcct, amount: Number(finalAmount), type: TransactionType.DEBIT });
          journalLines.push({ accountCode: creditAcct, amount: Number(finalAmount), type: TransactionType.CREDIT });
        }
      }

      // Create Double Entry Journal
      let journalEntryId = null;
      if (journalLines.length > 0) {
        // Create matching debits and credits journal entry
        const entry = await tx.journalEntry.create({
          data: {
            projectId: doc.projectId || null,
            description: doc.description || `Ghi sổ phiếu kho ${doc.documentNo}`,
            reference: `${doc.documentType}-${doc.documentNo}`,
            sourceType: doc.documentType.toString(),
            sourceId: doc.id,
            isPosted: true,
          },
        });

        const codes = journalLines.map((l) => l.accountCode);
        const accounts = await tx.ledgerAccount.findMany({
          where: { code: { in: codes } },
        });
        const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));

        for (const line of journalLines) {
          const accountId = accountMap.get(line.accountCode);
          if (!accountId) {
            throw new ApiError(500, `Tài khoản '${line.accountCode}' không tồn tại trong danh mục tài khoản kế toán.`);
          }

          await tx.transactionLine.create({
            data: {
              journalEntryId: entry.id,
              accountId,
              amount: new Prisma.Decimal(line.amount.toString()),
              type: line.type,
              description: doc.description || `Hạch toán dòng phiếu kho ${doc.documentNo}`,
            },
          });
        }

        journalEntryId = entry.id;
      }

      // Update document status to POSTED
      const updated = await tx.inventoryDocument.update({
        where: { id },
        data: {
          status: "POSTED",
          postedJournalEntryId: journalEntryId,
        },
        include: {
          lines: {
            include: {
              material: true,
            },
          },
        },
      });

      await AuditService.log({
        userId,
        action: "POST",
        entity: "InventoryDocument",
        entityId: id,
        newData: updated,
      });

      await LoggerService.info(`Posted InventoryDocument ${doc.documentNo} and created JournalEntry ${journalEntryId}`);
      return updated;
    });
  }

  /**
   * Reverse Posted Document (immutable ledger policy)
   */
  static async reverseDocument(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Lý do hủy ghi sổ/đảo bút toán phải có tối thiểu 5 ký tự.");
    }

    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.status !== "POSTED") {
      throw new ApiError(400, "Chỉ chứng từ đã ghi sổ (POSTED) mới có thể thực hiện hủy ghi sổ/bút toán đảo.");
    }

    await assertPeriodNotLocked(doc.accountingDate);

    return prisma.$transaction(async (tx) => {
      // 1. Create counter-balancing movements (Reversing the balance impacts!)
      for (const line of doc.lines) {
        const isInput =
          doc.documentType === "PURCHASE_RECEIPT" ||
          doc.documentType === "RETURN_RECEIPT" ||
          doc.documentType === "ADJUSTMENT_IN" ||
          doc.documentType === "TRANSFER_IN";

        const whId = isInput ? line.targetWarehouseId : line.sourceWarehouseId;
        if (!whId) continue;

        const balance = await tx.inventoryBalance.findUnique({
          where: {
            warehouseId_materialItemId_projectId_wbsId: {
              warehouseId: whId,
              materialItemId: line.materialItemId,
              projectId: line.projectId || "GLOBAL",
              wbsId: line.wbsId || "GLOBAL",
            },
          },
        });

        const currentQty = balance ? new Decimal(balance.quantity.toString()) : new Decimal(0);
        const currentTotalCost = balance ? new Decimal(balance.totalCost.toString()) : new Decimal(0);
        const qtyDec = new Decimal(line.quantity.toString());
        const amtDec = new Decimal(line.amount.toString());

        if (isInput) {
          // INPUT: reversing means subtracting the input quantity and cost!
          const nextQty = currentQty.minus(qtyDec);
          const nextTotal = currentTotalCost.minus(amtDec);
          let nextAvg = new Decimal(0);
          if (nextQty.greaterThan(0)) {
            nextAvg = nextTotal.dividedBy(nextQty).toDecimalPlaces(2);
          }

          await tx.inventoryBalance.update({
            where: {
              warehouseId_materialItemId_projectId_wbsId: {
                warehouseId: whId,
                materialItemId: line.materialItemId,
                projectId: line.projectId || "GLOBAL",
                wbsId: line.wbsId || "GLOBAL",
              },
            },
            data: {
              quantity: new Prisma.Decimal(nextQty.toString()),
              totalCost: new Prisma.Decimal(nextTotal.toString()),
              avgCost: new Prisma.Decimal(nextAvg.toString()),
            },
          });

          // Counter movement
          await tx.inventoryMovement.create({
            data: {
              companyId: doc.companyId,
              inventoryDocumentId: doc.id,
              inventoryDocumentLineId: line.id,
              materialItemId: line.materialItemId,
              warehouseId: whId,
              projectId: line.projectId || null,
              wbsId: line.wbsId || null,
              movementDate: new Date(),
              documentType: doc.documentType,
              documentNo: `${doc.documentNo}-REV`,
              quantity: new Prisma.Decimal(qtyDec.negated().toString()),
              unitCost: new Prisma.Decimal(line.unitCost.toString()),
              amount: new Prisma.Decimal(amtDec.toString()),
            },
          });
        } else {
          // OUTPUT: reversing means ADDING back the issued quantity and cost!
          const nextQty = currentQty.plus(qtyDec);
          const nextTotal = currentTotalCost.plus(amtDec);
          let nextAvg = new Decimal(0);
          if (nextQty.greaterThan(0)) {
            nextAvg = nextTotal.dividedBy(nextQty).toDecimalPlaces(2);
          }

          await tx.inventoryBalance.update({
            where: {
              warehouseId_materialItemId_projectId_wbsId: {
                warehouseId: whId,
                materialItemId: line.materialItemId,
                projectId: line.projectId || "GLOBAL",
                wbsId: line.wbsId || "GLOBAL",
              },
            },
            data: {
              quantity: new Prisma.Decimal(nextQty.toString()),
              totalCost: new Prisma.Decimal(nextTotal.toString()),
              avgCost: new Prisma.Decimal(nextAvg.toString()),
            },
          });

          // Counter movement
          await tx.inventoryMovement.create({
            data: {
              companyId: doc.companyId,
              inventoryDocumentId: doc.id,
              inventoryDocumentLineId: line.id,
              materialItemId: line.materialItemId,
              warehouseId: whId,
              projectId: line.projectId || null,
              wbsId: line.wbsId || null,
              movementDate: new Date(),
              documentType: doc.documentType,
              documentNo: `${doc.documentNo}-REV`,
              quantity: new Prisma.Decimal(qtyDec.toString()),
              unitCost: new Prisma.Decimal(line.unitCost.toString()),
              amount: new Prisma.Decimal(amtDec.toString()),
            },
          });
        }
      }

      // 2. Create Reversal double-entry journal (bút toán đảo số tiền âm)
      let reversalId = null;
      if (doc.postedJournalEntryId) {
        const originalEntry = await tx.journalEntry.findUnique({
          where: { id: doc.postedJournalEntryId },
          include: { lines: true },
        });

        if (originalEntry) {
          const revEntry = await tx.journalEntry.create({
            data: {
              projectId: doc.projectId || null,
              description: `Hủy ghi sổ (Bút toán đảo) cho phiếu kho ${doc.documentNo}: ${reason}`,
              reference: `REV-${doc.documentNo}`,
              sourceType: doc.documentType.toString(),
              sourceId: doc.id,
              isPosted: true,
            },
          });

          for (const line of originalEntry.lines) {
            await tx.transactionLine.create({
              data: {
                journalEntryId: revEntry.id,
                accountId: line.accountId,
                amount: new Prisma.Decimal(new Decimal(line.amount.toString()).negated().toString()), // Số tiền âm!
                type: line.type,
                description: `Bút toán đảo cho dòng phiếu kho ${doc.documentNo}`,
              },
            });
          }

          reversalId = revEntry.id;
        }
      }

      // 3. Update document status to REVERSED
      const updated = await tx.inventoryDocument.update({
        where: { id },
        data: {
          status: "REVERSED",
          reversalJournalEntryId: reversalId,
        },
        include: {
          lines: {
            include: {
              material: true,
            },
          },
        },
      });

      await AuditService.log({
        userId,
        action: "REVERSE",
        entity: "InventoryDocument",
        entityId: id,
        newData: updated,
      });

      await LoggerService.info(`Reversed InventoryDocument ${doc.documentNo} (ReversalEntry: ${reversalId})`);
      return updated;
    });
  }

  /**
   * soft-delete document (Draft only)
   */
  static async deleteDocument(id: string, companyId: string, userId: string) {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ.");
    if (doc.companyId !== companyId) throw new ApiError(403, "Lỗi phân quyền: Không được phép truy cập.");
    if (doc.status !== "DRAFT" && doc.status !== "CANCELLED") {
      throw new ApiError(400, "Chỉ chứng từ bản nháp (DRAFT) hoặc Đã hủy (CANCELLED) mới được xóa.");
    }

    const updated = await prisma.inventoryDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await AuditService.log({
      userId,
      action: "DELETE",
      entity: "InventoryDocument",
      entityId: id,
      newData: updated,
    });

    return updated;
  }
}
