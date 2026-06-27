'use client';

import { useCallback, useRef, useState } from 'react';
import {
  getColumnWidth,
  REZ_LIST_COLUMN_LABELS,
  type RezListColumnId,
} from '@/lib/reservations/list-columns';

type Props = {
  columnOrder: RezListColumnId[];
  columnWidths: Record<RezListColumnId, number>;
  onReorder: (fromId: RezListColumnId, toId: RezListColumnId) => void;
  onResizeEnd: (columnId: RezListColumnId, width: number) => void;
  onResizePreview?: (columnId: RezListColumnId, width: number) => void;
  onResizeCancel?: () => void;
};

export function ReservationListTableHeader({
  columnOrder,
  columnWidths,
  onReorder,
  onResizeEnd,
  onResizePreview,
  onResizeCancel,
}: Props) {
  const [dragColumn, setDragColumn] = useState<RezListColumnId | null>(null);
  const [dropColumn, setDropColumn] = useState<RezListColumnId | null>(null);
  const resizeRef = useRef<{ columnId: RezListColumnId; startX: number; startWidth: number } | null>(null);

  const startResize = useCallback(
    (columnId: RezListColumnId, clientX: number) => {
      resizeRef.current = {
        columnId,
        startX: clientX,
        startWidth: getColumnWidth(columnWidths, columnId),
      };

      function onMove(ev: MouseEvent) {
        const state = resizeRef.current;
        if (!state) return;
        const width = state.startWidth + (ev.clientX - state.startX);
        onResizePreview?.(state.columnId, width);
      }

      function onUp(ev: MouseEvent) {
        const state = resizeRef.current;
        if (state) {
          const width = state.startWidth + (ev.clientX - state.startX);
          onResizeEnd(state.columnId, width);
        } else {
          onResizeCancel?.();
        }
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.classList.remove('roomio-rez-col-resizing');
      }

      document.body.classList.add('roomio-rez-col-resizing');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [columnWidths, onResizeCancel, onResizeEnd, onResizePreview],
  );

  return (
    <thead>
      <tr>
        {columnOrder.map((columnId) => {
          const width = getColumnWidth(columnWidths, columnId);
          const isDragging = dragColumn === columnId;
          const isDropTarget = dropColumn === columnId && dragColumn && dragColumn !== columnId;

          return (
            <th
              key={columnId}
              className={`roomio-rez-col-head${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
              style={{ width, minWidth: width, maxWidth: width }}
              draggable
              onDragStart={(e) => {
                setDragColumn(columnId);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', columnId);
              }}
              onDragEnd={() => {
                setDragColumn(null);
                setDropColumn(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDropColumn(columnId);
              }}
              onDragLeave={() => {
                setDropColumn((prev) => (prev === columnId ? null : prev));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData('text/plain') as RezListColumnId;
                if (fromId && fromId !== columnId) onReorder(fromId, columnId);
                setDragColumn(null);
                setDropColumn(null);
              }}
            >
              <span className="roomio-rez-col-head__label" title="Sürükleyerek sırayı değiştirin">
                {REZ_LIST_COLUMN_LABELS[columnId]}
              </span>
              <span
                className="roomio-rez-col-head__resizer"
                role="separator"
                aria-orientation="vertical"
                aria-label={`${REZ_LIST_COLUMN_LABELS[columnId]} genişliği`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startResize(columnId, e.clientX);
                }}
              />
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
