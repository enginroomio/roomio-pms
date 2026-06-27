import { isAuthRequired, isDemoAuthEnabled } from '@/lib/auth/config';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { loadChannelManagerConfig } from '@/lib/integrations/channel-manager/client';
import { hasChannelGateway } from '@/lib/integrations/channel-manager/adapters/gateway';
import { loadLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import type { DeployCheck, ProductionReadiness } from '@/lib/deploy/types';
import { getGroupBlocksSummaryServer } from '@/lib/server/group-reservations';
import { collectHealthStatus } from '@/lib/server/health';
import { getLoyaltySummary } from '@/lib/loyalty/service';
import { pushConfigured, countPushSubscriptions } from '@/lib/server/push-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getRevenueForecast } from '@/lib/revenue-management/forecast';

function check(
  id: string,
  label: string,
  category: DeployCheck['category'],
  ok: boolean,
  detail?: string,
  warn = false,
): DeployCheck {
  return { id, label, category, ok, detail, warn: warn || undefined };
}

export async function getProductionReadiness(propertyId = DEFAULT_PROPERTY_ID): Promise<ProductionReadiness> {
  const checks: DeployCheck[] = [];
  const health = await collectHealthStatus();

  checks.push(
    check('health', 'Sistem sağlığı', 'infra', health.ok, health.ok ? 'Tüm çekirdek kontroller geçti' : 'Bir veya daha fazla kontrol başarısız'),
    check(
      'database',
      'Veritabanı',
      'infra',
      health.checks?.database?.ok ?? false,
      health.checks?.database?.detail,
    ),
    check(
      'redis',
      'Redis / cache',
      'infra',
      health.checks?.redis?.ok ?? false,
      health.checks?.redis?.detail,
      !(health.checks?.redis?.ok ?? false),
    ),
  );

  const authRequired = isAuthRequired();
  const jwtSecret = process.env.ROOMIO_JWT_SECRET ?? '';
  const jwtOk = jwtSecret.length >= 32 && !jwtSecret.includes('replace-with');
  checks.push(
    check(
      'auth-required',
      'Oturum zorunluluğu',
      'security',
      !authRequired || jwtOk,
      authRequired ? (jwtOk ? 'ROOMIO_AUTH_REQUIRED=1 · JWT yapılandırıldı' : 'JWT secret eksik veya zayıf') : 'Geliştirme modu (auth opsiyonel)',
      authRequired && !jwtOk,
    ),
    check(
      'demo-auth',
      'Demo oturum',
      'security',
      !isDemoAuthEnabled() || process.env.NODE_ENV !== 'production',
      isDemoAuthEnabled() ? 'Demo rol seçici açık — production\'da kapatın' : 'Demo auth kapalı',
      isDemoAuthEnabled() && process.env.NODE_ENV === 'production',
    ),
  );

  const dbUrl = process.env.DATABASE_URL ?? '';
  const isPostgres = dbUrl.startsWith('postgres');
  checks.push(
    check(
      'database-provider',
      'PostgreSQL (önerilen)',
      'security',
      isPostgres || process.env.NODE_ENV !== 'production',
      isPostgres ? 'postgresql' : 'sqlite — production için PRISMA_SCHEMA=postgresql önerilir',
      !isPostgres && process.env.NODE_ENV === 'production',
    ),
  );

  try {
    const forecast = await getRevenueForecast(propertyId, 7);
    checks.push(
      check(
        'rms',
        'Gelir yönetimi (RMS)',
        'module',
        forecast.days.length >= 7,
        `${forecast.days.length}g tahmin · %${forecast.summary.avgOccupancy} doluluk`,
      ),
    );
  } catch (e) {
    checks.push(check('rms', 'Gelir yönetimi (RMS)', 'module', false, e instanceof Error ? e.message : 'hata'));
  }

  try {
    const loyaltyConfig = await loadLoyaltyConfig();
    const loyalty = await getLoyaltySummary(propertyId);
    checks.push(
      check(
        'loyalty',
        'Sadakat programı',
        'module',
        loyaltyConfig.enabled,
        `${loyalty.accountCount} üye · ${loyalty.totalPoints} puan`,
        !loyaltyConfig.enabled,
      ),
    );
  } catch (e) {
    checks.push(check('loyalty', 'Sadakat programı', 'module', false, e instanceof Error ? e.message : 'hata'));
  }

  try {
    const groups = await getGroupBlocksSummaryServer(propertyId);
    checks.push(
      check(
        'groups',
        'Grup & blok yönetimi',
        'module',
        true,
        `${groups.groupCount} grup · %${groups.pickupPct} pickup · ${groups.dueForRelease} release bekleyen`,
      ),
    );
  } catch (e) {
    checks.push(check('groups', 'Grup & blok yönetimi', 'module', false, e instanceof Error ? e.message : 'hata'));
  }

  try {
    const channel = await loadChannelManagerConfig();
    const live = isIntegrationLiveMode();
    checks.push(
      check(
        'channel-manager',
        'Kanal yöneticisi',
        'module',
        channel.enabled,
        `${channel.enabled ? 'aktif' : 'kapalı'} · ${live ? 'canlı mod' : 'simülasyon'}${hasChannelGateway() ? ' · gateway' : ''}`,
        !channel.enabled,
      ),
    );
  } catch (e) {
    checks.push(check('channel-manager', 'Kanal yöneticisi', 'module', false, e instanceof Error ? e.message : 'hata'));
  }

  const publicUrl = (process.env.ROOMIO_PUBLIC_URL ?? process.env.ROOMIO_PRODUCTION_URL ?? '').trim();
  const httpsOk = publicUrl.startsWith('https://') || process.env.NODE_ENV !== 'production';
  checks.push(
    check(
      'https',
      'HTTPS / public URL',
      'security',
      httpsOk,
      publicUrl ? publicUrl : 'ROOMIO_PUBLIC_URL tanımlı değil — Fly/Render TLS sonrası ayarlayın',
      !httpsOk,
    ),
  );

  const vapidOk = pushConfigured();
  let pushDetail = vapidOk ? 'VAPID anahtarları yapılandırıldı' : 'npm run vapid:gen → Fly/Render secrets';
  if (vapidOk) {
    try {
      const subs = await countPushSubscriptions('hk');
      pushDetail += ` · ${subs} HK cihaz`;
    } catch {
      pushDetail += ' · abonelik sayısı okunamadı';
    }
  }
  checks.push(
    check(
      'push',
      'HK mobil push',
      'infra',
      vapidOk || process.env.NODE_ENV !== 'production',
      pushDetail,
      !vapidOk && process.env.NODE_ENV === 'production',
    ),
  );

  const sentryOk = Boolean(process.env.SENTRY_DSN?.trim());
  checks.push(
    check(
      'sentry',
      'Sentry hata izleme',
      'infra',
      sentryOk || process.env.NODE_ENV !== 'production',
      sentryOk ? 'SENTRY_DSN yapılandırıldı' : 'Opsiyonel — production için önerilir',
      !sentryOk && process.env.NODE_ENV === 'production',
    ),
  );

  const passed = checks.filter((c) => c.ok && !c.warn).length;
  const failed = checks.filter((c) => !c.ok).length;
  const warned = checks.filter((c) => c.warn).length;

  return {
    ok: failed === 0,
    checkedAt: new Date().toISOString(),
    checks,
    summary: { passed, failed, warned, total: checks.length },
    release: {
      version: health.version,
      builtAt: health.build ?? undefined,
      gitSha: health.gitSha,
    },
  };
}
