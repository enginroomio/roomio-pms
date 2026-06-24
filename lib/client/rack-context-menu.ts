import type { RackCell } from '@/lib/types/room';
import type { HomeScreenMenuApi } from '@/components/HomeScreenMenuContext';

type RackContextHandlers = {
  homeMenu: HomeScreenMenuApi | null;
  hkInteractive?: boolean;
  onRoomContextMenu?: (roomNo: string, event: React.MouseEvent) => void;
  onRoomPmsContextMenu?: (cell: RackCell, event: React.MouseEvent) => void;
};

/** Ana sayfa: sağ tık menü · Ctrl+oda işlemleri · Shift+HK. /rooms: sağ tık oda işlemleri */
export function handleRackCellContextMenu(
  event: React.MouseEvent,
  cell: RackCell,
  { homeMenu, hkInteractive, onRoomContextMenu, onRoomPmsContextMenu }: RackContextHandlers,
) {
  event.preventDefault();
  event.stopPropagation();

  const mod = event.ctrlKey || event.metaKey;

  if (homeMenu && !event.shiftKey && !mod) {
    homeMenu.openMainMenu(event.clientX, event.clientY);
    return;
  }

  if (onRoomPmsContextMenu && (mod || !homeMenu)) {
    onRoomPmsContextMenu(cell, event);
    return;
  }

  if (onRoomContextMenu && event.shiftKey) {
    onRoomContextMenu(cell.room.roomNo, event);
    return;
  }

  if (!homeMenu && hkInteractive && onRoomContextMenu) {
    onRoomContextMenu(cell.room.roomNo, event);
  }
}

export function rackContextMenuHint(homeMenu: boolean, hkInteractive?: boolean): string {
  if (homeMenu) {
    return ' · Sağ tık: menü · Ctrl+sağ tık: oda · Shift+sağ tık: HK';
  }
  if (hkInteractive) return ' · Sağ tık: oda işlemleri · Shift+sağ tık: HK';
  return ' · Sağ tık: oda işlemleri';
}
