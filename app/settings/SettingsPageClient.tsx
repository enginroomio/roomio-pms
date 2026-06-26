'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { KurulusScreen } from '@/components/kurulus/KurulusScreen';
import { useSession } from '@/components/auth/SessionProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { canAccessRoute, hasPermission } from '@/lib/auth/roles';
import { findKurulusNavTitle, translateKurulusModuleMenu } from '@/lib/i18n/kurulus-nav-i18n';
import {
  isSistemMenuContext,
  kurulusModuleMenuForUser,
  SISTEM_MODULE_MENU,
} from '@/lib/navigation/module-menus';
import { Button } from '@/components/ui';
import type { ThemeMode } from '@/components/theme/ThemeProvider';
import { AyarlarHubPanel } from '@/components/settings/AyarlarHubPanel';
import { SistemHubPanel } from '@/components/settings/SistemHubPanel';
import { CalculatorToolPanel, SettingsAyalarHub } from '@/components/settings/SettingsHubPanels';

function KurulusAccessBanner() {
  const { user } = useSession();
  const { t } = useI18n();
  if (!user || hasPermission(user, 'settings.admin')) return null;

  const isViewer = user.role === 'viewer';
  const identityOnly = hasPermission(user, 'identity.read');

  let message = t('nav.settings.accessLimited');
  if (isViewer) {
    message = t('nav.settings.accessViewer');
  } else if (identityOnly) {
    message = t('nav.settings.accessIdentity');
  }

  return (
    <p
      className="roomio-card roomio-page-desc"
      role="status"
      style={{ marginBottom: 16, padding: '12px 16px' }}
    >
      {message}
    </p>
  );
}

