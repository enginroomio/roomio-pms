import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyHomeLayoutSnapshot,
  applyHomePreset,
  DEFAULT_HOME_LAYOUT,
  HOME_PRESETS,
  normalizeHomeLayout,
  shouldMigrateToOrijinalLayout,
} from './home-layout';
import { BUILTIN_HOME_ARCHIVE, getBuiltinTemplateIdByPreset } from './home-templates';

describe('DEFAULT_HOME_LAYOUT', () => {
  it('uses orijinal operasyon preset', () => {
    assert.equal(DEFAULT_HOME_LAYOUT.presetId, 'orijinal-operasyon');
    assert.equal(DEFAULT_HOME_LAYOUT.theme, 'orijinal');
    assert.deepEqual(DEFAULT_HOME_LAYOUT.hiddenPanels, ['portfolio', 'kpiStrip']);
  });
});

describe('orijinal presets', () => {
  it('registers three variants in HOME_PRESETS', () => {
    const ids = HOME_PRESETS.filter((p) => p.id.startsWith('orijinal-')).map((p) => p.id);
    assert.deepEqual(ids, ['orijinal-operasyon', 'orijinal-kompakt', 'orijinal-klasik']);
  });

  it('klasik hides alerts panel', () => {
    const klasik = applyHomePreset('orijinal-klasik');
    assert.ok(klasik.hiddenPanels.includes('alerts'));
    assert.equal(klasik.theme, 'orijinal');
  });

  it('operasyon and kompakt keep alerts visible', () => {
    for (const id of ['orijinal-operasyon', 'orijinal-kompakt'] as const) {
      const layout = applyHomePreset(id);
      assert.ok(!layout.hiddenPanels.includes('alerts'));
    }
  });
});

describe('applyHomeLayoutSnapshot', () => {
  it('keeps known preset id when applying builtin archive template', () => {
    const layout = normalizeHomeLayout({
      presetId: 'orijinal-operasyon',
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    });
    const applied = applyHomeLayoutSnapshot(layout, 'builtin-10');
    assert.equal(applied.presetId, 'orijinal-operasyon');
  });

  it('falls back to template id for legacy builtin entries', () => {
    const layout = normalizeHomeLayout({
      presetId: 'builtin-reception',
      panelOrder: DEFAULT_HOME_LAYOUT.panelOrder,
      hiddenPanels: ['portfolio'],
      theme: 'elektra',
      rackExpanded: true,
      showKpiStrip: false,
    });
    const applied = applyHomeLayoutSnapshot(layout, 'builtin-6');
    assert.equal(applied.presetId, 'builtin-6');
  });
});

describe('shouldMigrateToOrijinalLayout', () => {
  it('migrates missing or legacy ana-ekran modern layout', () => {
    assert.equal(shouldMigrateToOrijinalLayout(null), true);
    assert.equal(shouldMigrateToOrijinalLayout({ presetId: 'ana-ekran', theme: 'modern' }), true);
  });

  it('keeps customized presets', () => {
    assert.equal(shouldMigrateToOrijinalLayout({ presetId: 'modern-glass', theme: 'glass' }), false);
    assert.equal(shouldMigrateToOrijinalLayout({ presetId: 'orijinal-klasik', theme: 'orijinal' }), false);
  });
});

describe('BUILTIN_HOME_ARCHIVE orijinal', () => {
  it('includes three orijinal templates', () => {
    const names = BUILTIN_HOME_ARCHIVE.filter((t) => t.name.startsWith('Orijinal')).map((t) => t.name);
    assert.equal(names.length, 3);
    assert.ok(names.includes('Orijinal · Operasyon Paneli'));
  });

  it('resolves builtin id by preset', () => {
    const id = getBuiltinTemplateIdByPreset('orijinal-operasyon');
    assert.match(id ?? '', /^builtin-\d+$/);
    const idx = Number(id!.replace('builtin-', ''));
    assert.equal(BUILTIN_HOME_ARCHIVE[idx]?.name, 'Orijinal · Operasyon Paneli');
  });
});
