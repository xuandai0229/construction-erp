# SPRINT 3A.9 - APPROVAL SLA, NOTIFICATION & DELEGATION PILOT REPORT

## 1. Executive Summary

Da them SLA pilot cho man hinh `/approvals`: KPI SLA, filter SLA, badge SLA tren tung dong, va tab SLA trong drawer chi tiet.

Da them notification UI pilot tren `/approvals`. UI uu tien doc `/api/workspace/notifications`; neu khong co notification that thi hien derived pilot notification tu work queue. Khong ghi DB, khong tao audit gia, khong gui email/SMS.

Da them delegation pilot dang disabled/read-only. Nguoi dung thay ro ly do chua kich hoat: can backend assignment/delegation/audit guard day du.

Khong sua database, khong sua Prisma schema, khong tao migration, khong apply reconciliation mapping, khong sua ledger/posting/payment/report source-of-truth.

Gate sau sprint: `A. READY_FOR_SPRINT_3A_10_FINAL_UI_PILOT_HARDENING`.

## 2. Files Changed

| File | Loai sua | Ghi chu |
| ---- | -------- | ------- |
| `lib/approval-sla.ts` | SLA_POLICY | Helper tinh SLA read-only theo dueAt/submittedAt/createdAt, priority va status. |
| `services/approval-work-queue.service.ts` | SLA_POLICY | Chuan hoa chuoi tieng Viet runtime bang escape ASCII, giu logic read-only work queue. |
| `app/approvals/page.tsx` | SLA_BADGE, SLA_FILTER, NOTIFICATION_CENTER, DERIVED_NOTIFICATION, DELEGATION_PILOT, ESCALATION_WARNING | Them KPI SLA, filter SLA, notification panel, delegation panel disabled, decode UI text cuc bo cho source ASCII. |
| `app/components/approvals/ApprovalWorkQueueDrawer.tsx` | SLA_BADGE, DELEGATION_PILOT, ESCALATION_WARNING | Them tab SLA, thong tin thoi gian cho, moc tinh SLA, nguoi nen xu ly, cap duyet de xuat, canh bao escalation. |
| `app/components/approvals/RejectReasonModal.tsx` | EMPTY_STATE | Chuan hoa chuoi UI trong modal tu choi lien quan flow approval. |
| `tests/e2e/approval-sla-notification-delegation.spec.ts` | E2E_TEST | Test moi cho SLA KPI/filter, notification panel va delegation disabled pilot. |
| `tests/e2e/approval-inbox-role-queue-smoke.spec.ts` | E2E_TEST | Cap nhat selector theo UI 3A.9. |
| `tests/e2e/approval-keyboard-bulk-safety.spec.ts` | E2E_TEST | Cap nhat selector theo UI 3A.9. |

## 3. SLA Coverage

| SLA | Cach tinh | UI hien thi | Ghi chu |
| --- | --------- | ----------- | ------- |
| Binh thuong | Duoi 24h neu khong co dueAt canh bao | Badge SLA, bang, drawer | Read-only. |
| Sap qua han | 24h-48h hoac dueAt con <= 24h | KPI, filter, badge | Khong tu chuyen trang thai. |
| Qua han | Tren 48h hoac qua dueAt | KPI, filter, badge, escalation warning | Khong gui email/SMS. |
| Can cap cao | Priority `Can cap cao` | KPI, filter, badge, guard bulk | Dua tren priority/work queue hien co. |
| Can bo sung | REJECTED/CANCELLED | KPI, filter, badge | Nhan manh nguoi tao can bo sung ho so. |
| Moc tinh SLA fallback | submittedAt -> updatedAt/createdAt | Drawer SLA warning | Khong them field moi. |

## 4. Notification Coverage

| Loai thong bao | Nguon du lieu | Ghi chu |
| -------------- | ------------- | ------- |
| Chung tu cho duyet | Derived tu work queue | Chi hien thi UI pilot neu `/api/workspace/notifications` khong co du lieu. |
| SLA qua han | Derived tu SLA summary | Khong ghi DB. |
| Chung tu bi tu choi can bo sung | Derived tu SLA summary | Khong tao notification that. |
| Chung tu gia tri lon | Derived tu SLA summary | Khong gui email/SMS. |
| Notification unread that | `/api/workspace/notifications` | Read-only UI, khong tao notification moi. |

## 5. Delegation Coverage

