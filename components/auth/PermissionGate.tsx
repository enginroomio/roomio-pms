'use client';

import type { Permission } from '@/lib/auth/roles';
import { hasPermission } from '@/lib/auth/roles';
import { useSession } from '@/components/auth/SessionProvider';

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useSession();
  if (!hasPermission(user, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
