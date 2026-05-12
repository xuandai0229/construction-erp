'use client';

import { useERPStore } from '@/store/erpStore';
import { Permission } from '@/lib/auth/permissions';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enterprise Permission Guard Component
 * Hides children if user does not have the required permission.
 */
export default function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const canDo = useERPStore(state => state.canDo);
  const initialized = useERPStore(state => state.initialized);

  if (!initialized) return null;

  if (canDo(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
