import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_BASE = "http://localhost:3000/api";

async function main() {
    console.log("=== STARTING FULL E2E API TESTING ===");
    let passed = 0;
    let failed = 0;
    
    // Helper to log test results
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
        // 1. Test Project Creation (Accounting)
        console.log("\n--- Testing Project Flow ---");
        const projectRes = await fetch(`${API_BASE}/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "E2E Test Project - " + Date.now(),
                description: "Automated test project",
                status: "PLANNED",
                contractValue: 1500000,
                totalBudget: 1200000
            })
        });
        
        let project = await projectRes.json();
        if (!projectRes.ok) {
            console.log("Response:", project);
        }
        assert(projectRes.ok && !!project.id, "Create Project", projectRes.statusText);
        
        // 2. Test WBS Creation
        console.log("\n--- Testing WBS Flow ---");
        const wbsRes = await fetch(`${API_BASE}/wbs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectId: project.id,
                name: "Foundation Work",
                code: "WBS-01",
                level: 1,
                budgetAmount: 500000
            })
        });
        
        let wbs = await wbsRes.json();
        assert(wbsRes.ok && !!wbs.id, "Create WBS", wbsRes.statusText);

        // 3. Test Finance Journal (Accounting Integrity)
        console.log("\n--- Testing Accounting Flow ---");
        // We need ledger accounts. Let's create them if they don't exist via Prisma directly 
        // to ensure we have standard accounts for the test.
        let debitAccount = await prisma.ledgerAccount.findFirst({ where: { type: "ASSET" }});
        if (!debitAccount) {
            debitAccount = await prisma.ledgerAccount.create({
                data: { code: `1010-${Date.now()}`, name: "Cash", type: "ASSET" }
            });
        }
        let creditAccount = await prisma.ledgerAccount.findFirst({ where: { type: "EQUITY" }});
        if (!creditAccount) {
            creditAccount = await prisma.ledgerAccount.create({
                data: { code: `3010-${Date.now()}`, name: "Owner Equity", type: "EQUITY" }
            });
        }

        const journalRes = await fetch(`${API_BASE}/finance/journals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectId: project.id,
                date: new Date().toISOString(),
                description: "Initial Investment",
                reference: "INV-001",
                lines: [
                    { accountId: debitAccount.id, type: "DEBIT", amount: 10000 },
                    { accountId: creditAccount.id, type: "CREDIT", amount: 10000 }
                ]
            })
        });

        let journal = await journalRes.json();
        assert(journalRes.ok && !!journal.id, "Create Balanced Journal Entry", JSON.stringify(journal));

        // Test imbalanced journal (should fail)
        const journalFailRes = await fetch(`${API_BASE}/finance/journals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectId: project.id,
                date: new Date().toISOString(),
                description: "Imbalanced Investment",
                lines: [
                    { accountId: debitAccount.id, type: "DEBIT", amount: 10000 },
                    { accountId: creditAccount.id, type: "CREDIT", amount: 5000 }
                ]
            })
        });
        assert(!journalFailRes.ok, "Reject Imbalanced Journal Entry", "Allowed an imbalanced entry!");

        // 4. Test API Performance (Stress Test)
        console.log("\n--- Testing API Performance ---");
        const start = Date.now();
        const pList = [];
        for(let i=0; i<10; i++) {
            pList.push(fetch(`${API_BASE}/projects`));
        }
        await Promise.all(pList);
        const duration = Date.now() - start;
        assert(duration < 2000, "Fetch Projects Performance (< 2000ms)", `Took ${duration}ms`);

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
