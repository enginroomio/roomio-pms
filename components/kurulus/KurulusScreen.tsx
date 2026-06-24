'use client';

import {
  AGENCY_CONTRACTS,
  DEMO_COMPANIES,
  DEPARTMENTS,
  MARKET_CODES,
  MEAL_PLANS,
  NATIONALITIES,
  RATE_PLANS,
  RES_TYPES,
  SEGMENT_CODES,
  SOURCE_CODES,
  type CodeRow,
} from '@/lib/data/kurulus';
import { AgenciesSettingsPanel } from '@/components/kurulus/AgenciesSettingsPanel';
import { BranchesSettingsPanel } from '@/components/kurulus/BranchesSettingsPanel';
import { CompaniesSettingsPanel } from '@/components/kurulus/CompaniesSettingsPanel';
import { ConfigParamsSettingsPanel } from '@/components/kurulus/ConfigParamsSettingsPanel';
import { ExtrasSettingsPanel } from '@/components/kurulus/ExtrasSettingsPanel';
import { FiscalDevicesSettingsPanel } from '@/components/kurulus/FiscalDevicesSettingsPanel';
import { HotelInfoSettingsPanel } from '@/components/kurulus/HotelInfoSettingsPanel';
import { HotelSeasonsSettingsPanel } from '@/components/kurulus/HotelSeasonsSettingsPanel';
import { LanguagesSettingsPanel } from '@/components/kurulus/LanguagesSettingsPanel';
import { MealPricesSettingsPanel } from '@/components/kurulus/MealPricesSettingsPanel';
import { MasterCodesPanel } from '@/components/kurulus/MasterCodesPanel';
import { FloorsSettingsPanel } from '@/components/kurulus/FloorsSettingsPanel';
import { MarketRequiredSettingsPanel } from '@/components/kurulus/MarketRequiredSettingsPanel';
import { PropertyRoomsSettingsPanel } from '@/components/kurulus/PropertyRoomsSettingsPanel';
import { RoomTypesSettingsPanel } from '@/components/kurulus/RoomTypesSettingsPanel';
import { ProgramDateSettingsPanel } from '@/components/kurulus/ProgramDateSettingsPanel';
import { RatePlansSettingsPanel } from '@/components/kurulus/RatePlansSettingsPanel';
import { UserGroupsSettingsPanel } from '@/components/kurulus/UserGroupsSettingsPanel';
import { UsersSettingsPanel } from '@/components/kurulus/UsersSettingsPanel';
import { UserParamsSettingsPanel } from '@/components/kurulus/UserParamsSettingsPanel';
import { WarehousesSettingsPanel } from '@/components/kurulus/WarehousesSettingsPanel';
import { Button } from '@/components/ui';
import { ExchangeRatesTable } from '@/components/exchange/ExchangeRatesTable';
import { ExchangeConfigPanel } from '@/components/exchange/ExchangeConfigPanel';
import { TaxRulesPanel } from '@/components/tax/TaxRulesPanel';
import { ThemeScreen } from '@/components/theme/ThemeScreen';
import type { ThemeMode } from '@/components/theme/ThemeProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { findKurulusScreenTitle } from '@/lib/i18n/kurulus-nav-i18n';

function screenKey(section: string | null, tab: string | null): string {
  if (tab === 'theme') return 'theme';
  if (tab === 'room-types') return 'room-types';
  if (tab === 'rooms') return 'rooms';
  if (tab === 'floors') return 'floors';
  if (section) return section;
  return 'otel-bilgileri';
}

function KurulusToolbar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="roomio-kurulus-toolbar">
      <h2 className="roomio-card-title">{title}</h2>
      {actions}
    </div>
  );
}

