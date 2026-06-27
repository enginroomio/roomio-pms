'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { HomeScreenMenuContext } from '@/components/HomeScreenMenuContext';
import {
  ElektraMainContextMenu,
  type MainContextMenuState,
} from '@/components/navigation/ElektraMainContextMenu';

const IGNORE_SELECTOR =
  '.roomio-ctx-menu, .roomio-ctx-backdrop, .roomio-hk-room-menu, .roomio-rack-ctx-menu, .roomio-rack-ctx-backdrop, .roomio-top-menu, input, textarea, [contenteditable="true"]';

type Props = {
  children: ReactNode;
};

/** Uygulama geneli sağ tık: Elektra ana menü (üst çubuktan açılır) */
export function AppContextMenuLayer({ children }: Props) {
  const [menu, setMenu] = useState<MainContextMenuState>(null);

  const openMainMenu = useCallback((x: number, y: number) => {
    setMenu({ x, y });
  }, []);

  const menuApi = useMemo(() => ({ openMainMenu }), [openMainMenu]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(IGNORE_SELECTOR)) return;
      event.preventDefault();
      openMainMenu(event.clientX, event.clientY);
    },
    [openMainMenu],
  );

  return (
    <HomeScreenMenuContext.Provider value={menuApi}>
      <div className="roomio-app-screen" onContextMenu={onContextMenu}>
        {children}
        <ElektraMainContextMenu menu={menu} onClose={() => setMenu(null)} />
      </div>
    </HomeScreenMenuContext.Provider>
  );
}
