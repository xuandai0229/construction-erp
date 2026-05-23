# Authentication Middleware Guide

## Overview

The `lib/auth-middleware.ts` module provides a comprehensive authentication and authorization middleware system for the Construction ERP. It enforces server-side JWT verification, user validation, and role-based access control (RBAC) as required by the security audit.

## Key Features

✅ **Server-side JWT Verification** - Never trusts client headers  
✅ **User Database Validation** - Verifies user exists and is not deleted  
✅ **Automatic Audit Logging** - Logs all auth failures with CRITICAL severity  
✅ **Role-Based Access Control** - Enforces RBAC using the centralized permission matrix  
✅ **Timing-Safe Verification** - Prevents timing attacks  
✅ **TypeScript Support** - Full type safety with proper interfaces  
✅ **Cookie & Bearer Token Support** - Prefers secure cookies over headers  

## Security Requirements Met

Per the enterprise audit requirements:

1. ✅ **MUST verify JWT server-side** - `verifyJWT()` uses `SessionManager.verifySession()` with timing-safe HMAC verification
2. ✅ **Never trust x-user-role header** - Header is completely ignored; only cookies and Authorization headers are accepted
3. ✅ **MUST check user exists in database** - `fetchUserFromDatabase()` validates user exists and is not deleted
4. ✅ **Return 401 for unauthenticated** - Explicit 401 response when JWT is missing or invalid
5. ✅ **Support role-based checks** - `allowedRoles` option enforces role restrictions
6. ✅ **Support RBAC checks** - `rbacCheck` option uses centralized permission matrix
7. ✅ **Audit logging** - All failures logged via `AuditService` with severity CRITICAL

## Core Functions

### `withAuth(handler, options)`

Higher-order function that wraps Next.js request handlers with authentication middleware.

**Type Signature:**
```typescript
function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>,
  options?: AuthMiddlewareOptions
): (request: NextRequest) => Promise<Response>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `handler` | Function | Required | The Next.js route handler to wrap |
| `options` | Object | `{}` | Middleware configuration options |
| `options.requireAuth` | boolean | `true` | Require authentication for this endpoint |
| `options.allowedRoles` | UserRole[] | `undefined` | List of allowed roles; if specified, user must have one |
| `options.rbacCheck` | Object | `undefined` | RBAC check: `{ module: Module, action: Action }` |
| `options.authorize` | Function | `undefined` | Custom authorization function for additional checks |
| `options.skipVerification` | boolean | `false` | Skip JWT verification (dev only) |

**Returns:**
- Wrapped handler that enforces authentication/authorization before calling the original handler
- The wrapped handler receives `AuthenticatedRequest` with `.auth` and `.user` properties attached
- Returns appropriate HTTP responses on auth failures:
  - `401 Unauthorized` - Missing/invalid JWT or user not found
  - `403 Forbidden` - Insufficient permissions
  - `500 Internal Server Error` - Unexpected errors

## Usage Examples

### Basic Authentication (Any Authenticated User)

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (request) => {
  const user = request.user;
  return Response.json({
    message: `Hello, ${user?.name}`,
    userId: request.auth?.userId,
  });
});
```

### Admin-Only Endpoint

```typescript
import { withAdminAuth } from "@/lib/auth-middleware";

export const DELETE = withAdminAuth(async (request) => {
  // Only SUPER_ADMIN and ADMIN roles can access
  return Response.json({ message: "Resource deleted by admin" });
});
```

### Manager and Above

```typescript
import { withManagerAuth } from "@/lib/auth-middleware";

export const POST = withManagerAuth(async (request) => {
  // SUPER_ADMIN, ADMIN, MANAGER, BRANCH_DIRECTOR, GROUP_DIRECTOR can access
  return Response.json({ message: "Manager action performed" });
});
```

### Specific Roles

