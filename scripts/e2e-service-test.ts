import { PrismaClient } from "@prisma/client";
import { ProjectService } from "../services/project.service";
import { WBSService } from "../services/wbs.service";
import { CostService } from "../services/cost.service";
import { RevenueService } from "../services/revenue.service";

const prisma = new PrismaClient();

async function main() {
    console.log("=== STARTING ENTERPRISE E2E SERVICE TESTING ===");
    let passed = 0;
    let failed = 0;
    
    const assert = (condition: boolean, testName: string, errorMsg?: string) => {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName} - ${errorMsg}`);
            failed++;
        }
    };

    try {
        console.log("\n--- Testing Project & WBS Lifecycle ---");
        const projectDTO = {
            name: "Enterprise QA Project - " + Date.now(),
            description: "Automated QA verification",
            status: "ACTIVE" as any,
            contractValue: 5000000,
            totalBudget: 4000000
        };
        const project = await ProjectService.create(projectDTO);
        assert(!!project.id, "Create Project via Service");

        const wbsDTO = {
            projectId: project.id,
            name: "Foundation Work",
            code: "WBS-" + Date.now(),
            level: 1,
            budgetAmount: 1000000
        };
        const wbs = await WBSService.create(wbsDTO);
        assert(!!wbs.id, "Create WBS via Service");

        console.log("\n--- Testing Accounting Integrity (Costs) ---");
        try {
            const costDTO = {
                projectId: project.id,
                wbsId: wbs.id,
                costType: "material" as any,
                amount: 5000,
                quantity: 1,
                unitPrice: 5000,
                status: "unpaid" as any,
                note: "Test Material Cost"
            };
            const cost = await CostService.create(costDTO);
            assert(!!cost.id, "Create Cost Record");

            // Verify if a journal entry was created for this cost
            const journals = await prisma.journalEntry.findMany({
                where: { projectId: project.id }
            });
            assert(journals.length > 0, "Cost generated Journal Entries", `Found ${journals.length} journals`);

            if (journals.length > 0) {
                const lines = await prisma.transactionLine.findMany({
                    where: { journalEntryId: journals[0].id }
                });
                
                const debit = lines.filter(l => l.type === "DEBIT").reduce((sum, l) => sum + Number(l.amount), 0);
                const credit = lines.filter(l => l.type === "CREDIT").reduce((sum, l) => sum + Number(l.amount), 0);
                
                assert(debit === credit, "Double-Entry Ledger Integrity", `Debit: ${debit}, Credit: ${credit}`);
            }

        } catch (e: any) {
            assert(false, "Create Cost Record", e.message);
        }

        console.log("\n--- Testing Revenue & Invoicing ---");
        try {
            const invoiceDTO = {
                projectId: project.id,
                wbsId: wbs.id,
                amount: 15000,
                issuedDate: new Date(),
                remainingAmount: 15000,
                status: "DRAFT" as any
            };
            const invoice = await RevenueService.createInvoice(invoiceDTO);
            assert(!!invoice.id, "Create Revenue Invoice");
            
            // Generate payment
            const paymentDTO = {
                invoiceId: invoice.id,
                projectId: project.id,
                amount: 15000,
                description: "Full Payment"
            };
            const payment = await RevenueService.createPayment(paymentDTO);
            assert(!!payment.id, "Record Payment");

            const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
            assert(Number(updatedInvoice?.remainingAmount) === 0, "Invoice balance zeroed out after payment");

        } catch (e: any) {
             assert(false, "Revenue & Invoicing Flow", e.message);
        }

        console.log("\n=== E2E TESTING SUMMARY ===");
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);

    } catch (e: any) {
        console.error("Test execution failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
