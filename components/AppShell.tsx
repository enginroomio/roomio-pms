'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  HelpCircle,
} from 'lucide-react';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { RouteAccessGuard } from '@/components/auth/RouteAccessGuard';
import { LicenseBadge } from '@/components/LicenseBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { IconRail } from '@/components/IconRail';
import { TopMenuNav } from '@/components/TopMenuNav';
import { AppContextMenuLayer } from '@/components/navigation/AppContextMenuLayer';
import { ShortcutBar } from '@/components/ShortcutBar';
import { ReleaseNotice } from '@/components/ReleaseNotice';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import { HeaderUser } from '@/components/auth/HeaderUser';
import { PropertySwitcher } from '@/components/property/PropertySwitcher';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { PwaOfflineBanner } from '@/components/pwa/PwaOfflineBanner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ContentOneScreen, type OneScreenVariant } from '@/components/ContentOneScreen';
import { useRoomioShortcuts } from '@/lib/shortcuts';

function isMockupRoute(pathname: string): boolean {
  return pathname.includes('/mockup');
}

function isHkMobileRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/housekeeping/mobile') ||
    pathname.startsWith('/housekeeping/rooms') ||
    pathname.startsWith('/housekeeping/assign') ||
    pathname.startsWith('/housekeeping/tasks') ||
    pathname.startsWith('/housekeeping/faults') ||
    pathname.startsWith('/housekeeping/reports')
  );
}

function isThemeRoute(pathname: string, tab: string | null): boolean {
  return pathname === '/tools/theme' || (pathname === '/settings' && tab === 'theme');
}

function oneScreenVariant(pathname: string, tab: string | null): OneScreenVariant {
  if (isThemeRoute(pathname, tab)) return 'theme';
  if (pathname === '/') return 'dashboard';
  if (isHkMobileRoute(pathname)) return 'hk';
  return 'default';
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  useRoomioShortcuts();
  const screenVariant = oneScreenVariant(pathname, tab);

  if (pathname.startsWith('/wifi')) {
    return <div className="roomio-wifi-shell">{children}</div>;
  }

  if (pathname === '/login' || pathname === '/offline') {
    return <>{children}</>;
  }

  if (isMockupRoute(pathname)) {
    return (
      <div className="roomio-viewport-host">
        <div className="roomio-viewport-canvas">
          <div className="roomio-mockup-shell">
            <ContentOneScreen variant="default">{children}</ContentOneScreen>
          </div>
        </div>
      </div>
    );
  }

  if (isHkMobileRoute(pathname)) {
    return (
      <div className="roomio-viewport-host">
        <div className="roomio-viewport-canvas">
          <div className="roomio-hk-mobile-shell">
            <ContentOneScreen variant={screenVariant}>
              <RouteAccessGuard>{children}</RouteAccessGuard>
            </ContentOneScreen>
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

          <AppContextMenuLayer>
            <div className="roomio-main">
            <PwaOfflineBanner />
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
              <ContentOneScreen variant={screenVariant}>
                <RouteAccessGuard>{children}</RouteAccessGuard>
              </ContentOneScreen>
            </main>
            <ShortcutBar />
            </div>
          </AppContextMenuLayer>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
