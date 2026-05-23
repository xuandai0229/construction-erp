import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { SessionManager, SecureSession } from "./session";
import { prisma } from "./prisma";
import { ApiError } from "./api-error";
import { AuditService } from "@/services/audit.service";
import { UserRole } from "@prisma/client";
import { RBAC, Module, Action } from "./rbac";

/**
 * Authenticated request context with user information
 * attached by the withAuth middleware
 */
export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    userId: string;
    userRole: UserRole;
    companyId: string | null;
    expiresAt: number;
  };
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    companyId: string | null;
    deletedAt: Date | null;
  };
}

export interface AuthMiddlewareOptions {
  /**
   * Require authentication for this endpoint
   * @default true
   */
  requireAuth?: boolean;

  /**
   * Allowed roles for this endpoint
   * If specified, user must have one of these roles
   */
  allowedRoles?: UserRole[];

  /**
   * Module and action for RBAC check
   * If specified, user must have permission to perform this action on this module
   */
  rbacCheck?: {
    module: Module;
    action: Action;
  };

  /**
   * Custom authorization function
   * Called after basic auth checks
   * Should throw ApiError if authorization fails
   */
  authorize?: (user: any, request: NextRequest) => Promise<void> | void;

  /**
   * Skip JWT verification (development only)
   * @default false
   */
  skipVerification?: boolean;
}

/**
 * Extract JWT token from request
 * Tries cookies first (preferred), then Authorization header
 * Per security audit: MUST verify JWT server-side, never trust x-user-role header
 */
export function extractJWT(request: NextRequest): string | null {
  const headersList = request.headers;
  const cookieHeader = headersList.get("cookie");

  // Priority 1: Check cookies for erp-session
  if (cookieHeader) {
    const cookieMatch = cookieHeader.match(/erp-session=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      return decodeURIComponent(cookieMatch[1]);
    }
  }

  // Priority 2: Check Authorization header with Bearer prefix
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Verify JWT token and extract session information
 * Uses timing-safe verification to prevent timing attacks
 */
export function verifyJWT(token: string | null): SecureSession | null {
  if (!token) return null;
  return SessionManager.verifySession(token);
}

/**
 * Fetch user from database and verify user exists and is not deleted
 */
export async function fetchUserFromDatabase(
  userId: string
): Promise<any | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        deletedAt: true,
      },
    });

    // Return null if user doesn't exist or has been deleted
    if (!user || user.deletedAt !== null) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("[Auth] Database error fetching user:", error);
    return null;
  }
}

/**
 * Log authentication failure to audit service
 */
export async function logAuthFailure(
  reason: string,
  userId?: string
): Promise<void> {
  try {
    await AuditService.log({
      action: "AUTH_FAILED",
      entity: "Security",
      entityId: userId || "ANONYMOUS",
      reason,
      severity: "CRITICAL",
    });
  } catch (error) {
    console.error("[Auth] Failed to log auth failure:", error);
  }
}

/**
 * Log authorization failure to audit service
 */
export async function logAuthorizationFailure(
  userId: string,
  reason: string,
  details?: string
): Promise<void> {
  try {
    await AuditService.log({
      userId,
      action: "SECURITY_ALERT",
      entity: "RBAC",
      entityId: userId,
      reason: `${reason}${details ? `. ${details}` : ""}`,
      severity: "CRITICAL",
    });
  } catch (error) {
    console.error("[Auth] Failed to log authorization failure:", error);
  }
}

