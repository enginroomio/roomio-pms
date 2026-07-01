'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { HomeScreenMenuContext } from '@/components/HomeScreenMenuContext';
import {
  ElektraMainContextMenu,
  type MainContextMenuState,
} from '@/components/navigation/ElektraMainContextMenu';
import { HK_CONTEXT_MENU_IGNORE } from '@/lib/navigation/context-menu-scope';

const IGNORE_SELECTOR = [
  '.roomio-ctx-menu',
  '.roomio-ctx-backdrop',
  '.roomio-hk-room-menu',
  '.roomio-rack-ctx-menu',
  '.roomio-rack-ctx-backdrop',
  '.roomio-top-menu',
  '.roomio-nr-cell',
  HK_CONTEXT_MENU_IGNORE,
  'input',
  'textarea',
  '[contenteditable="true"]',
].join(', ');

type Props = {
  children: ReactNode;
};

/** Uygulama geneli sağ tık: Elektra ana menü (üst çubuktan açılır) */
export function AppContextMenuLayer({ children }: Props) {
  const pathname = usePathname();
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
        <ElektraMainContextMenu
          menu={menu}
          pathname={pathname}
          onClose={() => setMenu(null)}
        />
      </div>
    </HomeScreenMenuContext.Provider>
  );
}
