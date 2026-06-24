'use client';

import { Suspense, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { canAccessRoute, hasPermission } from '@/lib/auth/roles';

function RouteAccessGuardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useSession();

  const section = searchParams.get('section');
  const tab = searchParams.get('tab');

  const allowed = useMemo(() => {
    if (loading) return true;
    return canAccessRoute(user, pathname, { section, tab });
  }, [loading, user, pathname, section, tab]);

  if (loading) return <>{children}</>;

  if (!allowed) {
    const identityHint = hasPermission(user, 'identity.read');
    const hkHint = pathname.startsWith('/housekeeping') && !hasPermission(user, 'hk.manage');
    const accountingHint = pathname.startsWith('/accounting') && !hasPermission(user, 'accounting.read');
    return (
      <div className="roomio-card" style={{ margin: '8px 0', padding: 20 }}>
        <h2 className="roomio-card-title">Erişim reddedildi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Bu sayfa için yetkiniz bulunmuyor.
          {hkHint ? ' Kat hizmetleri ekranları için hk.manage izni gerekir.' : ''}
          {accountingHint ? ' Muhasebe ekranları için accounting.read izni gerekir.' : ''}
          {identityHint && !hkHint && !accountingHint ? ' Kimlik okuma yetkisi ile kullanıcı ve grup tanımlarına erişebilirsiniz.' : ''}
        </p>
        <div className="roomio-quick-actions" style={{ marginTop: 12 }}>
          <Button href="/">Ana sayfa</Button>
          {identityHint ? (
            <>
              <Button variant="secondary" href="/settings?section=users">Kullanıcı tanımları</Button>
              <Button variant="secondary" href="/settings?section=user-groups">Grup tanımları</Button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <RouteAccessGuardInner>{children}</RouteAccessGuardInner>
    </Suspense>
  );
}
