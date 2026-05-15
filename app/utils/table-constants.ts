/**
 * Enterprise ERP Table Column Standardized Widths
 * Ensures mathematical alignment between Header, Body, and Footer across all modules.
 */

export const COL_WIDTHS = {
  INDEX: 'w-16',           // 64px
  INDEX_NUM: 64,

  NAME_WBS: 'w-[320px]',
  NAME_WBS_NUM: 320,

  FINANCIAL: 'w-[160px]',  // Increased from 140px to prevent header clipping
  FINANCIAL_NUM: 160,

  PROGRESS: 'w-[120px]',   // 120px
  PROGRESS_NUM: 120,

  STATUS: 'w-[125px]',     // Increased from 110px to prevent header clipping
  STATUS_NUM: 125,

  ACTIONS: 'w-[110px]',    // Increased from 100px to prevent icon clipping
  ACTIONS_NUM: 110,

  DATE: 'w-[130px]',       // Significantly increased from 95px to fit "NGÀY KHỞI CÔNG"
  DATE_NUM: 130,

  PROJECT_PROFILE: 'w-[380px]', // Increased from 360px for better text wrapping
  PROJECT_PROFILE_NUM: 380,

  INVESTOR: 'w-[240px]',        // Increased from 220px
  INVESTOR_NUM: 240,

  CHECKBOX: 'w-10',         // 40px
  CHECKBOX_NUM: 40,
};

/**
 * Enterprise Construction ERP Terminology Dictionary
 * Ensuring professional domain-specific language across the system.
 */
export const ERP_TERMINOLOGY = {
  PROJECT: {
    TITLE: 'Hồ sơ dự án',
    SUBTITLE: 'Quản lý thông tin và tiến độ công trình',
    ADD: 'Tạo hồ sơ dự án',
    COL_PROFILE: 'Thông tin dự án',
    COL_INVESTOR: 'Chủ đầu tư / Đối tác',
    START_DATE: 'Ngày khởi công',
    END_DATE: 'Bàn giao dự kiến',
  },
  FINANCE: {
    BUDGET: 'Dự toán ngân sách',
    CONTRACT: 'Giá trị hợp đồng',
    ACTUAL: 'Giá trị thực hiện',
    VARIANCE: 'Chênh lệch (Tiết kiệm/Vượt)',
    REVENUE: 'Doanh thu ghi nhận',
    DEBT: 'Công nợ tồn đọng',
    CURRENCY: 'VNĐ',
  },
  WBS: {
    TITLE: 'Cấu trúc hạng mục (WBS)',
    COL_NAME: 'Tên hạng mục thi công',
  },
  ACTIONS: {
    TITLE: 'Nghiệp vụ',
    EDIT: 'Hiệu chỉnh',
    DELETE: 'Xóa vĩnh viễn',
    ADD_CHILD: 'Thêm mục con',
    EXPORT: 'Xuất dữ liệu Excel',
  },
  STATUS: {
    TITLE: 'Tình trạng',
  }
};

/**
 * Shared Tailwind class for financial data cells
 */
export const FINANCIAL_CELL_CLASS = "text-right tabular-nums font-bold pr-2";
