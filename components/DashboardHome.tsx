'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutTemplate } from 'lucide-react';
import { DashboardBoard } from '@/components/DashboardBoard';
import { DailyRoomStatusPanel } from '@/components/dashboard/DailyRoomStatusPanel';
import { PanelQuickNav, PanelHubPanel } from '@/components/panel/PanelHubPanels';
import { DashboardKpiStrip } from '@/components/DashboardKpiStrip';
import { DashboardWelcome } from '@/components/DashboardWelcome';
import { DashboardWeatherChip } from '@/components/dashboard/DashboardWeatherChip';
import { HomeDesignWizard } from '@/components/dashboard/HomeDesignWizard';
import { HomeDraggablePanel } from '@/components/dashboard/HomeDraggablePanel';
import { OperationsAlertStrip } from '@/components/OperationsAlertStrip';
import { QuickActions } from '@/components/QuickActions';
import { PropertyPortfolioStrip } from '@/components/property/PropertyPortfolioStrip';
import { useProperty } from '@/components/property/PropertyProvider';
import { useHomeLayout } from '@/lib/client/use-home-layout';
import { useDashboardSnapshot } from '@/lib/client/use-dashboard-snapshot';
import { visibleHomePanels, type HomePanelId, HOME_PRESETS } from '@/lib/dashboard/home-layout';
import type { DashboardSnapshot } from '@/lib/server/dashboard-data';

type Props = {
  initial: DashboardSnapshot;
};