```typescript
import { withAuth } from "@/lib/auth-middleware";
import { UserRole } from "@prisma/client";

export const GET = withAuth(
  async (request) => {
    return Response.json({ message: "Financial report" });
  },
  {
    allowedRoles: [UserRole.CFO, UserRole.ACCOUNTANT, UserRole.ADMIN],
  }
);
```

### RBAC Check (Module/Action)

```typescript
import { withRBAC } from "@/lib/auth-middleware";

export const POST = withRBAC(
  async (request) => {
    const body = await request.json();
    // Create project logic
    return Response.json({ message: "Project created" });
  },
  "PROJECT",
  "CREATE"
);
```

### Custom Authorization

```typescript
import { withAuth } from "@/lib/auth-middleware";
import { ApiError } from "@/lib/api-error";

export const POST = withAuth(
  async (request) => {
    const body = await request.json();
    return Response.json({ message: "Created" });
  },
  {
    authorize: async (user, request) => {
      const body = await request.json();

      // Custom business logic
      if (body.companyId && !user.companyId) {
        throw new ApiError(403, "Users must belong to a company");
      }

      // Verify user's company matches
      if (body.companyId && body.companyId !== user.companyId) {
        throw new ApiError(403, "Cannot access resources from other companies");
      }
    },
  }
);
```

### Public Endpoint (No Authentication)

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(
  async (request) => {
    return Response.json({ message: "Public data" });
  },
  { requireAuth: false }
);
```

## Authentication Flow

```
Request arrives
    ↓
Extract JWT (cookies first, then Authorization header)
    ↓
Verify JWT signature & expiration
    ↓
Fetch user from database
    ↓
Check user exists & not deleted
    ↓
Apply allowedRoles check (if specified)
    ↓
Apply RBAC check (if specified)
    ↓
Apply custom authorize function (if specified)
    ↓
Attach auth context to request
    ↓
Call handler
```

## Interfaces

### `AuthenticatedRequest`

Extended `NextRequest` with authentication context:

```typescript
export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    userId: string;                    // User ID from JWT
    userRole: UserRole;               // User role from JWT
    companyId: string | null;         // Company ID from JWT (if any)
    expiresAt: number;                // Token expiration timestamp
  };
  user?: {
    id: string;                       // User ID from database
    email: string;                    // User email from database
    name: string | null;              // User name from database
    role: UserRole;                   // User role from database
    companyId: string | null;         // Company ID from database (if any)
    deletedAt: Date | null;           // Deletion timestamp (if deleted)
  };
}
```

### `AuthMiddlewareOptions`

Configuration options for middleware:

```typescript
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  rbacCheck?: {
    module: Module;
    action: Action;
  };
  authorize?: (user: any, request: NextRequest) => Promise<void> | void;
  skipVerification?: boolean;
}
```

## JWT Extraction & Verification

### Token Sources (Priority Order)

1. **Cookie (`erp-session`)** - Most secure, included with every request
2. **Authorization Header (`Bearer <token>`)** - For API clients without cookie support
3. **NOT from `x-user-role` header** - Completely ignored per security audit

### Token Verification

- Uses `SessionManager.verifySession()` which provides:
  - HMAC-SHA256 signature verification
  - Timing-safe comparison to prevent timing attacks
  - Expiration validation (2-hour default session lifetime)
  - Base64URL encoding/decoding

## Error Handling

### 401 Unauthorized

Returned when:
- No JWT token found in request
- JWT token is invalid or malformed
- JWT token has expired
- User doesn't exist in database
- User has been soft-deleted (`deletedAt` is not null)

**Response:**
```json
{
  "success": false,
  "error": "Authentication failed: invalid or expired session token."
}
```

### 403 Forbidden

Returned when:
- User role not in `allowedRoles`
- User doesn't have RBAC permission for module/action
- Custom authorization function rejects access

**Response:**
```json
{
  "success": false,
  "error": "Forbidden: role VIEWER is not authorized for this action."
}
```

### 500 Internal Server Error

Returned when:
- Unexpected error during authentication
- Database connection error
- Audit logging failure

**Response:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Audit Logging

All authentication and authorization failures are logged to the audit service with `severity: "CRITICAL"`:

### Authentication Failure
```typescript
await AuditService.log({
  action: "AUTH_FAILED",
  entity: "Security",
  entityId: userId || "ANONYMOUS",
  reason: "API access without a valid signed ERP session token.",
  severity: "CRITICAL",
});
```

### Authorization Failure
```typescript
await AuditService.log({
  userId: user.id,
  action: "SECURITY_ALERT",
  entity: "RBAC",
  entityId: user.id,
  reason: "RBAC violation: role VIEWER attempted unauthorized action. Module: PROJECT, Action: DELETE",
  severity: "CRITICAL",
});
```

## Development & Testing

### Skip Verification (Dev Only)

```typescript
export const GET = withAuth(
  async (request) => {
    return Response.json({ data: request.user });
  },
  {
    skipVerification: true, // Only in development, never in production
  }
);
```

### Create Test Token

```typescript
import { SessionManager } from "@/lib/session";

