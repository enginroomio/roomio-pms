'use client';

import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RezListPanelId } from '@/lib/reservations/list-layout';
import { REZ_LIST_PANEL_LABELS } from '@/lib/reservations/list-layout';

type Props = {
  id: RezListPanelId;
  zone: 'aboveTable' | 'belowTable';
  dragEnabled?: boolean;
  dragKey: RezListPanelId | null;
  overKey: RezListPanelId | null;
  onDragStart: (id: RezListPanelId) => void;
  onDragEnd: () => void;
  onDragOver: (id: RezListPanelId) => void;
  onDrop: (id: RezListPanelId) => void;
  children: ReactNode;
  className?: string;
};

export function ReservationListDraggablePanel({
  id,
  zone,
  dragEnabled = true,
  dragKey,
  overKey,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  children,
  className,
}: Props) {
  return (
    <section
      className={`roomio-rez-layout-panel${className ? ` ${className}` : ''}${overKey === id ? ' is-drop-target' : ''}${dragKey === id ? ' is-dragging' : ''}`}
      data-rez-panel={id}
      data-rez-zone={zone}
      onDragOver={(e) => {
        if (!dragEnabled) return;
        e.preventDefault();
        onDragOver(id);
      }}
      onDrop={(e) => {
        if (!dragEnabled) return;
        e.preventDefault();
        onDrop(id);
      }}
    >
      {dragEnabled ? (
        <div
          className="roomio-rez-layout-panel__handle"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', id);
            onDragStart(id);
          }}
          onDragEnd={onDragEnd}
          title={`${REZ_LIST_PANEL_LABELS[id]} — sürükleyerek taşı`}
          aria-label={`${REZ_LIST_PANEL_LABELS[id]} konumunu değiştir`}
        >
          <GripVertical size={14} aria-hidden />
          <span>{REZ_LIST_PANEL_LABELS[id]}</span>
        </div>
      ) : null}
      <div className="roomio-rez-layout-panel__body">{children}</div>
    </section>
  );
}
