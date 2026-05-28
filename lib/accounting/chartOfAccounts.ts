import { AccountType } from "@prisma/client";

/**
 * Hệ thống tài khoản kế toán chuẩn Việt Nam theo Thông tư 200/2014/TT-BTC.
 */
export const CHART_OF_ACCOUNTS = [
  // TÀI SẢN (ASSETS) - Đầu 1 & 2
  { code: "111", name: "Tiền mặt", type: AccountType.ASSET, parentCode: null },
  { code: "1111", name: "Tiền Việt Nam", type: AccountType.ASSET, parentCode: "111" },
  { code: "1112", name: "Ngoại tệ", type: AccountType.ASSET, parentCode: "111" },
  
  { code: "112", name: "Tiền gửi ngân hàng", type: AccountType.ASSET, parentCode: null },
  { code: "1121", name: "Tiền Việt Nam gửi ngân hàng", type: AccountType.ASSET, parentCode: "112" },
  { code: "1122", name: "Ngoại tệ gửi ngân hàng", type: AccountType.ASSET, parentCode: "112" },
  
  { code: "131", name: "Phải thu của khách hàng", type: AccountType.ASSET, parentCode: null },
  { code: "133", name: "Thuế GTGT được khấu trừ", type: AccountType.ASSET, parentCode: null },
  { code: "136", name: "Phải thu nội bộ", type: AccountType.ASSET, parentCode: null },
  { code: "138", name: "Phải thu khác", type: AccountType.ASSET, parentCode: null },
  { code: "141", name: "Tạm ứng", type: AccountType.ASSET, parentCode: null },
  
  { code: "152", name: "Nguyên liệu, vật liệu", type: AccountType.ASSET, parentCode: null },
  { code: "1521", name: "Vật liệu chính", type: AccountType.ASSET, parentCode: "152" },
  { code: "1522", name: "Vật liệu phụ", type: AccountType.ASSET, parentCode: "152" },
  
  { code: "153", name: "Công cụ, dụng cụ", type: AccountType.ASSET, parentCode: null },
  { code: "154", name: "Chi phí sản xuất, kinh doanh dở dang", type: AccountType.ASSET, parentCode: null },
  
  { code: "211", name: "Tài sản cố định hữu hình", type: AccountType.ASSET, parentCode: null },
  { code: "214", name: "Hao mòn tài sản cố định", type: AccountType.ASSET, parentCode: null },

  // NỢ PHẢI TRẢ (LIABILITIES) - Đầu 3 & 4
  { code: "331", name: "Phải trả cho người bán", type: AccountType.LIABILITY, parentCode: null },
  { code: "333", name: "Thuế và các khoản phải nộp Nhà nước", type: AccountType.LIABILITY, parentCode: null },
  { code: "334", name: "Phải trả người lao động", type: AccountType.LIABILITY, parentCode: null },
  { code: "338", name: "Phải trả, phải nộp khác", type: AccountType.LIABILITY, parentCode: null },
  { code: "341", name: "Vay và nợ thuê tài chính", type: AccountType.LIABILITY, parentCode: null },

  // VỐN CHỦ SỞ HỮU (EQUITY) - Đầu 4
  { code: "411", name: "Vốn đầu tư của chủ sở hữu", type: AccountType.EQUITY, parentCode: null },

  // DOANH THU & THU NHẬP (INCOME) - Đầu 5 & 7
  { code: "511", name: "Doanh thu bán hàng và cung cấp dịch vụ", type: AccountType.INCOME, parentCode: null },
  { code: "515", name: "Doanh thu hoạt động tài chính", type: AccountType.INCOME, parentCode: null },
  { code: "711", name: "Thu nhập khác", type: AccountType.INCOME, parentCode: null },

  // CHI PHÍ (EXPENSES) - Đầu 6 & 8
  { code: "621", name: "Chi phí nguyên liệu, vật liệu trực tiếp", type: AccountType.EXPENSE, parentCode: null },
  { code: "622", name: "Chi phí nhân công trực tiếp", type: AccountType.EXPENSE, parentCode: null },
  { code: "623", name: "Chi phí sử dụng máy thi công", type: AccountType.EXPENSE, parentCode: null },
  
  { code: "627", name: "Chi phí sản xuất chung", type: AccountType.EXPENSE, parentCode: null },
  { code: "6271", name: "Chi phí nhân viên phân xưởng", type: AccountType.EXPENSE, parentCode: "627" },
  { code: "6272", name: "Chi phí vật liệu phân xưởng", type: AccountType.EXPENSE, parentCode: "627" },
  
  { code: "632", name: "Giá vốn hàng bán", type: AccountType.EXPENSE, parentCode: null },
  { code: "635", name: "Chi phí tài chính", type: AccountType.EXPENSE, parentCode: null },
  { code: "642", name: "Chi phí quản lý doanh nghiệp", type: AccountType.EXPENSE, parentCode: null },
  { code: "811", name: "Chi phí khác", type: AccountType.EXPENSE, parentCode: null },
  { code: "821", name: "Chi phí thuế thu nhập doanh nghiệp", type: AccountType.EXPENSE, parentCode: null },

  // XÁC ĐỊNH KẾT QUẢ KINH DOANH - Đầu 9
  { code: "911", name: "Xác định kết quả kinh doanh", type: AccountType.EQUITY, parentCode: null },
];

export async function seedChartOfAccounts(tx: any) {
  // Bước 1: Upsert tất cả tài khoản mà không quan tâm đến parentId trước (tránh lỗi vi phạm khóa ngoại)
  for (const account of CHART_OF_ACCOUNTS) {
    await tx.ledgerAccount.upsert({
      where: { code: account.code },
      update: { 
        name: account.name, 
        type: account.type,
        isActive: true,
        deletedAt: null
      },
      create: {
        code: account.code,
        name: account.name,
        type: account.type,
        isActive: true
      },
    });
  }

  // Bước 2: Thiết lập mối quan hệ parentId dựa trên parentCode
  for (const account of CHART_OF_ACCOUNTS) {
    if (account.parentCode) {
      const parentAcc = await tx.ledgerAccount.findUnique({
        where: { code: account.parentCode }
      });
      if (parentAcc) {
        await tx.ledgerAccount.update({
          where: { code: account.code },
          data: { parentId: parentAcc.id }
        });
      }
    }
  }
}
