'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ICON_RAIL } from '@/lib/navigation/top-menu-nav';
import { GR_SHORTCUTS } from '@/lib/navigation/guest-relations-nav';
import { readUserShortcuts, shortcutKeyMap } from '@/lib/shortcuts/user-shortcuts';
import { quickActionKeyMap } from '@/lib/shortcuts/quick-actions';

export function useRoomioShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      const combo = parts.join('+');

      if (combo === 'ctrl+k') {
        e.preventDefault();
        window.dispatchEvent(new Event('roomio-open-cmd'));
        return;
      }

      if (combo === 'f1') {
        e.preventDefault();
        router.push('/reservations/calendar');
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const slot = Number.parseInt(e.key, 10);
        if (slot >= 1 && slot <= ICON_RAIL.length) {
          e.preventDefault();
          router.push(ICON_RAIL[slot - 1]!.href);
          return;
        }
      }

      const onHome = window.location.pathname === '/';
      const quickMap = onHome ? quickActionKeyMap() : {};
      const userMap = shortcutKeyMap();
      const grMap = GR_SHORTCUTS as Record<string, string>;
      const href = quickMap[combo] ?? userMap[combo] ?? grMap[combo];
      if (href) {
        e.preventDefault();
        router.push(href);
      }
    }

    function onShortcutsChanged() {
      /* keymap rebuilt on each keydown via shortcutKeyMap() */
    }

    window.addEventListener('keydown', onKey);
    window.addEventListener('roomio-shortcuts-changed', onShortcutsChanged);
    window.addEventListener('roomio-quick-actions-changed', onShortcutsChanged);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('roomio-shortcuts-changed', onShortcutsChanged);
      window.removeEventListener('roomio-quick-actions-changed', onShortcutsChanged);
    };
  }, [router]);

  useEffect(() => {
    void readUserShortcuts();
  }, []);
}