/**
 * Higher-order function that wraps Next.js handlers with authentication middleware
 * Provides comprehensive JWT verification, user validation, and RBAC support
 *
 * @param handler - The Next.js handler function to wrap
 * @param options - Authentication middleware options
 * @returns Wrapped handler with authentication enforcement
 *
 * @example
 * // Basic authentication required
 * export const GET = withAuth(async (request) => {
 *   return Response.json({ message: "Authenticated" });
 * });
 *
 * @example
 * // Admin role required
 * export const POST = withAuth(
 *   async (request) => {
 *     return Response.json({ message: "Admin only" });
 *   },
 *   { allowedRoles: ["SUPER_ADMIN", "ADMIN"] }
 * );
 *
 * @example
 * // RBAC check for specific module/action
 * export const DELETE = withAuth(
 *   async (request) => {
 *     return Response.json({ message: "Deleted" });
 *   },
 *   { rbacCheck: { module: "PROJECT", action: "DELETE" } }
 * );
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
): (request: NextRequest) => Promise<Response> {
  const {
    requireAuth = true,
    allowedRoles,
    rbacCheck,
    authorize,
    skipVerification = false,
  } = options;

  return async (request: NextRequest): Promise<Response> => {
    try {
      // Extract JWT from request (cookies first, then Authorization header)
      const token = extractJWT(request);

      // Handle authentication
      if (requireAuth) {
        if (!token) {
          await logAuthFailure(
            "API access without a valid signed ERP session token."
          );
          return NextResponse.json(
            {
              success: false,
              error: "Authentication required: missing or invalid session token.",
            },
            { status: 401 }
          );
        }

        // Verify JWT (skip verification only in development with explicit flag)
        const session = skipVerification
          ? (JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()) as SecureSession)
          : verifyJWT(token);

        if (!session) {
          await logAuthFailure(
            "API access with invalid or expired ERP session token."
          );
          return NextResponse.json(
            {
              success: false,
              error: "Authentication failed: invalid or expired session token.",
            },
            { status: 401 }
          );
        }

        // Fetch user from database
        const user = await fetchUserFromDatabase(session.userId);
        if (!user) {
          await logAuthFailure(
            "User does not exist or has been disabled.",
            session.userId
          );
          return NextResponse.json(
            {
              success: false,
              error: "Authentication failed: user does not exist or has been disabled.",
            },
            { status: 401 }
          );
        }

        // Attach session and user to request
        (request as AuthenticatedRequest).auth = {
          userId: session.userId,
          userRole: session.role as UserRole,
          companyId: session.companyId,
          expiresAt: session.expiresAt,
        };
        (request as AuthenticatedRequest).user = user;

        // Check allowed roles
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(user.role)) {
            await logAuthorizationFailure(
              user.id,
              `Insufficient permissions: role ${user.role} not in allowed roles`,
              `Allowed roles: [${allowedRoles.join(", ")}]`
            );
            return NextResponse.json(
              {
                success: false,
                error: `Forbidden: role ${user.role} is not authorized for this action.`,
              },
              { status: 403 }
            );
          }
        }

        // Check RBAC permissions
        if (rbacCheck) {
          const { module, action } = rbacCheck;
          if (!RBAC.hasPermission(user.role, module, action)) {
            await logAuthorizationFailure(
              user.id,
              `RBAC violation: role ${user.role} attempted unauthorized action`,
              `Module: ${module}, Action: ${action}`
            );
            return NextResponse.json(
              {
                success: false,
                error: `Forbidden: role ${user.role} does not have permission to perform ${action} on ${module}.`,
              },
              { status: 403 }
            );
          }
        }

        // Custom authorization check
        if (authorize) {
          try {
            await authorize(user, request);
          } catch (error) {
            const authError = error instanceof ApiError ? error : null;
            if (authError) {
              await logAuthorizationFailure(
                user.id,
                "Custom authorization check failed",
                authError.message
              );
              return NextResponse.json(
                {
                  success: false,
                  error: authError.message,
                },
                { status: authError.statusCode }
              );
            }
            throw error;
          }
        }
      }

      // Call the handler with authenticated request
      const response = await handler(request as AuthenticatedRequest);
      return response;
    } catch (error) {
      console.error("[Auth] Unhandled error in withAuth middleware:", error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Convenience wrapper for admin-only endpoints
 */
export function withAdminAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>
): (request: NextRequest) => Promise<Response> {
  return withAuth(handler, {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  });
}

/**
 * Convenience wrapper for manager-and-above endpoints
 */
export function withManagerAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>
): (request: NextRequest) => Promise<Response> {
  return withAuth(handler, {
    allowedRoles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "BRANCH_DIRECTOR",
      "GROUP_DIRECTOR",
    ],
  });
}

/**
 * Convenience wrapper for RBAC-protected endpoints
 */
export function withRBAC(
  handler: (request: AuthenticatedRequest) => Promise<Response>,
  module: Module,
  action: Action
): (request: NextRequest) => Promise<Response> {
  return withAuth(handler, {
    rbacCheck: { module, action },
  });
}
