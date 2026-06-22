'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  HelpCircle,
} from 'lucide-react';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { LicenseBadge } from '@/components/LicenseBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { IconRail } from '@/components/IconRail';
import { TopMenuNav } from '@/components/TopMenuNav';
import { ShortcutBar } from '@/components/ShortcutBar';
import { ReleaseNotice } from '@/components/ReleaseNotice';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import { HeaderUser } from '@/components/auth/HeaderUser';
import { PropertySwitcher } from '@/components/property/PropertySwitcher';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ContentOneScreen, type OneScreenVariant } from '@/components/ContentOneScreen';
import { useRoomioShortcuts } from '@/lib/shortcuts';

function oneScreenVariant(pathname: string): OneScreenVariant {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/housekeeping/mobile')) return 'hk';
  return 'default';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useRoomioShortcuts();
  const screenVariant = oneScreenVariant(pathname);

  if (pathname.startsWith('/wifi')) {
    return <div className="roomio-wifi-shell">{children}</div>;
  }

  if (pathname.startsWith('/housekeeping/mobile')) {
    return (
      <div className="roomio-viewport-host">
        <div className="roomio-viewport-canvas">
          <div className="roomio-hk-mobile-shell">
            <ContentOneScreen variant="hk">{children}</ContentOneScreen>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roomio-viewport-host">
      <div className="roomio-viewport-canvas">
        <div className="roomio-app">
          <IconRail />

          <div className="roomio-main">
            <header className="roomio-header roomio-header--app">
              <div className="roomio-header-top">
                <div className="roomio-header-left">
                  <PropertySwitcher />
                </div>

                <CommandPalette />

                <div className="roomio-header-meta">
                  <button type="button" className="roomio-header-icon-btn" aria-label="Takvim">
                    <CalendarDays size={18} />
                  </button>
                  <button type="button" className="roomio-header-icon-btn roomio-header-bell" aria-label="Bildirimler">
                    <Bell size={18} />
                    <span className="roomio-header-badge">3</span>
                  </button>
                  <Link href="/guest-relations" className="roomio-header-icon-btn" aria-label="Yardım">
                    <HelpCircle size={18} />
                  </Link>
                  <LicenseBadge />
                  <ThemeToggle />
                  <LocaleSwitcher />
                  <RoleSwitcher />
                  <SyncStatusBar />
                  <HeaderUser />
                </div>
              </div>

              <TopMenuNav />
            </header>

            <main className="roomio-content">
              <Suspense fallback={null}>
                <ReleaseNotice />
              </Suspense>
              <ContentOneScreen variant={screenVariant}>{children}</ContentOneScreen>
            </main>
            <ShortcutBar />
          </div>
        </div>
      </div>
    </div>
  );
}
