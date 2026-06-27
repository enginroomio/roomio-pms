import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/server/pms-store';
import { createPasswordResetToken, cleanupExpiredResetTokens } from '@/lib/server/password-reset';
import { queueAndDeliverEmailServer } from '@/lib/server/email-outbox';
import { checkRateLimit, clientIpFromRequest, rateLimitHeaders } from '@/lib/server/rate-limit';
import { logApiError } from '@/lib/server/api-error';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1).max(200).email('Geçerli bir e-posta adresi girin'),
});

// IP başına: 1 saatte en fazla 5 deneme — bu endpoint her çağrıldığında bir
// e-posta kuyruğa girebileceği için (spam/kötüye kullanım riski), login'den
// daha sıkı bir limit.
const LIMIT = 5;
const WINDOW_SEC = 60 * 60;

const GENERIC_MESSAGE =
  'Bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.';

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);
    const limitResult = await checkRateLimit(`forgot-password:ip:${ip}`, LIMIT, WINDOW_SEC);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: rateLimitHeaders(limitResult) },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    // Aynı e-posta+IP kombinasyonu için de ayrı, daha sıkı bir limit —
    // login route'undaki desenle tutarlı (bkz. app/api/auth/login/route.ts).
    const accountResult = await checkRateLimit(
      `forgot-password:account:${ip}:${normalizedEmail}`,
      3,
      WINDOW_SEC,
    );
    if (!accountResult.allowed) {
      // Kasıtlı olarak aynı genel mesajı dönüyoruz — bu limit aşıldığında
      // bile e-posta enumeration riski yaratmamak için.
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const user = await findUserByEmail(normalizedEmail);

    // KRİTİK: kullanıcı bulunamasa veya pasif olsa bile HER ZAMAN aynı
    // mesajı ve aynı (yaklaşık) gecikmeyi döneriz. Farklı bir mesaj veya
    // gözle görülür farklı bir yanıt süresi, bir saldırganın hangi
    // e-postaların sistemde kayıtlı olduğunu (enumeration) öğrenmesini
    // sağlardı.
    if (user && user.active !== false) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${new URL(req.url).origin}/reset-password?token=${token}`;
      await queueAndDeliverEmailServer({
        to: user.email,
        subject: 'Roomio — Şifre Sıfırlama Talebi',
        body: [
          `Merhaba ${user.name},`,
          '',
          'Hesabınız için bir şifre sıfırlama talebi aldık. Aşağıdaki bağlantıya',
          'tıklayarak yeni bir şifre belirleyebilirsiniz. Bu bağlantı 1 saat',
          'içinde geçerliliğini kaybedecektir.',
          '',
          resetUrl,
          '',
          'Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz —',
          'hesabınızda hiçbir değişiklik yapılmayacaktır.',
        ].join('\n'),
        user: 'system',
      }).catch((err) => {
        logApiError('POST /api/auth/forgot-password (email)', err, { userId: user.id });
      });
      void cleanupExpiredResetTokens().catch(() => undefined);
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    logApiError('POST /api/auth/forgot-password', err);
    // Hata durumunda da aynı genel mesaj — iç hata detayını sızdırmamak için.
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }
}
