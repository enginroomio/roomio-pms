import { Suspense } from 'react';
import { LoginScreen } from '@/components/auth/LoginScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="roomio-login-page">Yükleniyor…</div>}>
      <LoginScreen />
    </Suspense>
  );
}
