'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import {
  moduleStats,
  PRO_MODULE_GROUPS,
  PROFESSIONAL_MODULES,
  type ModuleStatus,
  type ProModule,
} from '@/lib/navigation/professional-catalog';

function statusClass(status: ModuleStatus): string {
  if (status === 'live') return 'roomio-badge--ok';
  if (status === 'partial') return 'roomio-badge--warn';
  return 'roomio-badge--muted';
}

export function ProfessionalPmsHub() {
  const { t } = useI18n();
  const stats = moduleStats();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModuleStatus | 'all'>('all');

  const statusLabel: Record<ModuleStatus, string> = {
    live: t('tools.pro.status.live'),
    partial: t('tools.pro.status.partial'),
    planned: t('tools.pro.status.planned'),
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROFESSIONAL_MODULES.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.label.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q) ||
        m.href.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const byGroup = useMemo(() => {
    const map = new Map<string, ProModule[]>();
    for (const g of PRO_MODULE_GROUPS) map.set(g, []);
    for (const m of filtered) {
      const list = map.get(m.group);
      if (list) list.push(m);
    }
    return map;
  }, [filtered]);

  return (
    <PageHeader
      breadcrumb={t('tools.pro.breadcrumb')}
      title={t('tools.pro.title')}
      description={t('tools.pro.desc')}
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/tools/theme">{t('tools.pro.themeCatalog')}</Button>
          <Button variant="secondary" href="/tools/rollout">{t('tools.pro.rolloutTest')}</Button>
        </div>
      }
    >
      <div className="roomio-pro-hub">
        <div className="roomio-kpi-grid roomio-pro-kpis">
          <div className="roomio-kpi">
            <div className="roomio-kpi-label">{t('tools.pro.kpi.total')}</div>
            <div className="roomio-kpi-value">{stats.total}</div>
          </div>
          <div className="roomio-kpi">
            <div className="roomio-kpi-label">{t('tools.pro.kpi.live')}</div>
            <div className="roomio-kpi-value">{stats.live}</div>
          </div>
          <div className="roomio-kpi">
            <div className="roomio-kpi-label">{t('tools.pro.kpi.partial')}</div>
            <div className="roomio-kpi-value">{stats.partial}</div>
          </div>
          <div className="roomio-kpi">
            <div className="roomio-kpi-label">{t('tools.pro.kpi.completion')}</div>
            <div className="roomio-kpi-value">{stats.pct}%</div>
          </div>
        </div>

        <div className="roomio-card roomio-pro-toolbar">
          <input
            className="roomio-input"
            placeholder={t('tools.pro.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="roomio-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ModuleStatus | 'all')}
          >
            <option value="all">{t('tools.pro.filter.all')}</option>
            <option value="live">{t('tools.pro.status.live')}</option>
            <option value="partial">{t('tools.pro.status.partial')}</option>
            <option value="planned">{t('tools.pro.status.planned')}</option>
          </select>
        </div>

        <div className="roomio-pro-groups">
          {PRO_MODULE_GROUPS.map((group) => {
            const items = byGroup.get(group) ?? [];
            if (!items.length) return null;
            return (
              <section key={group} className="roomio-card roomio-pro-group">
                <h2 className="roomio-card-title">{group}</h2>
                <ul className="roomio-pro-module-list">
                  {items.map((m) => (
                    <li key={m.id}>
                      <Link href={m.href} className="roomio-pro-module-link">
                        <span className="roomio-pro-module-label">{m.label}</span>
                        <span className={`roomio-badge ${statusClass(m.status)}`}>
                          {statusLabel[m.status]}
                        </span>
                        {m.shortcut ? (
                          <span className="roomio-pro-shortcut">{m.shortcut}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </PageHeader>
  );
}
