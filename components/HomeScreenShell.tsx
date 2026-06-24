'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { HomeScreenMenuContext } from '@/components/HomeScreenMenuContext';
import {
  ElektraMainContextMenu,
  type MainContextMenuState,
} from '@/components/navigation/ElektraMainContextMenu';

type Props = {
  children: ReactNode;
};

/** Ana sayfa — sağ tık: Elektra v5 tam menü (tarayıcı menüsü engellenir) */
export function HomeScreenShell({ children }: Props) {
  const [menu, setMenu] = useState<MainContextMenuState>(null);

  const openMainMenu = useCallback((x: number, y: number) => {
    setMenu({ x, y });
  }, []);

  const menuApi = useMemo(() => ({ openMainMenu }), [openMainMenu]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          '.roomio-ctx-menu, .roomio-ctx-backdrop, .roomio-hk-room-menu, .roomio-rack-ctx-menu, .roomio-rack-ctx-backdrop, input, textarea, [contenteditable="true"]',
        )
      ) {
        return;
      }
      event.preventDefault();
      openMainMenu(event.clientX, event.clientY);
    },
    [openMainMenu],
  );

  return (
    <HomeScreenMenuContext.Provider value={menuApi}>
      <div className="roomio-home-screen" onContextMenu={onContextMenu}>
        {children}
        <ElektraMainContextMenu menu={menu} onClose={() => setMenu(null)} />
      </div>
    </HomeScreenMenuContext.Provider>
  );
}
