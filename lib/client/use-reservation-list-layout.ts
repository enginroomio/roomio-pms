'use client';

import { useCallback, useEffect, useState } from 'react';
import { moveRezListColumn, reorderRezListColumn, resizeRezListColumn, type RezListColumnId } from '@/lib/reservations/list-columns';
import {
  addRezListTemplate,
  deleteRezListTemplate,
  findRezListTemplate,
  getDefaultTemplateId,
  loadRezListArchive,
  setDefaultTemplateId,
  type RezListUserTemplate,
} from '@/lib/reservations/list-templates';
import {
  applyRezListLayoutSnapshot,
  applyRezListPreset,
  loadRezListLayout,
  normalizeColumnWidths,
  normalizeRezListLayout,
  saveRezListLayout,
  type RezListLayout,
  type RezListPresetId,
} from '@/lib/reservations/list-layout';

export function useReservationListLayout() {
  const [layout, setLayout] = useState<RezListLayout>(() => loadRezListLayout());
  const [archive, setArchive] = useState<RezListUserTemplate[]>([]);
  const [defaultTemplateId, setDefaultTemplateIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshArchive = useCallback(() => {
    setArchive(loadRezListArchive());
    setDefaultTemplateIdState(getDefaultTemplateId());
  }, []);

  useEffect(() => {
    const saved = loadRezListLayout();
    const defaultId = getDefaultTemplateId();
    if (defaultId) {
      const tpl = findRezListTemplate(defaultId);
      if (tpl) {
        setLayout(applyRezListLayoutSnapshot(tpl.layout, tpl.id));
        saveRezListLayout(tpl.layout);
      } else {
        setLayout(saved);
      }
    } else {
      setLayout(saved);
    }
    refreshArchive();
    setReady(true);
  }, [refreshArchive]);

  const persist = useCallback(
    (next: RezListLayout) => {
      const normalized = normalizeRezListLayout(next);
      setLayout(normalized);
      saveRezListLayout(normalized);
    },
    [],
  );

  const applyPreset = useCallback(
    (presetId: RezListPresetId) => {
      persist(applyRezListPreset(presetId));
    },
    [persist],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = findRezListTemplate(templateId);
      if (!tpl) return;
      persist(applyRezListLayoutSnapshot(tpl.layout, tpl.id));
    },
    [persist],
  );

  const saveAsTemplate = useCallback(
    (name: string, description?: string) => {
      const entry = addRezListTemplate(name, layout, description);
      persist({ ...layout, presetId: entry.id });
      refreshArchive();
      return entry;
    },
    [layout, persist, refreshArchive],
  );

  const removeTemplate = useCallback(
    (templateId: string) => {
      deleteRezListTemplate(templateId);
      refreshArchive();
    },
    [refreshArchive],
  );

  const pinDefaultTemplate = useCallback(
    (templateId: string | null) => {
      setDefaultTemplateId(templateId);
      setDefaultTemplateIdState(templateId);
      if (templateId) {
        const tpl = findRezListTemplate(templateId);
        if (tpl) persist(applyRezListLayoutSnapshot(tpl.layout, tpl.id));
      }
    },
    [persist],
  );

  const patchLayout = useCallback(
    (patch: Partial<RezListLayout>) => {
      persist({ ...layout, ...patch, presetId: 'custom' });
    },
    [layout, persist],
  );

  const moveColumn = useCallback(
    (columnId: RezListColumnId, direction: 'up' | 'down') => {
      persist({
        ...layout,
        presetId: 'custom',
        columnOrder: moveRezListColumn(layout.columnOrder, columnId, direction),
      });
    },
    [layout, persist],
  );

  const reorderColumn = useCallback(
    (fromId: RezListColumnId, toId: RezListColumnId) => {
      persist({
        ...layout,
        presetId: 'custom',
        columnOrder: reorderRezListColumn(layout.columnOrder, fromId, toId),
      });
    },
    [layout, persist],
  );

  const resizeColumn = useCallback(
    (columnId: RezListColumnId, width: number) => {
      persist({
        ...layout,
        presetId: 'custom',
        columnWidths: resizeRezListColumn(layout.columnWidths, columnId, width),
      });
    },
    [layout, persist],
  );

  const resetColumnWidths = useCallback(() => {
    persist({
      ...layout,
      presetId: 'custom',
      columnWidths: normalizeColumnWidths(),
    });
  }, [layout, persist]);

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
    patchLayout,
    moveColumn,
    reorderColumn,
    resizeColumn,
    resetColumnWidths,
    setLayout: persist,
    refreshArchive,
  };
}
