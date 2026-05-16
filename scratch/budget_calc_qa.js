
function calculateBudgetKPIs(budgets, costs) {
    const b = budgets.reduce((sum, b) => sum + (b.estimatedAmount || 0), 0);
    const u = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const r = b - u;
    // Current logic: if budget is 0 but cost > 0, it's 100% used
    const p = b > 0 ? (u / b) * 100 : (u > 0 ? 100 : 0);
    return { totalBudget: b, totalUsed: u, remaining: r, pct: p };
}

console.log("=== BUDGET CALCULATION QA ===");

// CASE A: Budget > Cost
const caseA = calculateBudgetKPIs([{ estimatedAmount: 1000 }], [{ amount: 400 }]);
console.log("CASE A (Normal):", caseA);
if (caseA.totalBudget === 1000 && caseA.totalUsed === 400 && caseA.remaining === 600 && caseA.pct === 40) console.log("PASS");

// CASE B: Budget = Cost
const caseB = calculateBudgetKPIs([{ estimatedAmount: 1000 }], [{ amount: 1000 }]);
console.log("CASE B (Full):", caseB);
if (caseB.pct === 100) console.log("PASS");

// CASE C: Cost > Budget
const caseC = calculateBudgetKPIs([{ estimatedAmount: 1000 }], [{ amount: 1500 }]);
console.log("CASE C (Over):", caseC);
if (caseC.pct === 150) console.log("PASS");

// CASE D: Budget = 0, Cost > 0
const caseD = calculateBudgetKPIs([{ estimatedAmount: 0 }], [{ amount: 500 }]);
console.log("CASE D (No Budget, Has Cost):", caseD);
if (caseD.pct === 100) console.log("PASS (Capped/Warned)");

// CASE E: Budget = 0, Cost = 0
const caseE = calculateBudgetKPIs([{ estimatedAmount: 0 }], [{ amount: 0 }]);
console.log("CASE E (Zero):", caseE);
if (caseE.pct === 0) console.log("PASS");

console.log("=== CALCULATION QA COMPLETE ===");

