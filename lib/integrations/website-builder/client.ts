import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { loadBookingEngineConfig } from '@/lib/booking-engine/client';
import { DEFAULT_WEBSITE_BUILDER_CONFIG, type WebsiteBuilderConfig } from '@/lib/integrations/website-builder/types';

const FILE = 'website-builder-config.json';

export async function loadWebsiteBuilderConfig(): Promise<WebsiteBuilderConfig> {
  return loadJsonConfig(FILE, DEFAULT_WEBSITE_BUILDER_CONFIG);
}

export async function saveWebsiteBuilderConfig(config: WebsiteBuilderConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicWebsitePreview() {
  const config = await loadWebsiteBuilderConfig();
  const booking = await loadBookingEngineConfig();
  return {
    ok: config.enabled,
    siteName: config.siteName,
    domain: config.domain,
    template: config.template,
    primaryColor: config.primaryColor,
    languages: config.languages,
    sections: {
      booking: config.showBookingEngine && booking.enabled,
      gallery: config.showGallery,
      spa: config.showSpa,
    },
    bookingUrl: '/book',
  };
}
