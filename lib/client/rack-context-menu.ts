import type { RackCell } from '@/lib/types/room';
import type { HomeScreenMenuApi } from '@/components/HomeScreenMenuContext';

type RackContextHandlers = {
  homeMenu: HomeScreenMenuApi | null;
  hkInteractive?: boolean;
  onRoomContextMenu?: (roomNo: string, event: React.MouseEvent) => void;
  onRoomPmsContextMenu?: (cell: RackCell, event: React.MouseEvent) => void;
};

/** Ana sayfa rack: sağ tık oda menüsü · Ctrl+ana menü · Shift+HK */
export function handleRackCellContextMenu(
  event: React.MouseEvent,
  cell: RackCell,
  { homeMenu, hkInteractive, onRoomContextMenu, onRoomPmsContextMenu }: RackContextHandlers,
) {
  event.preventDefault();
  event.stopPropagation();

  const mod = event.ctrlKey || event.metaKey;

  if (onRoomContextMenu && event.shiftKey) {
    onRoomContextMenu(cell.room.roomNo, event);
    return;
  }

  if (homeMenu && mod) {
    homeMenu.openMainMenu(event.clientX, event.clientY);
    return;
  }

  if (onRoomPmsContextMenu) {
    onRoomPmsContextMenu(cell, event);
    return;
  }

  if (onRoomContextMenu && hkInteractive) {
    onRoomContextMenu(cell.room.roomNo, event);
  }
}

export function rackContextMenuHint(homeMenu: boolean, hkInteractive?: boolean): string {
  if (homeMenu) {
    return ' · Sağ tık: oda · Ctrl+sağ tık: menü · Shift+sağ tık: HK';
  }
  if (hkInteractive) return ' · Sağ tık: oda işlemleri · Shift+sağ tık: HK';
  return ' · Sağ tık: oda işlemleri';
}
