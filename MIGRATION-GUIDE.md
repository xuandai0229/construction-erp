/**
 * Example: Migrating endpoints to use the Authentication Middleware
 *
 * This file demonstrates how to refactor existing API endpoints to use
 * the new withAuth, withAdminAuth, and withRBAC middleware functions.
 *
 * Before: Manual auth checks in handler
 * After: Declarative middleware with consistent error handling
 */

// ============================================================================
// EXAMPLE 1: Project List Endpoint
// ============================================================================

// ❌ BEFORE: Manual authentication and RBAC checks
export async function GET_BEFORE(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "PROJECT", "READ");

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");

    const { data, metadata } = await ProjectService.findMany(
      { page, limit },
      user.companyId
    );

    return successResponse(data, metadata);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Clean middleware-based approach
import { withRBAC } from "@/lib/auth-middleware";
import { handleApiError, successResponse } from "@/lib/api-error";

export const GET = withRBAC(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");

    // User is guaranteed to be authenticated and authorized
    const { data, metadata } = await ProjectService.findMany(
      { page, limit },
      request.user!.companyId
    );

    return successResponse(data, metadata);
  },
  "PROJECT",
  "READ"
);

// ============================================================================
// EXAMPLE 2: Project Creation (Admin Only)
// ============================================================================

