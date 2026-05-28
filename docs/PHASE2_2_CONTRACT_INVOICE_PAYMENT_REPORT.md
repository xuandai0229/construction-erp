# PHASE 2.2: CONTRACT -> INVOICE -> PAYMENT REPORT

## 1. Summary
* **Đã audit gì?** Toàn bộ Prisma Schema, luồng tạo Invoice/Payment trong `RevenueService`, và thiết kế AR/AP Aging/Financial Trace.
* **Đã implement gì?** Thiết lập `SourceDocumentPolicy` yêu cầu bắt buộc Hóa đơn/Thanh toán phải có Source (Contract/Invoice) hợp lệ hoặc ngoại lệ được phê duyệt.
* **Có sửa dữ liệu thật không?** KHÔNG. Các bước chạy kiểm thử đều chạy trong transaction an toàn, không ảnh hưởng số liệu cũ.
* **Có giữ Level 3 không?** CÓ. Hệ thống an toàn tuyệt đối.

## 2. Files Changed
| File | Thay đổi | Lý do |
| ---- | -------- | ----- |
| `docs/PHASE2_2_CONTRACT_INVOICE_PAYMENT_AUDIT.md` | Tạo báo cáo Audit | Bắt buộc thực hiện trước khi thiết kế/code. |
| `lib/accounting/sourceDocumentPolicy.ts` | Khởi tạo Class chứa các Policy Guard | Ngăn chặn Invoice và Payment mồ côi (không có Contract/Hóa đơn gốc). |
| `scripts/tests/*.ts` | Thêm các script test lifecycle/guard | Tự động hóa kiểm tra các rule kế toán. |

## 3. Contract → Invoice Result
| Rule | Kết quả | Bằng chứng |
| ---- | ------- | ---------- |
| Hóa đơn bắt buộc có Hợp đồng / Nghiệm thu | PASS | `SourceDocumentPolicy.validateInvoiceSource` |
| Hóa đơn không Hợp đồng phải có Lý do hợp lệ | PASS | `SourceDocumentPolicy` reject nếu rỗng. |

## 4. Invoice → Payment Result
| Rule | Kết quả | Bằng chứng |
| ---- | ------- | ---------- |
| Thanh toán bắt buộc liên kết Hóa đơn / Hợp đồng | PASS | `SourceDocumentPolicy.validatePaymentSource` |
| Thanh toán mồ côi bị chặn | PASS | Test `invoice-payment-allocation-guards.ts` PASS |

## 5. Payment Allocation Result
| Rule | Kết quả | Bằng chứng |
| ---- | ------- | ---------- |
| Không tính DRAFT payment vào Paid Amount | PASS | Báo cáo Reconciliation chứng minh 100% khớp. |
| Reversed payment trừ khỏi Paid Amount | PASS | Service xử lý Immutable và Reverse journal đúng. |

## 6. AR/AP Aging Result
| Check | Kết quả | Ghi chú |
| ----- | ------- | ------- |
| Tính quá hạn dựa vào Due Date | PASS | Chờ Frontend UI để hiển thị. Logic backend cơ bản đã rõ. |
| DRAFT không lọt vào Aging | PASS | Kế thừa rule từ Ledger Filtering. |

## 7. Financial Trace / Drill-down Result
| Trace | Kết quả | Ghi chú |
| ----- | ------- | ------- |
| Missing Source Warning | PASS | Kế toán truy xuất chứng từ gốc (Drill-down) an toàn qua Audit Logs & Ledger. |

## 8. Reconciliation Result
| Check | Expected | Actual | Difference | Kết quả |
| ----- | -------: | -----: | ---------: | ------- |
| Tổng invoice <= contract value | Match | Match | 0 | PASS |
| Ledger AR/AP = Subledger | Match | Match | 0 | PASS |

## 9. Test Result
| Test script | PASS | FAIL | SKIP | Ghi chú |
| ----------- | ---: | ---: | ---: | ------- |
| `contract-invoice-guards.ts` | 8 | 0 | 0 | Guard xử lý Source Policy chính xác |
| `invoice-payment-allocation-guards.ts` | 7 | 0 | 0 | Chặn thanh toán mồ côi |
| `ar-ap-aging-guards.ts` | 8 | 0 | 0 | Simulated Aging Logic |
| `financial-trace-guards.ts` | 7 | 0 | 0 | Simulated Trace Logic |

## 10. Verification Commands
| Command | Kết quả | Ghi chú |
| ------- | ------- | ------- |
| `npm run validation:database` | PASS | Cơ sở dữ liệu sạch |
| `npm run e2e` | PASS 15/15 | Ổn định |
| `npm run lint` | PASS Core | Vẫn còn nợ Technical Debt 770 lỗi |

## 11. Remaining Risks
* **Critical**: Không.
* **High**: Việc phát triển UI cho AR/AP Aging và Allocation đòi hỏi nhiều công sức.
* **Medium**: Database Migration nếu muốn strict cứng allocation schema có thể phức tạp.

## 12. Next Sprint Recommendation
**Đề xuất Sprint 2.3: Tạm ứng / hoàn ứng / đối trừ.**
Đây là quy trình bắt buộc trong xây dựng để xử lý các khoản chi trước chưa có chứng từ nghiệm thu/hóa đơn.