| Tinh nang | Trang thai | Ly do |
| --------- | ---------- | ----- |
| Uy quyen duyet that | Disabled pilot | Chua co backend assignment/delegation/audit guard du de xu ly that. |
| De xuat nguoi xu ly | Read-only | Dua theo role, priority va work queue hien co. |
| Thoi gian uy quyen | Disabled | Khong co backend config va khong tao migration. |
| Ly do uy quyen | Chua nhap | Khong cho user thuc hien uy quyen that trong sprint nay. |

## 6. Safety Confirmation

Khong sua database.

Khong apply reconciliation mapping.

Khong sua `Project.companyId`.

Khong sua `JournalEntry.projectId`.

Khong sua AP Bat Trang.

Khong sua ledger/posting/payment/report source-of-truth.

Khong gui email/SMS that.

Khong production ready.

## 7. Test Results

| Lenh | Ket qua | Ghi chu |
| ---- | ------- | ------- |
| `git status --short --untracked-files=all` | WARNING | Repo co report 3A.8 untracked tu sprint truoc; khong revert. |
| `git branch --show-current` | PASS | `main`. |
| `git log -3 --oneline` | PASS | HEAD `c8e8d4e app_v2_pate8`. |
| `npx prisma validate` | PASS | Schema hop le. |
| `npx eslint <files changed>` | PASS | File code/test Sprint 3A.9 pass. |
| `npx tsc --noEmit --pretty false` | PASS | TypeScript pass. |
| `npm run build` | PASS | Can chay ngoai sandbox do `.next/trace-build` EPERM. Con warning cu NFT trace va `url.parse`. |
| `npm run validation:database` | PASS | Can chay ngoai sandbox do ghi `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bi chan, Manager pass guard. |
| `npm run e2e -- tests/e2e/approval-inbox-role-queue-smoke.spec.ts tests/e2e/approval-keyboard-bulk-safety.spec.ts tests/e2e/approval-sla-notification-delegation.spec.ts` | PASS | 3/3 pass. |
| `npm run e2e -- required specs + approval-sla-notification-delegation.spec.ts` | PASS | 16/16 pass. |

## 8. Danh gia he thong sau Sprint 3A.9

### 8.1 He thong manh hon o dau?

Nguoi duyet thay duoc SLA ro hon: sap qua han, qua han, can cap cao, can bo sung va thoi gian cho trung binh.

Hop duyet co notification panel read-only/derived, giup ke toan truong thay nhanh cac diem nghen.

Drawer chi tiet co tab SLA, escalation warning va delegation disabled state ro rang, giam rui ro hieu nham la da co uy quyen that.

### 8.2 He thong con yeu o dau?

SLA van la policy pilot tinh tu du lieu hien co, chua co cau hinh SLA theo cong ty/role.

Notification derived chua phai notification backend that, chua co email/SMS/in-app push.

Delegation chua xu ly that, chua co audit/batch assignment/backend guard rieng.

### 8.3 He thong con thieu gi de gan MISA/FAST hon?

Backend workflow assignment table that.

Delegation that co audit.

Email/in-app notification that.

Approval SLA config theo cong ty.

Audit filter nang cao.

Dynamic print route QA.

Excel `.xlsx` that.

Lint/type safety gate on dinh.

### 8.4 Rui ro con lai

`WORKFLOW_GAP`: chua co workflow assignment table dong.

`NOTIFICATION_GAP`: notification panel chu yeu la read-only/derived pilot.

`DELEGATION_GAP`: uy quyen that dang disabled.

`ACCOUNTING_DATA_RISK`: cac canh bao human approval Phase 2.8F van con, khong production ready.

`RBAC_RISK`: UI hien thi guard, backend hien huu van la nguon quyet dinh cuoi.

`UI_RISK`: co lop decode text cuc bo cho `/approvals` vi source ASCII escape de tranh mojibake trong moi truong patch.

`TECH_DEBT`: build con warning NFT trace va deprecation `url.parse`.

`UX_GAP`: chua co notification realtime/SLA reminder/uy quyen thao tac nhanh nhu phan mem ke toan thuong mai.

### 8.5 Goi y sprint tiep theo

Neu tiep tuc dung gate hien tai: `Sprint 3A.10 - Final UI Pilot Hardening & Phase 3A Closure Report`.

Neu muon mo rong notification truoc: `Sprint 3A.9B - Notification Center Expansion`.

Neu can audit filter truoc: `Sprint 3A.6B - Audit Log Search/Filter Expansion`.

## 9. Decision Gate

`A. READY_FOR_SPRINT_3A_10_FINAL_UI_PILOT_HARDENING`

Khong production ready.