export function SettingsPageClient({
  section,
  tab,
  theme,
  themeFixed,
}: {
  section: string | null;
  tab: string | null;
  theme?: ThemeMode | null;
  themeFixed?: boolean;
}) {
  const { user, logout } = useSession();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const hub = searchParams.get('hub');
  const tool = searchParams.get('tool');
  const action = searchParams.get('action');
  const menuSearch = useMemo(() => {
    if (tool) return `?tool=${tool}`;
    if (action) return `?action=${action}`;
    if (section) return `?section=${section}`;
    if (tab) {
      const fixed = searchParams.get('fixed');
      return fixed ? `?tab=${tab}&fixed=${fixed}` : `?tab=${tab}`;
    }
    if (hub) return `?hub=${hub}`;
    return '';
  }, [tool, action, section, tab, hub, searchParams]);
  const screenTitle = findKurulusNavTitle(t, section, tab);
  const isKurulusHub = !hub && !section && !tab && tool !== 'calculator';
  const pageTitle = isKurulusHub ? t('nav.settings.title') : screenTitle;
  const kurulusBreadcrumb = section || tab
    ? `${t('nav.settings.sideTitle')} › ${screenTitle}`
    : t('nav.settings.breadcrumb');
  const canAccess = user ? canAccessRoute(user, '/settings', { section, tab }) : true;
  const kurulusMenu = useMemo(
    () => translateKurulusModuleMenu(kurulusModuleMenuForUser(user), t),
    [user, t],
  );
  const sistemContext = isSistemMenuContext('/settings', menuSearch);
  const sideMenu = sistemContext ? SISTEM_MODULE_MENU : kurulusMenu;
  const sideNavTitle = sistemContext ? 'Sistem' : t('nav.settings.sideTitle');

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'logout' || action === 'exit') {
      void logout();
    }
  }, [searchParams, logout]);

  if (tool === 'calculator') {
    return (
      <ModuleLayout
        breadcrumb={t('nav.settings.breadcrumb')}
        title="Hesap Makinesi"
        description={t('nav.settings.description')}
        sideTitle={t('nav.settings.sideTitle')}
        menuSearch="?tool=calculator"
        menuItems={kurulusMenu}
      >
        <CalculatorToolPanel />
      </ModuleLayout>
    );
  }

  if (hub === 'sistem' && !section && !tab) {
    return (
      <ModuleLayout
        breadcrumb="Sistem"
        title="Sistem Merkezi"
        description="Kuruluş tanımları, rapor tasarım, entegrasyonlar ve uyumluluk."
        sideTitle="Sistem"
        menuSearch="?hub=sistem"
        menuItems={SISTEM_MODULE_MENU}
      >
        <SistemHubPanel />
      </ModuleLayout>
    );
  }

  if (hub === 'ayarlar' && !section && !tab) {
    return (
      <ModuleLayout
        breadcrumb="Ayarlar"
        title="Ayarlar ve Kısayollar"
        description="Tema, güvenlik, notlar, santral ve lisans işlemleri."
        sideTitle={t('nav.settings.sideTitle')}
        menuSearch="?hub=ayarlar"
        menuItems={kurulusMenu}
      >
        <AyarlarHubPanel />
      </ModuleLayout>
    );
  }

  if (tab === 'theme' || tab === 'password') {
    if (tab === 'theme' && user && !canAccessRoute(user, '/settings', { section, tab: 'theme' })) {
      return (
        <ModuleLayout
          breadcrumb={t('nav.settings.breadcrumb')}
          title={pageTitle}
          sideTitle={t('nav.settings.sideTitle')}
          menuSearch={menuSearch}
          menuItems={kurulusMenu}
        >
          <div className="roomio-card" style={{ padding: 16 }}>
            <p className="roomio-page-desc">{t('nav.settings.themeAdminRequired')}</p>
            <Button href="/settings?section=users" style={{ marginTop: 12 }}>
              {t('nav.settings.userDefs')}
            </Button>
          </div>
        </ModuleLayout>
      );
    }
    return (
      <ModuleLayout
        breadcrumb={kurulusBreadcrumb}
        title={pageTitle}
        description={t('nav.settings.description')}
        sideTitle={t('nav.settings.sideTitle')}
        menuSearch={menuSearch}
        menuItems={kurulusMenu}
      >
        <KurulusScreen section={section} tab={tab} theme={theme} themeFixed={themeFixed} />
      </ModuleLayout>
    );
  }

  if (user && !canAccess) {
    return (
      <ModuleLayout
        breadcrumb={t('nav.settings.breadcrumb')}
        title={t('nav.settings.title')}
        description={t('nav.settings.noAccess')}
        sideTitle={t('nav.settings.sideTitle')}
        menuSearch={menuSearch}
        menuItems={kurulusMenu}
      >
        <div className="roomio-card" style={{ padding: 16 }}>
          <p className="roomio-page-desc">
            {hasPermission(user, 'identity.read')
              ? t('nav.settings.noAccessIdentity')
              : t('nav.settings.noAccessAdmin')}
          </p>
          {hasPermission(user, 'identity.read') ? (
            <div className="roomio-quick-actions" style={{ marginTop: 12 }}>
              <Button href="/settings?section=users">{t('nav.settings.userDefs')}</Button>
              <Button variant="secondary" href="/settings?section=user-groups">
                {t('nav.settings.groupDefs')}
              </Button>
            </div>
          ) : null}
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      breadcrumb={sistemContext ? `Sistem › ${screenTitle}` : kurulusBreadcrumb}
      title={pageTitle}
      description={section || tab ? undefined : t('nav.settings.description')}
      sideTitle={sideNavTitle}
      menuSearch={menuSearch}
      menuItems={sideMenu}
    >
      {isKurulusHub ? (
        <div className="roomio-kurulus-meta">
          <span className="roomio-badge">{t('nav.settings.badge')}</span>
          <div className="roomio-quick-actions">
            <Button variant="ghost" href="/tools/theme">
              {t('nav.settings.themeScreen')}
            </Button>
            <Button variant="ghost" href="/tools/rollout?phase=sistem">
              {t('nav.settings.rolloutTest')}
            </Button>
            <Button variant="ghost" href="/settings/integrations">
              {t('nav.settings.integrations')}
            </Button>
          </div>
        </div>
      ) : null}
      <KurulusAccessBanner />
      {isKurulusHub ? <SettingsAyalarHub /> : null}
      <KurulusScreen section={section} tab={tab} theme={theme} themeFixed={themeFixed} />
    </ModuleLayout>
  );
}
