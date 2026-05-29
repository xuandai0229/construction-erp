# Full Report Reconciliation

Generated: 2026-05-29T04:46:44.335Z
Projects checked: 19

| Report/KPI | Expected | Actual | Difference | Result | Notes |
| ---------- | -------: | -----: | ---------: | ------ | ----- |
| Ledger balanced (global) | 1744529261 | 1744529261 | 0 | PASS | All posted, unreversed, non-deleted journal lines must balance globally. |
| Ledger balanced (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (c6ebeb6b-dfec-43fb-ae9e-282d266a3deb) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (project-battrang) | 1744529261 | 1744529261 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (project-battrang) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (project-battrang) | 634120478 | 634120478 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (project-battrang) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (project-battrang) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (project-battrang) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (project-battrang) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (project-battrang) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=-634120478, AP balance=35683557. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (091ba671-4cdf-4b8d-84c7-240d21692824) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (091ba671-4cdf-4b8d-84c7-240d21692824) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (091ba671-4cdf-4b8d-84c7-240d21692824) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (7c8fa82c-1344-4a49-881d-7e0d38267b63) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (7c8fa82c-1344-4a49-881d-7e0d38267b63) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (7c8fa82c-1344-4a49-881d-7e0d38267b63) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (c1f8d981-2be1-438f-8eec-82dea6ac687e) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (c1f8d981-2be1-438f-8eec-82dea6ac687e) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (c1f8d981-2be1-438f-8eec-82dea6ac687e) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (975c1f22-5aaa-418f-9696-c68cbc3cd283) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (975c1f22-5aaa-418f-9696-c68cbc3cd283) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (975c1f22-5aaa-418f-9696-c68cbc3cd283) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (b36f16ef-0419-4aba-a405-6e174f475d8f) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (b36f16ef-0419-4aba-a405-6e174f475d8f) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (b36f16ef-0419-4aba-a405-6e174f475d8f) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (51644eab-34d4-446d-8843-a3c69b593e4a) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (51644eab-34d4-446d-8843-a3c69b593e4a) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (51644eab-34d4-446d-8843-a3c69b593e4a) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (89dfb5f8-330c-434c-a12a-a78c81267158) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (89dfb5f8-330c-434c-a12a-a78c81267158) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (89dfb5f8-330c-434c-a12a-a78c81267158) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (6986c4d0-8eb0-4f43-96cc-a9463e86c5ab) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (d5c0b467-fdb9-4668-8d12-796fff4288cf) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (d5c0b467-fdb9-4668-8d12-796fff4288cf) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (d5c0b467-fdb9-4668-8d12-796fff4288cf) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (b0d32c00-1711-4e0e-8ae5-917905eb6d47) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (3f579fe6-5aad-4348-b49d-411f121e6cb1) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (3f579fe6-5aad-4348-b49d-411f121e6cb1) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (3f579fe6-5aad-4348-b49d-411f121e6cb1) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (3d61f59a-e7e6-40d1-8be7-8c44f7ee0916) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (eb50f4aa-09bb-433b-8049-4ae44a3b7b5c) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (8056bf95-1055-4e81-84e6-08bd2d5bb35b) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (2d5210bd-e265-4632-82cc-526cc204ef1f) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (2d5210bd-e265-4632-82cc-526cc204ef1f) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (2d5210bd-e265-4632-82cc-526cc204ef1f) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Ledger balanced (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | Posted, unreversed, non-deleted debit/credit totals must match. |
| Revenue ledger vs canonical (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | Posted revenue must come from 511* ledger only. Suspect: services/financial-aggregation.service.ts. |
| Cost ledger vs canonical (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | Posted cost must come from 621/622/623/627 ledger only. Suspect: services/financial-aggregation.service.ts. |
| AR ledger vs canonical (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | AR must reconcile to 131* active posted ledger. Suspect: services/financial-aggregation.service.ts. |
| Draft/rejected payments excluded from ledger (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | No non-approved payment should have active posted journal. |
| Draft invoices excluded from posted revenue (54efc369-7a16-4bd8-adba-b1938585c19b) | 0 | 0 | 0 | PASS | No non-approved invoice should have active posted revenue journal. |
| Tenant scope evidence (54efc369-7a16-4bd8-adba-b1938585c19b) | GLOBAL | GLOBAL | 0 | PASS | Project reconciliation was scoped per project/company available in database. |
| Project P&L layers (54efc369-7a16-4bd8-adba-b1938585c19b) | separate posted and exposure layers | separate posted and exposure layers | 0 | PASS | Posted P&L=0, AP balance=0. Management exposure remains separate in canonical reconciliation payload. Suspect: services/financial-aggregation.service.ts. |
| Dashboard integrity static values | no static SYNCED/lockedPeriodWarnings=0 | no static integrity success | 0 | PASS | Dashboard must show no-data or real reconciliation signal instead of fake synced status. Suspect: app/components/FinancialIntegrityDashboard.tsx. |
| Dashboard KPI source | FinancialAggregationService/reconciliationStatus | FinancialAggregationService/reconciliationStatus | 0 | PASS | Dashboard stats route must use a source service, workflow counts, or no-data state. Suspect: app/api/dashboard/stats/route.ts. |
