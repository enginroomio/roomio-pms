'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { flattenSidebarLinks } from '@/lib/navigation/sidebar-nav';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

const QUICK_LINKS = [
  ...flattenSidebarLinks(),
  ...GUEST_RELATIONS_NAV.map((n) => ({ label: `GR: ${n.label}`, href: n.href })),
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener('roomio-open-cmd', onOpen);
    return () => window.removeEventListener('roomio-open-cmd', onOpen);
  }, []);

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return QUICK_LINKS.slice(0, 12);
    return QUICK_LINKS.filter((i) => i.label.toLowerCase().includes(qq)).slice(0, 20);
  }, [q]);

  return (
    <>
      <button type="button" className="roomio-header-search" onClick={() => setOpen(true)} aria-label="Hızlı arama">
        <Search size={16} />
        <span>Ara…</span>
        <kbd>CTRL + K</kbd>
      </button>
      {open ? (
        <div className="roomio-cmd-overlay" onClick={() => setOpen(false)} role="presentation">
          <div className="roomio-cmd-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Hızlı arama">
            <input
              className="roomio-input roomio-cmd-input"
              autoFocus
              placeholder="Menü veya ekran ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul className="roomio-cmd-list">
              {items.map((i) => (
                <li key={i.href + i.label}><Link href={i.href} onClick={() => setOpen(false)}>{i.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
