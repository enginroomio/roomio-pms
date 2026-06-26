import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { passwordsMatch, validatePassword } from '@/lib/auth/password';
import { changeUserPassword, getUserMustChangePassword } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!body.newPassword || !body.confirmPassword) {
      return NextResponse.json({ error: 'Yeni şifre alanları gerekli' }, { status: 400 });
    }
    if (!passwordsMatch(body.newPassword, body.confirmPassword)) {
      return NextResponse.json({ error: 'Yeni şifreler eşleşmiyor' }, { status: 400 });
    }

    const mustChange = await getUserMustChangePassword(user.id);
    const policyErr = validatePassword(body.newPassword);
    if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });

    await changeUserPassword(user.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      force: mustChange,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifre değiştirilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
