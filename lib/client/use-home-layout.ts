'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyHomeLayoutSnapshot,
  applyHomePreset,
  loadHomeLayout,
  normalizeHomeLayout,
  reorderHomePanel,
  resetHomeLayoutToTemplate,
  saveHomeLayout,
  type HomeLayout,
  type HomePanelId,
  type HomePresetId,
} from '@/lib/dashboard/home-layout';
import {
  addHomeTemplate,
  deleteHomeTemplate,
  findHomeTemplate,
  getDefaultHomeTemplateId,
  loadHomeArchive,
  migrateHomeLayoutForOrijinalDefault,
  setDefaultHomeTemplateId,
  type HomeUserTemplate,
} from '@/lib/dashboard/home-templates';

export function useHomeLayout() {
  const [layout, setLayout] = useState<HomeLayout>(() => migrateHomeLayoutForOrijinalDefault());
  const [archive, setArchive] = useState<HomeUserTemplate[]>(() =>
    typeof window !== 'undefined' ? loadHomeArchive() : [],
  );
  const [defaultTemplateId, setDefaultTemplateIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshArchive = useCallback(() => {
    setArchive(loadHomeArchive());
    setDefaultTemplateIdState(getDefaultHomeTemplateId());
  }, []);

  useEffect(() => {
    const saved = migrateHomeLayoutForOrijinalDefault();
    const defaultId = getDefaultHomeTemplateId();
    if (defaultId) {
      const tpl = findHomeTemplate(defaultId);
      if (tpl) {
        const applied = applyHomeLayoutSnapshot(tpl.layout, tpl.id);
        setLayout(applied);
        saveHomeLayout(applied);
      } else {
        setLayout(saved);
      }
    } else {
      setLayout(saved);
    }
    refreshArchive();
    setReady(true);
  }, [refreshArchive]);

  const persist = useCallback((next: HomeLayout) => {
    const normalized = normalizeHomeLayout(next);
    setLayout(normalized);
    saveHomeLayout(normalized);
  }, []);

  const applyPreset = useCallback(
    (presetId: HomePresetId) => {
      persist(applyHomePreset(presetId));
    },
    [persist],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = findHomeTemplate(templateId);
      if (!tpl) return;
      persist(applyHomeLayoutSnapshot(tpl.layout, tpl.id));
    },
    [persist],
  );

  const saveAsTemplate = useCallback(
    (name: string, description?: string) => {
      const entry = addHomeTemplate(name, layout, description);
      persist({ ...layout, presetId: entry.id });
      refreshArchive();
      return entry;
    },
    [layout, persist, refreshArchive],
  );

  const removeTemplate = useCallback(
    (templateId: string) => {
      deleteHomeTemplate(templateId);
      refreshArchive();
    },
    [refreshArchive],
  );

  const pinDefaultTemplate = useCallback(
    (templateId: string | null) => {
      setDefaultHomeTemplateId(templateId);
      setDefaultTemplateIdState(templateId);
      if (templateId) {
        const tpl = findHomeTemplate(templateId);
        if (tpl) persist(applyHomeLayoutSnapshot(tpl.layout, tpl.id));
      }
    },
    [persist],
  );

  const resetToTemplate = useCallback(() => {
    persist(resetHomeLayoutToTemplate());
  }, [persist]);

  const reorderPanel = useCallback((fromId: HomePanelId, toId: HomePanelId) => {
    setLayout((prev) => {
      const next = reorderHomePanel(prev, fromId, toId);
      saveHomeLayout(next);
      return next;
    });
  }, []);

  const patchLayout = useCallback(
    (patch: Partial<HomeLayout>) => {
      persist({ ...layout, ...patch, presetId: 'custom' });
    },
    [layout, persist],
  );

  const togglePanel = useCallback(
    (panelId: HomePanelId, visible: boolean) => {
      const hidden = new Set(layout.hiddenPanels);
      if (visible) hidden.delete(panelId);
      else hidden.add(panelId);
      patchLayout({ hiddenPanels: [...hidden] });
    },
    [layout.hiddenPanels, patchLayout],
  );

  return {
    layout,
    archive,
    defaultTemplateId,
    ready,
    applyPreset,
    applyTemplate,
    saveAsTemplate,
    removeTemplate,
    pinDefaultTemplate,
    resetToTemplate,
    reorderPanel,
    patchLayout,
    togglePanel,
    setLayout: persist,
    refreshArchive,
  };
}
