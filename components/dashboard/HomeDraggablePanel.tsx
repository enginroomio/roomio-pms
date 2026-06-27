'use client';

import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import type { HomePanelId } from '@/lib/dashboard/home-layout';
import { HOME_PANEL_LABELS } from '@/lib/dashboard/home-layout';

type Props = {
  id: HomePanelId;
  dragKey: HomePanelId | null;
  overKey: HomePanelId | null;
  onDragStart: (id: HomePanelId) => void;
  onDragEnd: () => void;
  onDragOver: (id: HomePanelId) => void;
  onDrop: (id: HomePanelId) => void;
  children: ReactNode;
  className?: string;
};

export function HomeDraggablePanel({
  id,
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
      className={`roomio-home-panel${className ? ` ${className}` : ''} roomio-home-panel--${id}${overKey === id ? ' is-drop-target' : ''}${dragKey === id ? ' is-dragging' : ''}`}
      data-home-panel={id}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(id);
      }}
    >
      <div
        className="roomio-home-panel__handle"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id);
          onDragStart(id);
        }}
        onDragEnd={onDragEnd}
        title={`${HOME_PANEL_LABELS[id]} — sürükleyerek taşı`}
        aria-label={`${HOME_PANEL_LABELS[id]} konumunu değiştir`}
      >
        <GripVertical size={14} aria-hidden />
        <span>{HOME_PANEL_LABELS[id]}</span>
      </div>
      <div className="roomio-home-panel__body">{children}</div>
    </section>
  );
}
