'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';

function MustChangePasswordGuardInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mustChangePassword, loading, authenticated, authRequired } = useSession();

  const onPasswordPage =
    pathname.startsWith('/settings') && searchParams.get('tab') === 'password';

  useEffect(() => {
    if (loading || !authRequired || !authenticated || !mustChangePassword) return;
    if (onPasswordPage) return;
    router.replace('/settings?tab=password&required=1');
  }, [loading, authRequired, authenticated, mustChangePassword, onPasswordPage, router]);

  if (!loading && authRequired && authenticated && mustChangePassword && !onPasswordPage) {
    return <div className="roomio-page-desc" style={{ padding: 24 }}>Yönlendiriliyor…</div>;
  }

  return <>{children}</>;
}

export function MustChangePasswordGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <MustChangePasswordGuardInner>{children}</MustChangePasswordGuardInner>
    </Suspense>
  );
}
