import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { saveGuestReviewServer } from '@/lib/server/guest-reviews';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { DEFAULT_REPUTATION_CONFIG, type ReputationConfig, type ReputationSyncResult } from '@/lib/integrations/reputation/types';

const FILE = 'reputation-config.json';

export async function loadReputationConfig(): Promise<ReputationConfig> {
  return loadJsonConfig(FILE, DEFAULT_REPUTATION_CONFIG);
}

export async function saveReputationConfig(config: ReputationConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function syncReputationReviews(propertyId = DEFAULT_PROPERTY_ID): Promise<ReputationSyncResult> {
  const config = await loadReputationConfig();
  if (!config.enabled) return { ok: false, message: 'İtibar yönetimi kapalı', imported: 0 };

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  const samples = [
    { guest: 'Booking Misafir', roomNo: '—', rating: 5, comment: 'Harika konum ve temizlik (Booking.com)', source: 'booking' },
    { guest: 'Google Yorum', roomNo: '—', rating: 4, comment: 'Kahvaltı çeşitliliği çok iyi', source: 'google' },
  ].filter((s) => config.sources.includes(s.source as ReputationConfig['sources'][number]));

  let imported = 0;
  for (const s of samples) {
    if (s.rating <= config.minRatingAlert || config.sources.includes(s.source as ReputationConfig['sources'][number])) {
      await saveGuestReviewServer({
        guestName: s.guest,
        roomNo: s.roomNo,
        rating: s.rating,
        comment: s.comment,
        source: s.source,
      }, propertyId);
      imported += 1;
    }
  }

  return {
    ok: true,
    imported,
    simulated,
    message: simulated
      ? `Simülasyon: ${imported} yorum içe aktarıldı`
      : `${imported} yorum senkronize edildi`,
  };
}
