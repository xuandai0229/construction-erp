import { ApiError } from "@/lib/api-error";

export type DocumentGovernanceInput = {
  sourceType?: string | null;
  sourceId?: string | null;
  projectId?: string | null;
};

export type DocumentRequirement = {
  type: string;
  label: string;
};

const REQUIREMENTS: Record<string, DocumentRequirement[]> = {
  PT: [
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
  ],
  BC: [
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
  ],
  PC: [
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
  ],
  UNC: [
    { type: "UNC", label: "Ủy nhiệm chi" },
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
  ],
  INVOICE: [
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
    { type: "BIEN_BAN_NGHIEM_THU", label: "Biên bản nghiệm thu" },
  ],
  PAYMENT: [
    { type: "UNC", label: "Ủy nhiệm chi" },
    { type: "HOA_DON", label: "Hóa đơn" },
    { type: "HOP_DONG", label: "Hợp đồng" },
  ],
};

export class DocumentGovernance {
  static getRequiredDocuments(sourceType?: string | null): DocumentRequirement[] {
    const key = (sourceType || "").toUpperCase();
    return REQUIREMENTS[key] || [];
  }

  static evaluate(input: DocumentGovernanceInput, documents: Array<{ type: string; deletedAt?: Date | null }>) {
    const required = this.getRequiredDocuments(input.sourceType);
    const submitted = new Set(
      documents
        .filter(doc => !doc.deletedAt)
        .map(doc => doc.type.toUpperCase())
    );
    const missing = required.filter(req => !submitted.has(req.type));

    return {
      status: missing.length === 0 ? "DU_HO_SO" : "THIEU_HO_SO",
      required,
      missing,
      submitted: Array.from(submitted),
    };
  }

  static assertComplete(input: DocumentGovernanceInput, documents: Array<{ type: string; deletedAt?: Date | null }>) {
    const result = this.evaluate(input, documents);
    if (result.missing.length > 0) {
      throw new ApiError(
        400,
        `Chứng từ thiếu hồ sơ bắt buộc: ${result.missing.map(item => item.label).join(", ")}. Không được ghi sổ.`
      );
    }
    return result;
  }
}
