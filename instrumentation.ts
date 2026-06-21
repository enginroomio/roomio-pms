export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  if (process.env.ROOMIO_AUTOMATION === '1' || process.env.NODE_ENV === 'production') {
    const { startServerHotspotAutomation } = await import(
      '@/lib/integrations/hotspot5651/automation-scheduler'
    );
    startServerHotspotAutomation();
  }

  if (process.env.NODE_ENV === 'production') {
    const { initSentry } = await import('@/lib/monitoring/sentry');
    initSentry();

    const { seedDatabaseIfEmpty } = await import('@/lib/server/seed');
    await seedDatabaseIfEmpty();

    const { migratePushSubscriptionsFromFile } = await import('@/lib/server/push-store');
    await migratePushSubscriptionsFromFile();

    const { warmTcmbCache } = await import('@/lib/server/exchange-rates-service');
    const { startTcmbDailyScheduler } = await import('@/lib/server/tcmb-scheduler');
    void warmTcmbCache();
    startTcmbDailyScheduler();
  }
}
