'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { translateSidebarNavItems } from '@/lib/i18n/kurulus-nav-i18n';
import {
  Banknote,
  BarChart3,
  BedDouble,
  Building,
  ChevronRight,
  Clock,
  CalendarDays,
  Heart,
  Home,
  Search,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import {
  flattenSidebarLinks,
  navItemActive,
  type SidebarNavItem,
} from '@/lib/navigation/sidebar-nav';
import {
  PRO_QUICK_ACTIONS,
  PRO_SIDEBAR_MODULES,
  activeProModuleId,
  countModuleLinks,
  proModuleVisibleItems,
} from '@/lib/navigation/sidebar-pro-nav';

const icons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: Home,
  wallet: Wallet,
  'bed-double': BedDouble,
  heart: Heart,
  building: Building,
  settings: Settings,
  calendar: CalendarDays,
  banknote: Banknote,
  clock: Clock,
  'bar-chart': BarChart3,
};

function isLinkActive(pathname: string, href?: string) {
  if (!href || href === '#') return false;
  const base = href.split('?')[0];
  if (base === '/') return pathname === '/';
  return pathname === base || pathname.startsWith(`${base}/`);
}

function FlyoutBranch({
  item,
  pathname,
  depth = 0,
  onNavigate,
}: {
  item: SidebarNavItem;
  pathname: string;
  depth?: number;
  onNavigate: () => void;
}) {
  if (item.separator) return <div className="roomio-pro-flyout-sep" role="separator" />;

  const hasChildren = Boolean(item.children?.length);
  const active = navItemActive(pathname, item);

  if (hasChildren) {
    return (
      <div className="roomio-pro-flyout-group">
        <div className={`roomio-pro-flyout-heading depth-${depth}${active ? ' active' : ''}`}>{item.label}</div>
        {item.children!.map((child) => (
          <FlyoutBranch key={child.id} item={child} pathname={pathname} depth={depth + 1} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? '#'}
      className={`roomio-pro-flyout-link depth-${depth}${isLinkActive(pathname, item.href) ? ' active' : ''}`}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const routeModuleId = useMemo(() => activeProModuleId(pathname), [pathname]);
  const [moduleId, setModuleId] = useState(routeModuleId);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [flyoutItem, setFlyoutItem] = useState<SidebarNavItem | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const activeModule = useMemo(
    () => PRO_SIDEBAR_MODULES.find((m) => m.id === moduleId) ?? PRO_SIDEBAR_MODULES[0],
    [moduleId],
  );
  const activeModuleLabel = t(activeModule.labelKey, undefined, activeModule.label);

  const moduleItems = useMemo(() => {
    const raw = proModuleVisibleItems(moduleId, pathname, showAll);
    return translateSidebarNavItems(raw, t);
  }, [moduleId, pathname, showAll, t]);
  const totalModuleLinks = useMemo(() => countModuleLinks(moduleId), [moduleId]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    if (!q) return [];
    return flattenSidebarLinks().filter((link) => link.label.toLocaleLowerCase('tr-TR').includes(q));
  }, [query]);

  useEffect(() => {
    setModuleId(routeModuleId);
    setShowAll(false);
  }, [routeModuleId]);

  useEffect(() => {
    setFlyoutItem(null);
    setShowAll(false);
  }, [moduleId, pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFlyoutItem(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openFlyout(item: SidebarNavItem) {
    if (item.children?.length) setFlyoutItem(item);
    else setFlyoutItem(null);
  }

  return (
    <div className="roomio-sidebar-pro">
      <label className="roomio-pro-search">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('sidebar.searchPlaceholder')}
          aria-label={t('sidebar.searchPlaceholder')}
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="roomio-pro-quick">
        {PRO_QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="roomio-pro-quick-btn"
            title={`${t(action.labelKey, undefined, action.label)} (${action.key})`}
          >
            {t(action.labelKey, undefined, action.label)}
          </Link>
        ))}
      </div>

      <div className="roomio-pro-modules" role="tablist" aria-label={t('sidebar.modules')}>
        {PRO_SIDEBAR_MODULES.map((mod) => {
          const Icon = icons[mod.icon] ?? Settings;
          const selected = mod.id === moduleId;
          return (
            <button
              key={mod.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`roomio-pro-module${selected ? ' selected' : ''}`}
              onClick={() => {
                setModuleId(mod.id);
                setQuery('');
                setShowAll(false);
              }}
            >
              <Icon size={17} />
              <span>{t(mod.labelKey, undefined, mod.label)}</span>
            </button>
          );
        })}
      </div>

      <nav className="roomio-pro-nav" aria-label={activeModuleLabel}>
        <div className="roomio-pro-nav-head">
          <span>{activeModuleLabel}</span>
          <small>{showAll ? totalModuleLinks : moduleItems.filter((i) => !i.separator).length} / {totalModuleLinks}</small>
        </div>

        {query.trim() ? (
          <div className="roomio-pro-nav-list">
            {filteredLinks.length === 0 ? (
              <p className="roomio-pro-empty">{t('sidebar.noResults')}</p>
            ) : (
              filteredLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={`roomio-pro-link${isLinkActive(pathname, link.href) ? ' active' : ''}`}
                  onClick={() => setQuery('')}
                >
                  <span className="roomio-pro-link-text">{link.label}</span>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="roomio-pro-nav-list">
            {moduleItems.map((item) => {
              if (item.separator) return <div key={item.id} className="roomio-pro-sep" role="separator" />;

              const hasChildren = Boolean(item.children?.length);
              const active = navItemActive(pathname, item);
              const flyoutOpen = flyoutItem?.id === item.id;

              if (hasChildren) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`roomio-pro-link roomio-pro-link--branch${active ? ' active' : ''}${flyoutOpen ? ' open' : ''}`}
                    onClick={() => openFlyout(item)}
                    aria-expanded={flyoutOpen}
                  >
                    <span className="roomio-pro-link-text">{item.label}</span>
                    <ChevronRight size={15} className="roomio-pro-chevron" />
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href ?? '#'}
                  className={`roomio-pro-link${isLinkActive(pathname, item.href) ? ' active' : ''}`}
                >
                  <span className="roomio-pro-link-text">{item.label}</span>
                </Link>
              );
            })}
            {!showAll && totalModuleLinks > moduleItems.filter((i) => !i.separator).length ? (
              <button type="button" className="roomio-pro-show-all" onClick={() => setShowAll(true)}>
                {t('sidebar.showAll', { count: totalModuleLinks })}
              </button>
            ) : null}
            {showAll ? (
              <button type="button" className="roomio-pro-show-all muted" onClick={() => setShowAll(false)}>
                {t('sidebar.showFeatured')}
              </button>
            ) : null}
          </div>
        )}
      </nav>

      {flyoutItem?.children?.length ? (
        <>
          <button type="button" className="roomio-pro-flyout-backdrop" aria-label={t('sidebar.closeMenu')} onClick={() => setFlyoutItem(null)} />
          <div ref={flyoutRef} className="roomio-pro-flyout" role="dialog" aria-label={flyoutItem.label}>
            <div className="roomio-pro-flyout-header">
              <strong>{flyoutItem.label}</strong>
              <button type="button" className="roomio-pro-flyout-close" onClick={() => setFlyoutItem(null)} aria-label={t('sidebar.close')}>
                <X size={16} />
              </button>
            </div>
            <div className="roomio-pro-flyout-body">
              {flyoutItem.children.map((child) => (
                <FlyoutBranch
                  key={child.id}
                  item={child}
                  pathname={pathname}
                  onNavigate={() => setFlyoutItem(null)}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