const token = SessionManager.createSession(
  "user-id-123",
  "ADMIN",
  "company-id-456"
);

// Use in fetch
fetch("/api/endpoint", {
  headers: {
    cookie: `erp-session=${token}`,
  },
});
```

## Migration Guide

### Before (Using `assertAuthenticated()` directly)

```typescript
export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "PROJECT", "READ");
    // ... handler logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

### After (Using `withAuth` middleware)

```typescript
export const GET = withRBAC(
  async (request) => {
    const user = request.user;
    // ... handler logic
    return Response.json(data);
  },
  "PROJECT",
  "READ"
);
```

Benefits:
- Cleaner, more declarative code
- Consistent error handling
- Automatic audit logging
- Type-safe with `AuthenticatedRequest`
- Reusable across endpoints

## Performance Considerations

- **JWT Verification**: O(1) - Constant time HMAC verification
- **Database Lookup**: O(1) - User fetched by indexed primary key
- **RBAC Check**: O(1) - Simple object lookup in permission matrix
- **Overall Latency**: ~1-5ms (excluding network)

The middleware is efficient and suitable for high-throughput endpoints.

## Security Considerations

1. **Session Secret**: Loaded from `SESSION_SECRET` environment variable or defaults to hardcoded value (should be env-based in production)
2. **Token Expiration**: 2 hours default (user must re-authenticate after)
3. **HTTPS Only**: Should be enforced at infrastructure level
4. **Timing Attacks**: Prevented using `crypto.timingSafeEqual()`
5. **User Deletion**: Checked via `deletedAt` field for soft-delete support
6. **Audit Trail**: All failures logged for forensic analysis

## Common Issues

### Issue: Always getting 401

**Solution**: Ensure token is valid and not expired:
```typescript
const token = SessionManager.createSession(userId, role);
console.log(token); // Use in Cookie: erp-session=<token>
```

### Issue: RBAC check not working

**Solution**: Verify role has permission in `PERMISSION_MATRIX`:
```typescript
// Check what permissions exist for your role
import { RBAC } from "@/lib/rbac";
const hasPermission = RBAC.hasPermission("VIEWER", "PROJECT", "DELETE");
console.log(hasPermission); // false for VIEWER
```

### Issue: Custom authorize not being called

**Solution**: Ensure `authorize` function doesn't throw before being called. Verify middleware options are passed correctly.

## References

- **Session Management**: `lib/session.ts`
- **RBAC System**: `lib/rbac.ts`
- **User Model**: `prisma/schema.prisma` (User model)
- **Audit Service**: `services/audit.service.ts`
- **API Error Handling**: `lib/api-error.ts`
- **Security Audit**: `AUDIT_REPORT.md` and `ENTERPRISE_HARDENING_REPORT.md`
