# PHASE 2.3: ADVANCE / SETTLEMENT / OFFSET REPORT

## 1. Summary
* **Đã audit gì?** Toàn bộ schema hiện tại, phát hiện thiếu hụt schema cho AdvanceRequest và Settlement. Khẳng định `PaymentAllocation` chưa được dùng thực tế (Technical Debt).
* **Đã thiết kế gì?** Thiết kế Vòng đời (Draft -> Approved -> Paid -> Settled) và Posting Rules (TK 141, TK 331) cho Tạm ứng.
* **Đã implement gì?** API Financial Trace thực tế (`/api/contracts/[id]/financial-trace`, v.v.), `AdvanceSettlementPolicy`, 20 kịch bản test Guard và Audit logic (phần lớn trả về NOT IMPLEMENTED chờ Schema).
* **Có sửa schema/migration không?** KHÔNG. Tuân thủ giới hạn "Không làm quá rộng", chỉ xây móng Logic.
* **Có sửa dữ liệu thật không?** KHÔNG.
* **Có giữ Level 3 không?** CÓ.

## 2. Sprint 2.2 Carry-over Check
| Nội dung | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| PaymentAllocation đã dùng thật chưa? | CHƯA | Schema có nhưng Service `RevenueService` đang update thẳng `paidAmount`. (Technical Debt). |
| AR/AP Aging có API/service thật chưa? | CÓ API | Có route `/api/reports/aging/route.ts` được generate từ trước nhưng logic chi tiết bên trong chưa hoàn thiện. |
| Financial Trace API có thật chưa? | ĐÃ TẠO MỚI | Đã viết 3 route API GET read-only trong Sprint 2.3 này. |

## 3. Advance/Settlement/Offset Audit
| Nội dung | Hiện trạng | Rủi ro | Đề xuất |
| -------- | ---------- | ------ | ------- |
| Advance Schema | Chưa có model `AdvanceRequest` | Tiền tạm ứng mất dấu, không đối soát được. | Cần tạo Migration ở Sprint 2.3B. |
| Offset Schema | Chưa có model `Settlement` | Kế toán đối trừ thủ công ngoài hệ thống. | Tạo model kết nối Advance và Invoice. |

## 4. Design Result
| Nghiệp vụ | Lifecycle | Posting Rule | Guard |
| --------- | --------- | ------------ | ----- |
| Vendor Advance | DRAFT -> PAID -> SETTLED | Nợ 331 / Có 111 | Chặn hoàn ứng vượt dư nợ. |
| Employee Advance | DRAFT -> PAID -> SETTLED | Nợ 141 / Có 111 | Phải chỉ định ID nhân viên. |
| Offset | N/A (Action) | Tự động cấn trừ | Cấm Cross-company. Cấm sai đối tượng. |

## 5. Implementation Result
| File/module | Thay đổi | Lý do |
| ----------- | -------- | ----- |
| `app/api/.../financial-trace/route.ts` | Tạo 3 API Trace | Cung cấp đầu ra cho UI theo tác vụ cũ. |
| `AdvanceSettlementPolicy.ts` | Viết Policy Pure Function | Kiểm soát tính đúng đắn nghiệp vụ không phụ thuộc DB. |
| `advance-settlement-offset-guards.ts` | Test Policy | Xác nhận Policy hoạt động đúng. |
| `advance-settlement-offset-reconciliation.ts` | Khởi tạo | Script rỗng chờ Schema. |

## 6. Test Result
| Test script | PASS | FAIL | SKIP/NOT IMPLEMENTED | Ghi chú |
| ----------- | ---: | ---: | -------------------: | ------- |
| `advance-settlement-offset-guards.ts` | 15 | 0 | 5 | 5 test chờ Schema. |
| `financial-trace-api-guards.ts` | 7 | 0 | 0 | Test route logic. |

## 7. Reconciliation Result
| Check | Expected | Actual | Difference | Kết quả |
| ----- | -------: | -----: | ---------: | ------- |
| Advance Reconciliation | N/A | N/A | N/A | NOT IMPLEMENTED |

## 8. Outstanding Advance Report
| Nhóm | Số lượng | Tổng tiền | Ghi chú |
| ---- | -------: | --------: | ------- |
| N/A | N/A | N/A | NOT IMPLEMENTED - schema required |

## 9. Verification Commands
| Command | Kết quả | Ghi chú |
| ------- | ------- | ------- |
| `npm run validation:database` | PASS | Vẫn an toàn. |
| `npm run e2e` | PASS | 15/15. |
| `npm run lint` | PASS Core | 770 lỗi Legacy repo-wide. |

## 10. Remaining Risks
* **Critical**: Việc thiếu vắng Schema Tạm ứng là rủi ro lớn nhất cho một hệ thống ERP Xây dựng thực tế, vì thực địa chi tiền ứng rất nhiều.
* **High**: Tính `paidAmount` không qua `PaymentAllocation` dễ gây bất đồng bộ số liệu nếu có chỉnh sửa.

## 11. Next Sprint Recommendation
**Đề xuất khẩn cấp: Sprint 2.3B - Database Migration cho Advance & Settlement.**
Chúng ta ĐÃ HOÀN TẤT THIẾT KẾ VÀ POLICY. Giờ là lúc an toàn nhất để sinh Migration cho 2 bảng `AdvanceRequest` và `Settlement`, sau đó lắp ghép Policy vào Service thực tế.
