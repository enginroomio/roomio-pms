'use client';

import { ElektraForecastF1Mockup } from './mockups/ElektraForecastF1Mockup';
import { FilterWizardProMockup } from './mockups/FilterWizardProMockup';
import { CalendarHeatmapMockup } from './mockups/CalendarHeatmapMockup';
import { ElektraV5Mockup } from './mockups/ElektraV5Mockup';
import { ForecastAnalyticsMockup } from './mockups/ForecastAnalyticsMockup';
import { MonthlyProGraphicsMockup } from './mockups/MonthlyProGraphicsMockup';

export type GraphicDesignMode = 'live' | 'monthly-pro' | 'filter-wizard' | 'elektra' | 'calendar' | 'forecast';

const MODES: { id: GraphicDesignMode; label: string; hint: string }[] = [
  { id: 'monthly-pro', label: 'Elektra Forecast F1', hint: 'Forecast · canlı API' },
  { id: 'filter-wizard', label: 'Filtre Sihirbazı', hint: 'Canlı filtre + API' },
  { id: 'live', label: 'Canlı', hint: 'Gerçek veri' },
  { id: 'elektra', label: 'Alt 1 · Elektra v5', hint: 'Canlı doluluk grafikleri' },
  { id: 'calendar', label: 'Alt 2 · Takvim F1', hint: 'Canlı doluluk + gelir' },
  { id: 'forecast', label: 'Alt 3 · Forecast', hint: 'Canlı analiz + tablo' },
];

type Props = {
  mode: GraphicDesignMode;
  onChange: (mode: GraphicDesignMode) => void;
};

export function GraphicDesignPicker({ mode, onChange }: Props) {
  return (
    <div className="roomio-grafik-design-picker" role="tablist" aria-label="Grafik mockup alternatifleri">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          className={`roomio-grafik-design-picker__btn${mode === m.id ? ' is-active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          <strong>{m.label}</strong>
          <span>{m.hint}</span>
        </button>
      ))}
    </div>
  );
}

type MockupProps = {
  mode: GraphicDesignMode;
};

export function GraphicMockupView({ mode }: MockupProps) {
  if (mode === 'monthly-pro') return <ElektraForecastF1Mockup />;
  if (mode === 'filter-wizard') return <FilterWizardProMockup />;
  if (mode === 'elektra') return <ElektraV5Mockup />;
  if (mode === 'calendar') return <CalendarHeatmapMockup />;
  if (mode === 'forecast') return <ForecastAnalyticsMockup />;
  return null;
}
