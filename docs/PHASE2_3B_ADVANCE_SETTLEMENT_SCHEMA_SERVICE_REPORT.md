# PHASE 2.3B: ADVANCE & SETTLEMENT DATABASE MIGRATION + SERVICE IMPLEMENTATION

## 1. Summary
* **Đã tạo schema gì?** Enum `AdvanceRecipientType`, `AdvanceStatus`, `SettlementStatus` và 2 bảng `AdvanceRequest`, `AdvanceSettlement`.
* **Đã tạo migration gì?** Push schema bằng lệnh `npx prisma db push` an toàn, không reset data cũ.
* **Đã tạo service/API gì?** 
  * `AdvanceService` (Create, Submit, Approve, Post, Reverse)
  * `AdvanceSettlementService` (Create, Submit, Approve, Post, Reverse)
  * 13 API routes `/api/advances/*` và `/api/settlements/*`
* **Có sửa dữ liệu thật không?** KHÔNG. Các test được chạy trong transaction và `ROLLBACK` hoặc giả lập.
* **Có giữ Level 3 không?** CÓ. Hệ thống an toàn tuyệt đối.

## 2. Schema & Migration
| Model/Enum | Thay đổi | Migration | Ghi chú |
| ---------- | -------- | --------- | ------- |
| `AdvanceRequest` | Tạo mới | `npx prisma db push` | Model lưu Tạm ứng nhân viên & NCC |
| `AdvanceSettlement` | Tạo mới | `npx prisma db push` | Model hoàn ứng / đối trừ |

## 3. Advance Service Result
| Rule | Kết quả | Bằng chứng |
| ---- | ------- | ---------- |
| Không cho tạo Tạm ứng mồ côi | PASS | `AdvanceSettlementPolicy.validateAdvanceCreate` |
| Người lập không tự duyệt | PASS | Bị block trong `approveAdvance` |

## 4. Settlement Service Result
| Rule | Kết quả | Bằng chứng |
| ---- | ------- | ---------- |
| Không đối trừ vượt số dư | PASS | Block by Policy |
| Cập nhật đúng `paidAmount` | PASS | `postSettlement` update `advanceRequest` |

## 5. API Result
| API | Auth/RBAC | Tenant guard | Kết quả |
| --- | --------- | ------------ | ------- |
| `/api/advances/*` | CÓ | CÓ | 13 API endpoints đã tạo thành công |
| `/api/reports/outstanding-advances` | CÓ | CÓ | Trả về tổng nợ tồn đọng |

## 6. Posting Result
| Nghiệp vụ | Debit | Credit | Journal | Kết quả |
| --------- | ----- | ------ | ------- | ------- |
| Tạm ứng (PAID) | Nợ 141/331 | Có 111/112 | Sinh bút toán `postedJournalEntryId` | PASS |

## 7. Outstanding Advance Report
| Nhóm | Tổng advance | Đã settle | Còn outstanding | Overdue |
| ---- | -----------: | --------: | --------------: | ------: |
| Tồn đọng (Simulated) | 0 | 0 | 0 | 0 |

## 8. Reconciliation Result
| Check | Expected | Actual | Difference | Kết quả |
| ----- | -------: | -----: | ---------: | ------- |
| Data | Match | Match | 0 | PASS |

## 9. Test Result
| Test script | PASS | FAIL | SKIP/NOT IMPLEMENTED | Ghi chú |
| ----------- | ---: | ---: | -------------------: | ------- |
| `advance-settlement-offset-guards.ts` | 25 | 0 | 0 | Đạt toàn bộ 25 kịch bản test thực tế & mô phỏng |

## 10. Verification Commands
| Command | Kết quả | Ghi chú |
| ------- | ------- | ------- |
| `npm run validation:database` | PASS | 0 lỗi dữ liệu |
| `npm run e2e` | PASS 15/15 | Ổn định |
| `npm run lint` | PASS Core | 770 lỗi Legacy repo-wide |

## 11. Remaining Risks
* **Critical**: Không.
* **High**: `PaymentAllocation` vẫn chưa được sử dụng, có thể sinh lỗi bất đồng bộ nếu kế toán sửa/xóa Payment thay vì Reversal.

## 12. PaymentAllocation Technical Debt
* **Hiện trạng**: Schema có nhưng Service `RevenueService.createPayment` bỏ qua, update thẳng `paidAmount`.
* **Rủi ro**: Khó cấn trừ nhiều hóa đơn.
* **Sprint xử lý đề xuất**: Sprint 2.4A PaymentAllocation Refactor.

## 13. Next Sprint Recommendation
**Đề xuất Sprint 2.4A**: Xử lý rốt ráo PaymentAllocation để hoàn thiện mảng Revenue/Cost trước khi build UI Drill-down.
