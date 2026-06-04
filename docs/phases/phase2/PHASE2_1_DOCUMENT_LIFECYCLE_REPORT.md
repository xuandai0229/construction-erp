# PHASE 2.1: DOCUMENT LIFECYCLE REPORT

## 1. Summary
* **Đã audit gì?** Toàn bộ quy trình luân chuyển chứng từ (Contract, Invoice, Payment, Cost, Debt, Advance, Settlement, Ledger).
* **Đã thiết kế gì?** Xây dựng vòng đời chuẩn mực cho chứng từ tài chính (Draft -> Submitted -> Approved -> Posted -> Reversed).
* **Đã implement gì?** Rà soát các guard trong revenue/cost service, bổ sung script kiểm thử document lifecycle guards.
* **Chưa làm gì?** Chưa phát triển UI mới, chưa implement Advance/Settlement module (sẽ làm ở Sprint 2.3).
* **Có ảnh hưởng dữ liệu thật không?** KHÔNG. Tất cả test chạy trong transaction ảo và tự rollback.

## 2. Documents Created
| File | Nội dung |
| ---- | -------- |
| `docs/PHASE2_ACCOUNTING_WORKFLOW_GAP_REPORT.md` | Báo cáo gap giữa hiện tại và MISA-like workflow |
| `docs/PHASE2_ACCOUNTING_WORKFLOW_DESIGN.md` | Thiết kế vòng đời chứng từ và quy tắc ghi sổ |
| `docs/PHASE2_IMPLEMENTATION_PLAN.md` | Kế hoạch chia nhỏ 5 sprint thực thi Phase 2 |
| `scripts/tests/document-lifecycle-guards.ts` | Test kịch bản luân chuyển và chặn trạng thái sai |

## 3. Workflow Gap Findings
| Module | Gap | Rủi ro | Đề xuất |
| ------ | --- | ------ | ------- |
| **Contract** | Quản lý vòng đời (Draft, Active, Completed), Phụ lục hợp đồng | Không truy xuất được dòng tiền chi tiết theo hợp đồng | Thêm Contract Lifecycle (Sprint 2.2) |
| **Invoice** | Thiếu liên kết chặt với Hợp đồng / Nghiệm thu | Có thể bị thay đổi trạng thái tự do nếu thiếu Guard cứng | Xây dựng State Machine cho Invoice Lifecycle |
| **Advance / Settlement** | Chưa có chuyên biệt | Không đối trừ tự động, phải làm thủ công | Tạo module Advance Request & Settlement (Sprint 2.3) |
| **UI Forms** | CRUD cơ bản | Sai sót nhập liệu, thiếu Audit timeline | Tái thiết kế UI Kế toán (Sprint 2.5) |

## 4. Lifecycle Design
| Document | Status | Transition hợp lệ | Transition bị chặn |
| -------- | ------ | ----------------- | ------------------ |
| **Invoice / Payment** | DRAFT | -> SUBMITTED | -> POSTED (Khóa cứng) |
| | SUBMITTED | -> APPROVED, -> REJECTED, -> DRAFT | -> POSTED |
| | APPROVED | -> POSTED | Quay lại DRAFT khi đã Approved |
| | POSTED | -> REVERSED (Bút toán đỏ) | Xóa, Sửa số tiền, Quay lại DRAFT |

## 5. Implementation Result
| File/module | Thay đổi | Lý do |
| ----------- | -------- | ----- |
| `services/revenue.service.ts` | Xác nhận Immutability logic đã tồn tại | Đảm bảo không cho phép update khi Invoice !== DRAFT |
| `services/revenue.service.ts` | Xác nhận chặn Delete nếu Invoice đã POSTED | Bảo vệ tính toàn vẹn số liệu (Audit trail requirement) |
| `scripts/tests/document-lifecycle-guards.ts`| Thêm bộ test transition states | Xác minh 12 rule chặn/cho phép của vòng đời chứng từ |

## 6. Test Result
| Test | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| DRAFT -> SUBMITTED | PASS | Hợp lệ |
| SUBMITTED -> APPROVED | PASS | Hợp lệ |
| SUBMITTED -> REJECTED | PASS | Hợp lệ |
| APPROVED -> POSTED | PASS | Hợp lệ |
| DRAFT -> POSTED | PASS | Bị chặn |
| REJECTED -> POSTED | PASS | Bị chặn |
| POSTED -> DRAFT | PASS | Bị chặn |
| POSTED fields immutable | PASS | Bị chặn sửa đổi |
| POSTED undeletable | PASS | Bị chặn xóa |
| No self-approve | PASS | RBAC chặn |
| Reverse creates audit log | PASS | Log sinh ra đủ |
| Invalid transition error | PASS | Trả về message chuẩn |

## 7. Verification Commands
| Command | Kết quả | Ghi chú |
| ------- | ------- | ------- |
| `npm run validation:database` | PASS | 0 lỗi dữ liệu |
| `npm run financial-check` | PASS | 0 unbalanced journals |
| `npx tsx scripts/tests/accounting-workflow-guards.ts` | PASS | SoD & Posting rules hoạt động |
| `npx tsx scripts/audit/full-report-reconciliation.ts` | PASS | 0 mismatch |
| `npx tsc --noEmit` / `npm run build` | PASS | Build thành công |
| `npm run security:routes` | PASS | 72 API được bảo mật |
| `npm run e2e` | PASS | 15/15 tests thành công |
| `npm run lint` | PASS | Core files sạch lỗi. Repo-wide 763 lỗi (Non-blocker Legacy) |

## 8. Remaining Risks
* **Critical**: Không có.
* **High**: Việc sửa schema (Contract, Advance) ở Sprint tới cần cẩn trọng để không ảnh hưởng dữ liệu cũ.
* **Medium**: Việc quản lý trạng thái UI cần làm đồng bộ với Backend State Machine.
* **Low**: Legacy lint problems (763 lỗi).

## 9. Next Sprint Recommendation
**Tiến hành Sprint 2.2: Chuẩn hóa Contract → Invoice → Payment.**
Tập trung vào:
1. Bổ sung Document Source (Contract ID) vào các Entity kế toán.
2. Thiết lập cấu trúc dữ liệu cho Báo cáo tuổi nợ (AR/AP Aging).
3. Đảm bảo mọi hóa đơn đều liên kết được về Hợp đồng.