export function DashboardHome({ initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const view = searchParams.get('view');
  const { activeProperty } = useProperty();
  const { snapshot, loading, propertyId } = useDashboardSnapshot(initial);
  const {
    layout,
    archive,
    defaultTemplateId,
    applyPreset,
    applyTemplate,
    saveAsTemplate,
    removeTemplate,
    pinDefaultTemplate,
    resetToTemplate,
    reorderPanel,
    patchLayout,
    togglePanel,
  } = useHomeLayout();
  const designParam = searchParams.get('design');
  const designFromUrl = designParam === '1' || designParam === 'wizard';
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(() => designFromUrl);
  const [dragKey, setDragKey] = useState<HomePanelId | null>(null);
  const [overKey, setOverKey] = useState<HomePanelId | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (designFromUrl && !wizardDismissed) setWizardOpen(true);
    if (!designFromUrl) {
      setWizardOpen(false);
      setWizardDismissed(false);
    }
  }, [designFromUrl, wizardDismissed]);

  const closeWizard = () => {
    setWizardDismissed(true);
    setWizardOpen(false);
    if (designFromUrl) {
      const qs = new URLSearchParams(searchParams.toString());
      qs.delete('design');
      const next = qs.toString() ? `/?${qs.toString()}` : '/';
      router.replace(next, { scroll: false });
    }
  };

  const panels = useMemo(() => visibleHomePanels(layout), [layout]);

  if (hub === 'panel' && !view) {
    return (
      <>
        <PanelQuickNav active="panel" />
        <PanelHubPanel />
      </>
    );
  }

  if (view === 'daily-status') {
    return (
      <>
        <PanelQuickNav active="daily-status" />
        <DailyRoomStatusPanel snapshot={snapshot} />
      </>
    );
  }

  const dashboardClass = [
    loading ? 'roomio-dashboard--loading' : '',
    `roomio-dashboard--theme-${layout.theme}`,
    layout.rackExpanded ? 'roomio-dashboard--rack-expanded' : '',
    layout.showKpiStrip ? 'roomio-dashboard--show-kpi' : '',
    editMode ? 'roomio-dashboard--edit-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  function onPanelDrop(targetId: HomePanelId) {
    if (dragKey) reorderPanel(dragKey, targetId);
    setDragKey(null);
    setOverKey(null);
  }

  function renderPanel(id: HomePanelId) {
    switch (id) {
      case 'welcome':
        return (
          <DashboardWelcome
              arrivals={snapshot.arrivals.length}
              departures={snapshot.departures.length}
              inHouse={snapshot.inHouse}
              occupancy={snapshot.occupancy}
              cleanVacant={snapshot.cleanVacant}
              dirtyVacant={snapshot.dirtyVacant}
              propertyName={activeProperty?.name}
              totalRooms={activeProperty?.totalRooms ?? snapshot.totalRooms}
              businessDate={snapshot.businessDate}
              compact={layout.presetId === 'orijinal-kompakt'}
          />
        );
      case 'portfolio':
        return <PropertyPortfolioStrip />;
      case 'alerts':
        return (
          <>
            {layout.presetId === 'orijinal-operasyon' ? <DashboardWeatherChip /> : null}
            <OperationsAlertStrip />
          </>
        );
      case 'quickActions':
        return <QuickActions />;
      case 'kpiStrip':
        return (
          <DashboardKpiStrip
            occupancy={snapshot.occupancy}
            arrivals={snapshot.arrivals.length}
            departures={snapshot.departures.length}
            inHouse={snapshot.inHouse}
            totalRooms={activeProperty?.totalRooms ?? snapshot.totalRooms}
          />
        );
      case 'rack':
        return (
          <DashboardBoard
            key={propertyId}
            reservations={snapshot.reservations}
            businessDate={snapshot.businessDate}
            hkMap={snapshot.hkMap}
            arrivals={snapshot.arrivals}
            departures={snapshot.departures}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className={dashboardClass} data-property={activeProperty?.code} data-home-preset={layout.presetId}>
      <PanelQuickNav active="home" />
      <div className="roomio-home-toolbar">
        <button
          type="button"
          className="roomio-btn roomio-btn--secondary roomio-btn--sm roomio-home-toolbar__design"
          onClick={() => setWizardOpen(true)}
        >
          <LayoutTemplate size={14} aria-hidden />
          Ana Ekran Dizayn Sihirbazı
        </button>
        <button
          type="button"
          className={`roomio-btn roomio-btn--ghost roomio-btn--sm${editMode ? ' is-active' : ''}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? 'Düzenlemeyi bitir' : 'Panelleri taşı'}
        </button>
        <span className="roomio-home-toolbar__meta">
          Şablon: <strong>{archive.find((t) => t.layout.presetId === layout.presetId || t.id === layout.presetId)?.name ?? HOME_PRESETS.find((p) => p.id === layout.presetId)?.label ?? (layout.presetId === 'custom' ? 'Özel' : layout.presetId)}</strong>
          {' · '}
          {layout.theme}
        </span>
      </div>

      {panels.map((id) =>
        editMode ? (
          <HomeDraggablePanel
            key={id}
            id={id}
            dragKey={dragKey}
            overKey={overKey}
            onDragStart={setDragKey}
            onDragEnd={() => {
              setDragKey(null);
              setOverKey(null);
            }}
            onDragOver={setOverKey}
            onDrop={onPanelDrop}
            className={id === 'rack' ? 'roomio-home-panel--rack' : undefined}
          >
            {renderPanel(id)}
          </HomeDraggablePanel>
        ) : (
          <div key={id} className={`roomio-home-block roomio-home-block--${id}${id === 'rack' ? ' roomio-home-block--rack' : ''}`}>
            {renderPanel(id)}
          </div>
        ),
      )}

      <HomeDesignWizard
        open={wizardOpen}
        layout={layout}
        archive={archive}
        defaultTemplateId={defaultTemplateId}
        onClose={closeWizard}
        onApplyPreset={applyPreset}
        onApplyTemplate={applyTemplate}
        onResetTemplate={resetToTemplate}
        onPatch={patchLayout}
        onTogglePanel={togglePanel}
        onSaveTemplate={saveAsTemplate}
        onDeleteTemplate={removeTemplate}
        onPinDefault={pinDefaultTemplate}
      />
    </div>
  );
}
