'use client';

import dynamic from 'next/dynamic';
import type { ShowcasePreviewKind } from '@/lib/theme/screen-showcase';

const loading = () => (
  <div className="roomio-theme-screen__preview-loading">Mockup yükleniyor…</div>
);

const ElektraForecastF1Mockup = dynamic(
  () =>
    import('@/components/reservations/graphic/mockups/ElektraForecastF1Mockup').then(
      (m) => m.ElektraForecastF1Mockup,
    ),
  { ssr: false, loading },
);

const FilterWizardProMockup = dynamic(
  () =>
    import('@/components/reservations/graphic/mockups/FilterWizardProMockup').then(
      (m) => m.FilterWizardProMockup,
    ),
  { ssr: false, loading },
);

const ElektraV5Mockup = dynamic(
  () =>
    import('@/components/reservations/graphic/mockups/ElektraV5Mockup').then(
      (m) => m.ElektraV5Mockup,
    ),
  { ssr: false, loading },
);

const CalendarHeatmapMockup = dynamic(
  () =>
    import('@/components/reservations/graphic/mockups/CalendarHeatmapMockup').then(
      (m) => m.CalendarHeatmapMockup,
    ),
  { ssr: false, loading },
);

const ForecastAnalyticsMockup = dynamic(
  () =>
    import('@/components/reservations/graphic/mockups/ForecastAnalyticsMockup').then(
      (m) => m.ForecastAnalyticsMockup,
    ),
  { ssr: false, loading },
);

const HkOperationsHubMockup = dynamic(
  () =>
    import('@/components/housekeeping/mockups/HkOperationsHubMockup').then(
      (m) => m.HkOperationsHubMockup,
    ),
  { ssr: false, loading },
);

const HkAssignProMockup = dynamic(
  () =>
    import('@/components/housekeeping/mockups/HkAssignProMockup').then(
      (m) => m.HkAssignProMockup,
    ),
  { ssr: false, loading },
);

export function ThemeMockupPreview({ kind }: { kind: ShowcasePreviewKind }) {
  switch (kind) {
    case 'elektra-f1':
      return <ElektraForecastF1Mockup />;
    case 'filter-wizard':
      return <FilterWizardProMockup />;
    case 'elektra-v5':
      return <ElektraV5Mockup />;
    case 'calendar-heatmap':
      return <CalendarHeatmapMockup />;
    case 'forecast-analytics':
      return <ForecastAnalyticsMockup />;
    case 'hk-ops':
      return <HkOperationsHubMockup />;
    case 'hk-assign':
      return <HkAssignProMockup />;
    default:
      return null;
  }
}
