/**
 * Integration Test: Auth Middleware with Real API Routes
 *
 * This file demonstrates how the auth middleware integrates with real API routes
 * and can be used as a reference for refactoring existing endpoints.
 */

import { withAuth, withAdminAuth, withRBAC, withManagerAuth } from "@/lib/auth-middleware";
import { successResponse, handleApiError } from "@/lib/api-error";
import { NextRequest } from "next/server";

/**
 * Example 1: Projects GET endpoint using RBAC
 */
export const GET_projects = withRBAC(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");

    // At this point, user is guaranteed to be authenticated and have PROJECT:READ permission
    const user = request.user!;
    const auth = request.auth!;

    console.log(`User ${user.id} (${user.role}) reading projects with auth`, {
      userId: auth.userId,
      userRole: auth.userRole,
      expiresAt: new Date(auth.expiresAt),
    });

    // Fetch projects (mock)
    const projects = [
      { id: "proj-1", name: "Project Alpha", ownerId: user.id },
      { id: "proj-2", name: "Project Beta", ownerId: user.id },
    ];

    return successResponse(projects, { page, limit, total: 2 });
  },
  "PROJECT",
  "READ"
);

/**
 * Example 2: Projects POST endpoint using admin auth
 */
export const POST_projects = withAdminAuth(async (request) => {
  const body = await request.json();
  const user = request.user!;

  console.log(`Admin user ${user.id} creating project: ${body.name}`);

  // Create project (mock)
  const project = {
    id: "proj-new",
    name: body.name,
    ownerId: user.id,
    createdAt: new Date(),
  };

  return successResponse(project, null, 201);
});

/**
 * Example 3: Costs POST for approval using manager auth
 */
export const POST_costs_approve = withManagerAuth(async (request) => {
  const { costId } = await request.json();
  const user = request.user!;

  console.log(`Manager ${user.id} approving cost ${costId}`);

  // Approve cost (mock)
  const result = {
    success: true,
    costId,
    approvedBy: user.id,
    approvedAt: new Date(),
  };

  return successResponse(result);
});

/**
 * Example 4: Ledger POST using RBAC with custom validation
 */
export const POST_ledger = withRBAC(
  async (request) => {
    const body = await request.json();
    const user = request.user!;

    console.log(
      `User ${user.id} (${user.role}) posting ledger entry with amount ${body.amount}`
    );

    // Post ledger (mock)
    const entry = {
      id: "entry-123",
      userId: user.id,
      amount: body.amount,
      description: body.description,
      postedAt: new Date(),
    };

    return successResponse(entry);
  },
  "LEDGER",
  "POST"
);

/**
 * Example 5: Custom authorization for company-scoped resources
 */
export const GET_company_data = withAuth(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get("companyId");
    const user = request.user!;

    console.log(
      `User ${user.id} accessing company data for company ${requestedCompanyId || user.companyId}`
    );

    // Return company data (mock)
    const data = {
      companyId: requestedCompanyId || user.companyId,
      revenue: 1000000,
      expenses: 500000,
    };

    return successResponse(data);
  },
  {
    // Custom authorization: users can only access their own company's data
    authorize: async (user) => {
      const { searchParams } = new URL(request.url);
      const requestedCompanyId = searchParams.get("companyId");

      if (
        requestedCompanyId &&
        user.companyId &&
        requestedCompanyId !== user.companyId
      ) {
        throw new Error("Cannot access other company's data");
      }
    },
  }
);

/**
 * Example 6: Invoice endpoint combining multiple checks
 */
export const DELETE_invoice = withRBAC(
  async (request) => {
    const { invoiceId } = await request.json();
    const user = request.user!;

    console.log(`User ${user.id} deleting invoice ${invoiceId}`);

    // Delete invoice (mock)
    return successResponse({
      success: true,
      deletedId: invoiceId,
      deletedBy: user.id,
    });
  },
  "INVOICE",
  "DELETE"
);

/**
 * Example Integration Test Scenarios
 */
export const TEST_SCENARIOS = {
  /**
   * Scenario 1: Valid authenticated request
   */
  valid_auth: {
    description: "User with valid JWT and proper role",
    token: "valid-jwt-token",
    role: "ADMIN",
    expectedStatus: 200,
    expectedResult: "Success - user data attached to request",
  },

  /**
   * Scenario 2: Missing authentication
   */
  missing_auth: {
    description: "Request with no JWT token",
    token: null,
    role: null,
    expectedStatus: 401,
    expectedResult: "Error - authentication required",
  },

  /**
   * Scenario 3: Invalid JWT
   */
  invalid_jwt: {
    description: "Request with malformed JWT",
    token: "invalid.token.format",
    role: null,
    expectedStatus: 401,
    expectedResult: "Error - invalid or expired session",
  },

  /**
   * Scenario 4: Insufficient permissions
   */
  insufficient_permissions: {
    description: "VIEWER user trying to create PROJECT",
    token: "valid-jwt-viewer",
    role: "VIEWER",
    expectedStatus: 403,
    expectedResult: "Error - insufficient permissions",
  },

  /**
   * Scenario 5: Malicious client header
   */
  client_role_header: {
    description: "User claims to be ADMIN via x-user-role header",
    token: null,
    role: "VIEWER",
    headers: { "x-user-role": "ADMIN" },
    expectedStatus: 401,
    expectedResult: "Error - header ignored, no valid JWT",
  },

  /**
   * Scenario 6: Custom authorization failure
   */
  company_scope_violation: {
    description: "User accessing another company's data",
    token: "valid-jwt-user",
    role: "MANAGER",
    companyId: "company-1",
    requestedCompanyId: "company-2",
    expectedStatus: 403,
    expectedResult: "Error - cannot access other company data",
  },
};

/**
 * How to Run Integration Tests
 *
 * 1. Create test tokens:
 * ```typescript
 * import { SessionManager } from "@/lib/session";
 * const token = SessionManager.createSession("user-123", "ADMIN", "company-456");
 * ```
 *
 * 2. Make requests with tokens:
 * ```typescript
 * const response = await fetch("/api/projects", {
 *   headers: {
 *     cookie: `erp-session=${token}`,
 *   },
 * });
 * ```
 *
 * 3. Verify responses:
 * ```typescript
 * expect(response.status).toBe(200);
 * const data = await response.json();
 * expect(data.success).toBe(true);
 * ```
 */
