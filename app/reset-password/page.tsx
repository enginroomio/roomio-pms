import { Suspense } from 'react';
import { ResetPasswordScreen } from '@/components/auth/ResetPasswordScreen';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="roomio-login-page">Yükleniyor…</div>}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