function CodeTable({ rows, columns }: { rows: CodeRow[]; columns?: string[] }) {
  const cols = columns ?? ['Kod', 'Ad', 'Açıklama', 'Durum'];
  return (
    <div className="roomio-table-wrap">
      <table className="roomio-table">
        <thead>
          <tr>
            {cols.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              <td><strong>{row.code}</strong></td>
              <td>{row.name}</td>
              {cols.includes('Açıklama') ? <td>{row.description ?? '—'}</td> : null}
              <td>{row.active ? 'Aktif' : 'Pasif'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GenericTableScreen({ title, rows, columns, headerAction }: {
  title: string;
  rows: Record<string, string | number>[];
  columns: Array<{ key: string; label: string }>;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="roomio-card roomio-table-wrap">
      <KurulusToolbar title={title} actions={headerAction} />
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key}>{row[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <div className="roomio-card">
      <KurulusToolbar title={title} />
      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        {t('kurulus.placeholder')}
      </p>
    </div>
  );
}

export function KurulusScreen({
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
  const { t } = useI18n();
  const key = screenKey(section, tab);

  switch (key) {
    case 'theme':
      return <ThemeScreen initialTheme={theme ?? null} fixed={themeFixed} />;
    case 'otel-bilgileri':
      return <HotelInfoSettingsPanel />;
    case 'room-types':
      return <RoomTypesSettingsPanel />;
    case 'rooms':
      return <PropertyRoomsSettingsPanel />;
    case 'floors':
      return <FloorsSettingsPanel />;
    case 'users':
      return <UsersSettingsPanel />;
    case 'user-groups':
      return <UserGroupsSettingsPanel />;
    case 'markets':
      return <MasterCodesPanel kind="market" titleKey="nav.kurulus.market-codes" />;
    case 'segments':
      return <MasterCodesPanel kind="segment" titleKey="nav.kurulus.segment-codes" />;
    case 'sources':
      return <MasterCodesPanel kind="source" titleKey="nav.kurulus.source-codes" />;
    case 'departments':
      return <MasterCodesPanel kind="department" titleKey="nav.kurulus.departments" />;
    case 'currencies':
      return (
        <>
          <ExchangeRatesTable title={t('kurulus.currencies.tcmbTitle')} />
          <ExchangeConfigPanel />
        </>
      );
    case 'tax-rules':
      return <TaxRulesPanel />;
    case 'nationalities':
      return <MasterCodesPanel kind="nationality" titleKey="nav.kurulus.nationalities" />;
    case 'language':
      return <LanguagesSettingsPanel />;
    case 'meal-plans':
      return <MasterCodesPanel kind="meal_plan" titleKey="nav.kurulus.meal-plans" />;
    case 'company-list':
      return (
        <div className="roomio-card">
          <KurulusToolbar title={`${t('kurulus.companies.title')} (${t('kurulus.live')})`} />
          <div style={{ marginTop: 12 }}><CompaniesSettingsPanel /></div>
        </div>
      );
    case 'config':
      return <ConfigParamsSettingsPanel />;
    case 'program-date':
      return <ProgramDateSettingsPanel />;
    case 'rate-plans':
      return (
        <div className="roomio-card">
          <KurulusToolbar title={t('kurulus.ratePlans.wrapper')} />
          <div style={{ marginTop: 12 }}>
            <RatePlansSettingsPanel />
          </div>
        </div>
      );
    case 'agencies':
      return (
        <div className="roomio-card">
          <KurulusToolbar title={`${t('kurulus.agencies.title')} (${t('kurulus.live')})`} />
          <div style={{ marginTop: 12 }}><AgenciesSettingsPanel /></div>
        </div>
      );
    case 'revenue-groups':
      return <MasterCodesPanel kind="revenue_group" titleKey="nav.kurulus.revenue-groups" columns={['code', 'name', 'description', 'status']} />;
    case 'meal-prices':
      return <MealPricesSettingsPanel />;
    case 'seasons':
      return <HotelSeasonsSettingsPanel />;
    case 'open-close':
      return <HotelSeasonsSettingsPanel view="open-close" />;
    case 'branches':
      return <BranchesSettingsPanel />;
    case 'warehouse':
      return <WarehousesSettingsPanel />;
    case 'fiscal':
      return <FiscalDevicesSettingsPanel />;
    case 'res-types':
      return <MasterCodesPanel kind="res_type" titleKey="nav.kurulus.res-types" />;
    case 'extras':
      return <ExtrasSettingsPanel />;
    case 'demo-data':
      return (
        <div className="roomio-card">
          <KurulusToolbar
            title={t('nav.kurulus.demo-data')}
            actions={<Button href="/reservations/new">{t('kurulus.demoData.newRes')}</Button>}
          />
          <p className="roomio-page-desc" style={{ marginTop: 12 }}>
            {t('kurulus.demoData.desc')}
          </p>
          <div className="roomio-quick-actions" style={{ marginTop: 16 }}>
            <Button href="/reservations">{t('kurulus.demoData.resList')}</Button>
            <Button variant="secondary" href="/reception/arrivals">{t('kurulus.demoData.arrivals')}</Button>
            <Button variant="secondary" href="/api/reports/export?format=csv">{t('kurulus.demoData.exportCsv')}</Button>
          </div>
        </div>
      );
    case 'market-required':
      return <MarketRequiredSettingsPanel />;
    case 'company-default':
    case 'company-select':
      return (
        <div className="roomio-card">
          <KurulusToolbar title={t(key === 'company-default' ? 'nav.kurulus.company-default' : 'nav.kurulus.company-select')} />
          <div style={{ marginTop: 12 }}><CompaniesSettingsPanel /></div>
        </div>
      );
    case 'company-create':
      return (
        <div className="roomio-card">
          <KurulusToolbar title={t('nav.kurulus.company-create')} />
          <div style={{ marginTop: 12 }}><CompaniesSettingsPanel /></div>
        </div>
      );
    case 'user-params':
      return <UserParamsSettingsPanel />;
    default:
      return <PlaceholderScreen title={findKurulusScreenTitle(t, key)} />;
  }
}
