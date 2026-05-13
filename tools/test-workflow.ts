import { CostWorkflow } from "../lib/workflow/costWorkflow";

async function run() {
  console.log("Starting Workflow Transition Test...");

  const testCases = [
    { from: "DRAFT", to: "POSTED", expected: "fail" },
    { from: "APPROVED", to: "POSTED", expected: "pass" },
    { from: "REVERSED", to: "APPROVED", expected: "fail" },
    { from: "POSTED", to: "DRAFT", expected: "fail" },
    { from: "DRAFT", to: "PENDING_FINANCE", expected: "pass" }
  ];

  let passCount = 0;
  for (const tc of testCases) {
    try {
      CostWorkflow.validateTransition(tc.from, tc.to as any);
      if (tc.expected === "pass") {
        console.log(`✅ Transition ${tc.from} -> ${tc.to}: Allowed (Expected)`);
        passCount++;
      } else {
        console.error(`❌ Transition ${tc.from} -> ${tc.to}: Allowed (UNEXPECTED!)`);
      }
    } catch (e: any) {
      if (tc.expected === "fail") {
        console.log(`✅ Transition ${tc.from} -> ${tc.to}: Blocked (Expected - ${e.message})`);
        passCount++;
      } else {
        console.error(`❌ Transition ${tc.from} -> ${tc.to}: Blocked (UNEXPECTED! - ${e.message})`);
      }
    }
  }

  console.log(`Workflow Test Result: ${passCount}/${testCases.length} test cases passed.`);
}

run().catch(console.error);
