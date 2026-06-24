/** Tema ekranı — rollout adımları + mockup önizleme eşlemesi */

import { ROLLOUT_PHASES } from '@/lib/navigation/rollout-phases';

export type ShowcasePreviewKind =
  | 'elektra-f1'
  | 'filter-wizard'
  | 'elektra-v5'
  | 'calendar-heatmap'
  | 'forecast-analytics'
  | 'hk-ops'
  | 'hk-assign';

export type ShowcaseScreen = {
  id: string;
  phaseId: string;
  label: string;
  href: string;
  screenRef?: string;
  /** Canlı React mockup bileşeni */
  preview?: ShowcasePreviewKind;
  /** PNG referans görseli */
  mockupImage?: string;
};

const MOCKUP_IMAGES: Record<string, string> = {
  shell: '/mockups/roomio-ana-ekran-mockup.png',
  home: '/mockups/roomio-ana-ekran-mockup.png',
  sistem: '/mockups/pms-professional-ui-kit.png',
  rezervasyon: '/mockups/roomio-alt-5-ust-menu-elektra-modern.png',
  resepsiyon: '/mockups/roomio-ana-sayfa-arda-v5-white-menu.png',
  onkasa: '/mockups/roomio-alt-2-executive-light.png',
  kat: '/mockups/roomio-alt-3-saha-kompakt.png',
  misafir: '/mockups/roomio-alt-4-kart-tabanli.png',
  raporlar: '/mockups/alternatif2-sapphire-executive.png',
  gunsonu: '/mockups/alternatif2-sapphire-dashboard.png',
};

const STEP_PREVIEWS: Record<string, { preview?: ShowcasePreviewKind; mockupImage?: string }> = {
  'rez-grafik': { preview: 'elektra-f1' },
  'hk-hub': { preview: 'hk-ops' },
  'hk-rooms': { preview: 'hk-assign' },
  'home-welcome': { mockupImage: MOCKUP_IMAGES.home },
  'home-rack': { mockupImage: '/mockups/roomio-alt-1-operasyon-merkezi.png' },
  'sys-kurulus': { mockupImage: MOCKUP_IMAGES.sistem },
  'rez-new': { mockupImage: MOCKUP_IMAGES.rezervasyon },
  'rez-list': { mockupImage: MOCKUP_IMAGES.rezervasyon },
  'rec-hub': { mockupImage: MOCKUP_IMAGES.resepsiyon },
  'cash-hub': { mockupImage: MOCKUP_IMAGES.onkasa },
  'gr-hub': { mockupImage: MOCKUP_IMAGES.misafir },
  'rpt-hub': { mockupImage: MOCKUP_IMAGES.raporlar },
  'eod-close': { mockupImage: MOCKUP_IMAGES.gunsonu },
};

function phaseFallbackImage(phaseId: string): string {
  return MOCKUP_IMAGES[phaseId] ?? '/mockups/roomio-ana-ekran-mockup.png';
}

export function buildShowcaseScreens(): ShowcaseScreen[] {
  return ROLLOUT_PHASES.flatMap((phase) =>
    phase.steps.map((step) => {
      const extra = STEP_PREVIEWS[step.id] ?? {};
      return {
        id: step.id,
        phaseId: phase.id,
        label: step.label,
        href: step.href,
        screenRef: step.screenRef,
        preview: extra.preview,
        mockupImage: extra.mockupImage ?? phaseFallbackImage(phase.id),
      };
    }),
  );
}

export const SHOWCASE_PHASES = ROLLOUT_PHASES.map((p) => ({
  id: p.id,
  order: p.order,
  title: p.title,
}));
