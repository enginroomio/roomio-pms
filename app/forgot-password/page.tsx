import { Suspense } from 'react';
import { ForgotPasswordScreen } from '@/components/auth/ForgotPasswordScreen';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="roomio-login-page">Yükleniyor…</div>}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
