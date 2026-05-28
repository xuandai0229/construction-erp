import { UserRole } from "../../generated/prisma-client";
import { DocumentGovernance } from "../../lib/governance/document-governance";
import { DashboardGovernance } from "../../lib/governance/dashboard-governance";
import { PaymentApprovalGovernance } from "../../lib/governance/payment-approval";
import { VoucherWorkflowGovernance } from "../../lib/governance/voucher-workflow";
import { RBAC, toEnterpriseRole } from "../../lib/rbac";

type TestResult = {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
};

const results: TestResult[] = [];

function record(name: string, status: "PASS" | "FAIL", detail: string) {
  results.push({ name, status, detail });
}

function expectThrow(name: string, action: () => void, detail: string) {
  try {
    action();
    record(name, "FAIL", "Expected governance rejection.");
  } catch {
    record(name, "PASS", detail);
  }
}

function expectPass(name: string, action: () => void, detail: string) {
  try {
    action();
    record(name, "PASS", detail);
  } catch (error) {
    record(name, "FAIL", error instanceof Error ? error.message : String(error));
  }
}

const users = [
  { id: "u-01", role: UserRole.MANAGER },
  { id: "u-02", role: UserRole.BRANCH_DIRECTOR },
  { id: "u-03", role: UserRole.ACCOUNTANT },
  { id: "u-04", role: UserRole.CFO },
  { id: "u-05", role: UserRole.GROUP_DIRECTOR },
  { id: "u-06", role: UserRole.AUDITOR },
  { id: "u-07", role: UserRole.ADMIN },
  { id: "u-08", role: UserRole.SUPER_ADMIN },
  { id: "u-09", role: UserRole.ACCOUNTANT },
  { id: "u-10", role: UserRole.CFO },
];

const enterpriseRoles = new Set(users.map(user => toEnterpriseRole(user.role)));
record("Role model", enterpriseRoles.size === 7 ? "PASS" : "FAIL", `Covered ${enterpriseRoles.size}/7 enterprise roles with 10 users.`);

expectPass("Permission matrix - receivable accountant create invoice", () => {
  RBAC.assertPermission(UserRole.MANAGER, "INVOICE", "CREATE");
}, "Receivable accountant can create invoice documents.");

expectThrow("Permission matrix - auditor cannot post", () => {
  RBAC.assertPermission(UserRole.AUDITOR, "VOUCHER", "POST");
}, "Audit role is read-only for posting.");

expectPass("Permission matrix - chief accountant approve", () => {
  RBAC.assertPermission(UserRole.CFO, "VOUCHER", "APPROVE");
}, "Chief accountant can approve vouchers.");

expectThrow("Four-eyes principle", () => {
  RBAC.assertSegregationOfDuties("creator-1", "creator-1");
}, "Creator cannot approve the same voucher.");

expectPass("Workflow transition submit", () => {
  VoucherWorkflowGovernance.assertTransition("NHAP", "CHO_DUYET");
}, "Draft voucher can be submitted.");

expectThrow("Workflow transition post before approval", () => {
  VoucherWorkflowGovernance.assertPostable("CHO_DUYET");
}, "Pending voucher cannot be posted.");

expectPass("Workflow post after approval", () => {
  VoucherWorkflowGovernance.assertPostable("DA_DUYET");
}, "Approved voucher can enter posting gate.");

expectThrow("Document governance - missing documents", () => {
  DocumentGovernance.assertComplete({ sourceType: "UNC" }, [{ type: "UNC" }]);
}, "Missing invoice/contract blocks posting.");

expectPass("Document governance - complete documents", () => {
  DocumentGovernance.assertComplete({ sourceType: "UNC" }, [
    { type: "UNC" },
    { type: "HOA_DON" },
    { type: "HOP_DONG" },
  ]);
}, "Complete payment dossier passes.");

expectPass("Payment approval - under 50M", () => {
  const steps = PaymentApprovalGovernance.assertRoleCanApprovePayment(UserRole.CFO, 49_000_000);
  if (steps.join(",") !== "KE_TOAN_TRUONG") throw new Error("Wrong approval steps.");
}, "Under 50M requires chief accountant.");

expectPass("Payment approval - 50M to 500M", () => {
  const steps = PaymentApprovalGovernance.getRequiredSteps(250_000_000);
  if (steps.join(",") !== "KE_TOAN_TRUONG,GIAM_DOC") throw new Error("Wrong approval steps.");
}, "50M-500M requires chief accountant and director.");

expectPass("Payment approval - over 500M", () => {
  const steps = PaymentApprovalGovernance.assertRoleCanApprovePayment(UserRole.GROUP_DIRECTOR, 700_000_000);
  if (steps.join(",") !== "GIAM_DOC") throw new Error("Wrong approval steps.");
}, "Over 500M requires director.");

expectPass("Period governance - chief accountant close/open", () => {
  RBAC.assertPermission(UserRole.CFO, "PERIOD", "CLOSE_PERIOD");
  RBAC.assertPermission(UserRole.CFO, "PERIOD", "OPEN_PERIOD");
}, "Chief accountant can close and open periods.");

expectThrow("Period governance - accountant cannot close", () => {
  RBAC.assertPermission(UserRole.ACCOUNTANT, "PERIOD", "CLOSE_PERIOD");
}, "General accountant cannot close periods.");

expectPass("Dashboard governance differs by role", () => {
  const receivable = DashboardGovernance.widgetsForRole(UserRole.MANAGER).join(",");
  const director = DashboardGovernance.widgetsForRole(UserRole.GROUP_DIRECTOR).join(",");
  if (receivable === director) throw new Error("Dashboard widget sets are identical.");
}, "Role-specific dashboard widgets are distinct.");

const vouchers = Array.from({ length: 100 }, (_, index) => ({
  id: `voucher-${String(index + 1).padStart(3, "0")}`,
  creatorId: users[index % users.length].id,
  approverId: users[(index + 3) % users.length].id,
  status: index % 2 === 0 ? "DA_DUYET" : "CHO_DUYET",
}));

let blockedUnapproved = 0;
let allowedApproved = 0;
let fourEyesViolations = 0;
for (const voucher of vouchers) {
  try {
    RBAC.assertSegregationOfDuties(voucher.creatorId, voucher.approverId);
    VoucherWorkflowGovernance.assertPostable(voucher.status);
    allowedApproved += 1;
  } catch {
    if (voucher.creatorId === voucher.approverId) fourEyesViolations += 1;
    if (voucher.status !== "DA_DUYET") blockedUnapproved += 1;
  }
}

record("100 voucher simulation", allowedApproved === 50 && blockedUnapproved === 50 && fourEyesViolations === 0 ? "PASS" : "FAIL", `Allowed=${allowedApproved}, blocked_unapproved=${blockedUnapproved}, four_eyes=${fourEyesViolations}.`);

const failed = results.filter(item => item.status === "FAIL");
console.table(results);
if (failed.length > 0) {
  console.error(`Phase 4 governance validation failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("Phase 4 governance validation passed.");