// ❌ BEFORE: Checking for admin role manually
export async function POST_BEFORE(request: Request) {
  try {
    const user = await assertAuthenticated();
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(user.role)) {
      throw new ApiError(403, "Admin role required");
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await ProjectService.create(
      validatedData,
      user.id,
      user.companyId
    );
    return successResponse(project, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Using withAdminAuth convenience wrapper
import { withAdminAuth } from "@/lib/auth-middleware";

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const validatedData = createProjectSchema.parse(body);

  const project = await ProjectService.create(
    validatedData,
    request.user!.id,
    request.user!.companyId
  );
  return successResponse(project, null, 201);
});

// ============================================================================
// EXAMPLE 3: Cost Approval (CFO/Manager Only)
// ============================================================================

// ❌ BEFORE: Multiple role check
export async function POST_BEFORE_APPROVAL(request: Request) {
  try {
    const user = await assertAuthenticated();
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.CFO,
      UserRole.MANAGER,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ApiError(403, "Insufficient permissions");
    }

    const { costId } = await request.json();
    const result = await CostService.approve(costId, user.id);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Using custom allowedRoles
import { withAuth } from "@/lib/auth-middleware";
import { UserRole } from "@prisma/client";

export const POST = withAuth(
  async (request) => {
    const { costId } = await request.json();
    const result = await CostService.approve(costId, request.user!.id);
    return successResponse(result);
  },
  {
    allowedRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.CFO,
      UserRole.MANAGER,
    ],
  }
);

// ============================================================================
// EXAMPLE 4: Ledger Post (Complex RBAC + Financial Limit)
// ============================================================================

// ❌ BEFORE: Manual RBAC and business logic validation
export async function POST_BEFORE_LEDGER(request: Request) {
  try {
    const user = await assertAuthenticated();

    // Manual RBAC check
    const allowedActions = PERMISSION_MATRIX[user.role]?.["LEDGER"];
    if (!allowedActions?.includes("POST")) {
      await AuditService.log({
        userId: user.id,
        action: "SECURITY_ALERT",
        entity: "RBAC",
        entityId: user.id,
        reason: `RBAC violation: ${user.role} attempted POST on LEDGER`,
        severity: "CRITICAL",
      });
      throw new ApiError(403, "Insufficient permissions");
    }

    const body = await request.json();
    const { entries, amount } = body;

    // Financial authority check
    const limit = RBAC.getFinancialLimit(user.role);
    if (amount > limit) {
      throw new ApiError(
        403,
        `Amount exceeds your financial authority limit: ${limit}`
      );
    }

    const result = await LedgerService.post(entries, user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Using RBAC middleware + custom authorize
import { withRBAC } from "@/lib/auth-middleware";

export const POST = withRBAC(
  async (request) => {
    const body = await request.json();
    const { entries, amount } = body;

    // Custom business logic still handled in handler
    const limit = RBAC.getFinancialLimit(request.user!.role);
    if (amount > limit) {
      throw new ApiError(
        403,
        `Amount exceeds your financial authority limit: ${limit}`
      );
    }

    const result = await LedgerService.post(entries, request.user!.id);
    return successResponse(result);
  },
  "LEDGER",
  "POST"
);

// ============================================================================
// EXAMPLE 5: User-Specific Resource (Segregation of Duties)
// ============================================================================

// ❌ BEFORE: Checking user ownership manually
export async function DELETE_BEFORE(request: Request) {
  try {
    const user = await assertAuthenticated();

    const { costId } = request.json();
    const cost = await CostService.findById(costId);

    if (!cost) {
      throw new ApiError(404, "Cost not found");
    }

    // Check Segregation of Duties
    if (cost.createdById === user.id) {
      throw new ApiError(
        400,
        "Creator cannot delete their own cost record"
      );
    }

    const result = await CostService.delete(costId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Using custom authorize for business logic
import { withRBAC, ApiError } from "@/lib/auth-middleware";

export const DELETE = withRBAC(
  async (request) => {
    const { costId } = await request.json();
    const cost = await CostService.findById(costId);

    if (!cost) {
      throw new ApiError(404, "Cost not found");
    }

    // Business logic check (Segregation of Duties)
    if (cost.createdById === request.user!.id) {
      throw new ApiError(
        400,
        "Creator cannot delete their own cost record"
      );
    }

    const result = await CostService.delete(costId);
    return successResponse(result);
  },
  "COST",
  "DELETE"
);

// ============================================================================
// EXAMPLE 6: Company-Scoped Resource
// ============================================================================

// ❌ BEFORE: Multi-tenant access check
export async function GET_BEFORE_SCOPED(request: Request) {
  try {
    const user = await assertAuthenticated();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // Ensure user only accesses their own company's data
    if (user.companyId && companyId && user.companyId !== companyId) {
      throw new ApiError(403, "Cannot access other company's data");
    }

    const data = await findCompanyData(
      companyId || user.companyId,
      user.role
    );
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ AFTER: Using custom authorize for multi-tenancy
export const GET = withAuth(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const data = await findCompanyData(
      companyId || request.user!.companyId,
      request.user!.role
    );
    return successResponse(data);
  },
  {
    authorize: async (user) => {
      const { searchParams } = new URL(request.url);
      const companyId = searchParams.get("companyId");

      // Prevent users from accessing other companies' data
      if (user.companyId && companyId && user.companyId !== companyId) {
        throw new ApiError(403, "Cannot access other company's data");
      }
    },
  }
);

// ============================================================================
// EXAMPLE 7: Public Endpoint (No Authentication)
// ============================================================================

// ✅ AFTER: Explicitly public endpoint
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(
  async (request) => {
    // No user needed - this is public data
    const publicStats = await getPublicStatistics();
    return Response.json(publicStats);
  },
  { requireAuth: false }
);

// ============================================================================
// REFACTORING CHECKLIST
// ============================================================================

/**
 * When migrating an endpoint to use the new middleware, follow this checklist:
 *
 * ✓ 1. Identify authentication requirements (required? specific roles? RBAC check?)
 * ✓ 2. Choose appropriate wrapper:
 *      - withAuth() for basic authentication
 *      - withAdminAuth() for admin-only
 *      - withManagerAuth() for manager and above
 *      - withRBAC(handler, module, action) for RBAC
 * ✓ 3. Remove try/catch wrapper (middleware handles it)
 * ✓ 4. Remove assertAuthenticated() call
 * ✓ 5. Remove RBAC.assertPermission() call
 * ✓ 6. Remove manual role checking (use allowedRoles option)
 * ✓ 7. Replace user retrieval with request.user
 * ✓ 8. Replace error handling with ApiError throws
 * ✓ 9. Remove handleApiError() call
 * ✓ 10. Test the endpoint with various roles
 *
 * Benefits of Migration:
 * - Consistent error handling across all endpoints
 * - Automatic audit logging for auth failures
 * - Type-safe request context (request.user, request.auth)
 * - Reduced code duplication
 * - Clearer intent through middleware options
 * - Easier to maintain and audit
 */
