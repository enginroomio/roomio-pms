export type ViewportTier = 'compact' | 'tablet' | 'desktop' | 'wide';

/** Elektra benzeri referans tuval — daha küçük ekranlarda orantılı küçültülür */
export const VIEWPORT_REF = { width: 1440, height: 900 } as const;

export const VIEWPORT_FIT_MIN_SCALE = 0.55;

export type ViewportState = {
  width: number;
  height: number;
  tier: ViewportTier;
  density: 'comfortable' | 'compact';
  orientation: 'portrait' | 'landscape';
  fitScale: number;
  fitActive: boolean;
  canvasWidth: string;
  canvasHeight: string;
};

const TIERS: { max: number; tier: ViewportTier }[] = [
  { max: 720, tier: 'compact' },
  { max: 1100, tier: 'tablet' },
  { max: 1440, tier: 'desktop' },
  { max: Infinity, tier: 'wide' },
];

function computeFit(width: number, height: number) {
  const scaleW = width / VIEWPORT_REF.width;
  const scaleH = height / VIEWPORT_REF.height;
  const raw = Math.min(scaleW, scaleH, 1);
  const fitActive = raw < 0.995;
  const fitScale = fitActive ? Math.max(raw, VIEWPORT_FIT_MIN_SCALE) : 1;

  return {
    fitScale,
    fitActive,
    canvasWidth: fitActive ? `${VIEWPORT_REF.width}px` : '100%',
    canvasHeight: fitActive ? `${VIEWPORT_REF.height}px` : '100%',
  };
}

export function detectViewport(width: number, height: number): ViewportState {
  const tier = TIERS.find((t) => width <= t.max)?.tier ?? 'desktop';
  const density = width < 900 || height < 600 ? 'compact' : 'comfortable';
  const fit = computeFit(width, height);

  return {
    width,
    height,
    tier,
    density,
    orientation: width >= height ? 'landscape' : 'portrait',
    ...fit,
  };
}

export function applyViewportToDocument(state: ViewportState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.viewport = state.tier;
  root.dataset.density = state.density;
  root.dataset.orientation = state.orientation;
  root.dataset.fit = state.fitActive ? '1' : '0';
  root.style.setProperty('--roomio-vw', `${state.width}px`);
  root.style.setProperty('--roomio-vh', `${state.height}px`);
  root.style.setProperty('--roomio-fit-scale', String(state.fitScale));
  root.style.setProperty('--roomio-canvas-w', state.canvasWidth);
  root.style.setProperty('--roomio-canvas-h', state.canvasHeight);
  root.style.setProperty('--roomio-rail-w', state.tier === 'compact' ? '56px' : '68px');
}
