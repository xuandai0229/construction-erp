# Authentication Middleware - Quick Reference Card

## TL;DR

Use the `withAuth` middleware to add authentication and authorization to your API endpoints.

```typescript
import { withAuth, withAdminAuth, withRBAC } from "@/lib/auth-middleware";

// Basic auth: any authenticated user
export const GET = withAuth(async (request) => {
  const user = request.user;
  return Response.json({ data: user });
});

// Admin only
export const DELETE = withAdminAuth(async (request) => {
  return Response.json({ deleted: true });
});

// Specific permission: PROJECT:CREATE
export const POST = withRBAC(
  async (request) => {
    return Response.json({ created: true });
  },
  "PROJECT",
  "CREATE"
);
```

## Installation

The middleware is already in `lib/auth-middleware.ts`. No additional dependencies needed.

## Quick Start

### 1. Basic Authentication (Any User)

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (request) => {
  return Response.json({ 
    userId: request.user?.id,
    name: request.user?.name 
  });
});
```

### 2. Admin Only

```typescript
import { withAdminAuth } from "@/lib/auth-middleware";

export const POST = withAdminAuth(async (request) => {
  // Only SUPER_ADMIN and ADMIN can access
  return Response.json({ admin: true });
});
```

### 3. Manager and Above

```typescript
import { withManagerAuth } from "@/lib/auth-middleware";

export const POST = withManagerAuth(async (request) => {
  // MANAGER, BRANCH_DIRECTOR, GROUP_DIRECTOR, ADMIN, SUPER_ADMIN
  return Response.json({ manager: true });
});
```

### 4. Specific Roles

```typescript
import { withAuth } from "@/lib/auth-middleware";
import { UserRole } from "@prisma/client";

export const GET = withAuth(
  async (request) => {
    return Response.json({ data: "financial" });
  },
  { allowedRoles: [UserRole.CFO, UserRole.ACCOUNTANT] }
);
```

### 5. RBAC (Module/Action)

```typescript
import { withRBAC } from "@/lib/auth-middleware";

// Requires user to have PROJECT:DELETE permission
export const DELETE = withRBAC(
  async (request) => {
    return Response.json({ deleted: true });
  },
  "PROJECT",
  "DELETE"
);
```

### 6. Custom Authorization

```typescript
import { withAuth } from "@/lib/auth-middleware";
import { ApiError } from "@/lib/api-error";

export const POST = withAuth(
  async (request) => {
    return Response.json({ created: true });
  },
  {
    authorize: async (user) => {
      if (!user.companyId) {
        throw new ApiError(403, "Must belong to a company");
      }
    },
  }
);
```

### 7. Public Endpoint

```typescript
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(
  async (request) => {
    return Response.json({ public: "data" });
  },
  { requireAuth: false }
);
```

## Request Object Properties

```typescript
// Inside your handler:
request.auth?.userId;      // From JWT token
request.auth?.userRole;    // From JWT token
request.auth?.companyId;   // From JWT token
request.auth?.expiresAt;   // Token expiration timestamp

request.user?.id;          // From database
request.user?.email;       // From database
request.user?.name;        // From database
request.user?.role;        // From database
request.user?.companyId;   // From database
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required: missing or invalid session token."
}
```
**When**: No JWT, invalid JWT, expired JWT, or user not found

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: role VIEWER is not authorized for this action."
}
```
**When**: Insufficient permissions, role not allowed, RBAC check failed

## Available Options

```typescript
interface AuthMiddlewareOptions {
  requireAuth?: boolean;              // Default: true
  allowedRoles?: UserRole[];         // List of allowed roles
  rbacCheck?: {                       // RBAC permission check
    module: Module;
    action: Action;
  };
  authorize?: (user, request) => Promise<void>;  // Custom check
  skipVerification?: boolean;         // Dev only!
}
```

## RBAC Modules & Actions

### Modules
`PROJECT`, `COST`, `REVENUE`, `INVOICE`, `LEDGER`, `PERIOD`, `AUDIT`, `REPORT`

### Actions
`READ`, `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `POST`, `REVERSE`, `LOCK`, `UNLOCK`, `EXPORT`

## Common Roles

| Role | Level | Use Case |
|------|-------|----------|
| `SUPER_ADMIN` | Highest | System administrator |
| `ADMIN` | High | Company administrator |
| `CFO` | High | Financial officer |
| `GROUP_DIRECTOR` | Medium | Group management |
| `BRANCH_DIRECTOR` | Medium | Branch management |
| `MANAGER` | Medium | Department management |
| `ACCOUNTANT` | Low | Finance operations |
| `AUDITOR` | Low | Audit access |
| `VIEWER` | Lowest | Read-only access |

## Testing

### Create Test Token
```typescript
import { SessionManager } from "@/lib/session";

const token = SessionManager.createSession(
  "user-id-123",
  "ADMIN",
  "company-id-456"
);
```

### Make Test Request
```typescript
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: {
    "cookie": `erp-session=${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ data: "test" }),
});
```

## Troubleshooting

### Always getting 401
- Verify token is valid: `SessionManager.createSession(userId, role)`
- Check token is in cookie or Authorization header
- Verify user exists in database

### Always getting 403
- Check user has required role via `RBAC.hasPermission()`
- Verify RBAC check is correct (module/action spelling)
- Check `allowedRoles` array includes user's role

### Custom authorize not called
- Verify no error in `authorize` function
- Check middleware options syntax is correct
- Ensure function doesn't throw before called

## Documentation

- **Full Guide**: `AUTH-MIDDLEWARE.md`
- **Migration Examples**: `MIGRATION-GUIDE.md`
- **Validation Checklist**: `AUTH-MIDDLEWARE-VALIDATION.md`
- **Integration Tests**: `tests/integration-auth-middleware.ts`

## Security Reminder

✅ JWT is verified server-side  
✅ User is validated against database  
✅ `x-user-role` header is ignored  
✅ All failures are audit logged  
✅ Timing-safe verification prevents attacks  

**Never** trust client-provided role or identity headers!
