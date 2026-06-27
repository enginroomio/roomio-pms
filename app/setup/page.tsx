import { Suspense } from 'react';
import { SetupWizard } from '@/components/auth/SetupWizard';

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="roomio-login-page">Yükleniyor…</div>}>
      <SetupWizard />
    </Suspense>
  );
}
