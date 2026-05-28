import { prisma } from "@/lib/prisma";

export class VoucherNumberService {
  /**
   * Sinh số chứng từ tự động tăng dần theo loại và năm tài chính.
   * Sử dụng SELECT FOR UPDATE khóa mức dòng (Row-level Locking) trong PostgreSQL để đảm bảo tính an toàn Concurrency tuyệt đối.
   * 
   * @param tx Prisma Transaction client (bắt buộc để khóa dòng trong cùng transaction)
   * @param companyId ID Doanh nghiệp (multi-tenant isolation)
   * @param type Mã loại chứng từ (PT, PC, UNC, BC, BN, PN, PX, PKT)
   * @param date Ngày chứng từ để lấy năm tài chính
   */
  static async generateNextNumber(
    tx: any,
    companyId: string,
    type: string,
    date: Date | string
  ): Promise<string> {
    const year = new Date(date).getFullYear();
    const allowedTypes = ["PT", "PC", "UNC", "BC", "BN", "PN", "PX", "PKT"];

    if (!allowedTypes.includes(type)) {
      throw new Error(`Loại chứng từ '${type}' không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`);
    }

    // Đảm bảo bản ghi sequence đã tồn tại bằng ON CONFLICT DO NOTHING
    await tx.$executeRawUnsafe(
      `INSERT INTO "VoucherSequence" ("id", "companyId", "type", "year", "current", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 0, NOW(), NOW())
       ON CONFLICT ("companyId", "type", "year") DO NOTHING`,
      companyId,
      type,
      year
    );

    // Khóa dòng và đọc giá trị hiện tại (SELECT FOR UPDATE)
    const rows = (await tx.$queryRawUnsafe(
      `SELECT "current" FROM "VoucherSequence" WHERE "companyId" = $1 AND "type" = $2 AND "year" = $3 FOR UPDATE`,
      companyId,
      type,
      year
    )) as any[];

    if (rows.length === 0) {
      throw new Error("Không thể khóa hoặc tìm thấy VoucherSequence.");
    }

    const currentVal = rows[0].current;
    const nextVal = currentVal + 1;

    // Cập nhật giá trị mới
    await tx.$executeRawUnsafe(
      `UPDATE "VoucherSequence" SET "current" = $1, "updatedAt" = NOW() WHERE "companyId" = $2 AND "type" = $3 AND "year" = $4`,
      nextVal,
      companyId,
      type,
      year
    );

    // Định dạng: Loại + Năm + 6 số tăng dần (ví dụ: PT2026000001)
    const paddedNum = String(nextVal).padStart(6, "0");
    return `${type}${year}${paddedNum}`;
  }
}
