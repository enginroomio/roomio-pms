'use client';

import { useEffect, useMemo, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { KURULUS_NAV } from '@/lib/navigation/kurulus-nav';
import {
  CONFIG_PARAMS,
  DEMO_COMPANIES,
  DEMO_LANGUAGES,
  DEPARTMENTS,
  HOTEL_INFO,
  MARKET_CODES,
  MEAL_PLANS,
  NATIONALITIES,
  SEGMENT_CODES,
  SOURCE_CODES,
  USER_GROUPS,
  type CodeRow,
} from '@/lib/data/kurulus';
import { FLOORS, countTotalRooms } from '@/lib/rooms/room-config';
import { getAllRooms, getRoomTypesList } from '@/lib/rooms/inventory';
import { Button } from '@/components/ui';
import { ExchangeRatesTable } from '@/components/exchange/ExchangeRatesTable';
import { ExchangeConfigPanel } from '@/components/exchange/ExchangeConfigPanel';
import { TaxRulesPanel } from '@/components/tax/TaxRulesPanel';

function screenKey(section: string | null, tab: string | null): string {
  if (tab === 'room-types') return 'room-types';
  if (tab === 'rooms') return 'rooms';
  if (tab === 'floors') return 'floors';
  if (section) return section;
  return 'otel-bilgileri';
}

function findTitle(key: string): string {
  for (const entry of KURULUS_NAV) {
    if (entry.id === key) return entry.label;
    for (const child of entry.children ?? []) {
      if (child.id === key || child.href.includes(key)) return child.label;
    }
    if (entry.href.includes(`section=${key}`)) return entry.label;
  }
  return key;
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

function HotelInfoScreen() {
  const { activeProperty, propertyId } = useProperty();

  const info = useMemo(() => {
    if (!activeProperty) return HOTEL_INFO;
    const branch =
      activeProperty.id === 'prop-sapphire-ant'
        ? {
            name: activeProperty.name,
            code: activeProperty.code,
            company: 'Hotel Sapphire Turizm A.Ş.',
            address: 'Lara Turizm Yolu No:45, Muratpaşa / Antalya',
            phone: '+90 242 555 02 00',
            email: 'antalya@sapphirehotel.com',
            totalRooms: activeProperty.totalRooms,
          }
        : {
            name: activeProperty.name,
            code: activeProperty.code,
            company: HOTEL_INFO.company,
            address: HOTEL_INFO.address,
            phone: HOTEL_INFO.phone,
            email: HOTEL_INFO.email,
            totalRooms: activeProperty.totalRooms,
          };
    return { ...HOTEL_INFO, ...branch };
  }, [activeProperty]);

  return (
    <div className="roomio-card" key={propertyId}>
      <KurulusToolbar
        title="Otel Bilgileri"
        actions={
          <>
            {activeProperty?.city ? <span className="roomio-badge">{activeProperty.city}</span> : null}
            <Button variant="secondary">Kaydet</Button>
          </>
        }
      />
      <div className="roomio-form-grid roomio-form-grid--2" style={{ marginTop: 16 }}>
        <label className="roomio-field"><span>Otel adı</span><input className="roomio-input" defaultValue={info.name} /></label>
        <label className="roomio-field"><span>Otel kodu</span><input className="roomio-input" defaultValue={info.code} /></label>
        <label className="roomio-field"><span>Şirket</span><input className="roomio-input" defaultValue={info.company} /></label>
        <label className="roomio-field"><span>Vergi no</span><input className="roomio-input" defaultValue={info.taxNumber} /></label>
        <label className="roomio-field roomio-field--full"><span>Adres</span><input className="roomio-input" defaultValue={info.address} /></label>
        <label className="roomio-field"><span>Telefon</span><input className="roomio-input" defaultValue={info.phone} /></label>
        <label className="roomio-field"><span>E-posta</span><input className="roomio-input" defaultValue={info.email} /></label>
        <label className="roomio-field"><span>Yıldız</span><input className="roomio-input" type="number" defaultValue={info.stars} /></label>
        <label className="roomio-field"><span>Oda sayısı</span><input className="roomio-input" type="number" defaultValue={info.totalRooms} readOnly /></label>
        <label className="roomio-field"><span>Giriş saati</span><input className="roomio-input" defaultValue={info.checkInTime} /></label>
        <label className="roomio-field"><span>Çıkış saati</span><input className="roomio-input" defaultValue={info.checkOutTime} /></label>
        <label className="roomio-field"><span>İş günü</span><input className="roomio-input" defaultValue={info.businessDate} /></label>
        <label className="roomio-field"><span>Para birimi</span><input className="roomio-input" defaultValue={info.currency} /></label>
      </div>
    </div>
  );
}

function RoomTypesScreen() {
  const types = getRoomTypesList();
  return (
    <div className="roomio-card roomio-table-wrap">
      <KurulusToolbar title="Oda Tip Tanımları" actions={<Button>Yeni tip</Button>} />
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Kod</th><th>Kısa</th><th>Ad</th><th>Yatak</th><th>Kapasite</th><th>Taban fiyat</th><th>Konum</th></tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.code}>
              <td><strong>{t.code}</strong></td>
              <td>{t.short}</td>
              <td>{t.name}</td>
              <td>{t.bedType}</td>
              <td>{t.maxPersons}</td>
              <td>₺{t.baseRate.toLocaleString('tr-TR')}</td>
              <td>{t.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoomNumbersScreen() {
  const rooms = useMemo(() => getAllRooms().slice(0, 40), []);
  return (
    <div className="roomio-card roomio-table-wrap">
      <KurulusToolbar
        title="Oda No Tanımları"
        actions={<span className="roomio-text-muted" style={{ fontSize: '0.85rem' }}>{countTotalRooms()} oda · ilk 40 gösteriliyor</span>}
      />
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Oda</th><th>Kat</th><th>Tip</th><th>Yatak</th><th>Konum</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.roomNo}>
              <td><strong>{r.roomNo}</strong></td>
              <td>{r.floor}</td>
              <td>{r.typeShort}</td>
              <td>{r.bedType}</td>
              <td>{r.location}</td>
              <td>{r.isActive ? 'Aktif' : 'Kapalı'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FloorsScreen() {
  return (
    <div className="roomio-card roomio-table-wrap">
      <KurulusToolbar title="Kat Tanımları" actions={<Button variant="secondary">Kat ekle</Button>} />
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Kat</th><th>Başlangıç</th><th>Bitiş</th><th>Oda sayısı</th></tr>
        </thead>
        <tbody>
          {FLOORS.map((f) => {
            let count = 0;
            for (let n = f.start; n <= f.end; n++) if (n % 100 !== 6) count++;
            return (
              <tr key={f.floor}>
                <td><strong>{f.floor}. Kat</strong></td>
                <td>{f.start}</td>
                <td>{f.end}</td>
                <td>{count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsersScreen() {
  const [users, setUsers] = useState<Array<{
    id: string;
    username: string;
    fullName: string;
    role: string;
    department: string;
    email: string;
    active: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        const body = (await res.json()) as {
          ok?: boolean;
          users?: Array<{
            id: string;
            username: string;
            fullName: string;
            role: string;
            department: string;
            email: string;
            active: boolean;
          }>;
          message?: string;
        };
        if (!res.ok || !body.ok) {
          setError(body.message ?? 'Kullanıcılar yüklenemedi');
          return;
        }
        setUsers(body.users ?? []);
      } catch {
        setError('Kullanıcılar yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="roomio-card roomio-table-wrap">
      <KurulusToolbar
        title="Kullanıcı Tanımları"
        actions={
          <>
            <span className="roomio-badge">{loading ? '…' : `${users.length} kullanıcı`}</span>
            <Button>Yeni kullanıcı</Button>
          </>
        }
      />
      {error ? <p className="roomio-text-warn" style={{ marginTop: 12 }}>{error}</p> : null}
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Kullanıcı</th><th>Ad Soyad</th><th>E-posta</th><th>Rol</th><th>Departman</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Yükleniyor…</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={6}>Kayıtlı kullanıcı yok — deploy sonrası demo kullanıcılar otomatik eklenir.</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.department}</td>
                <td>{u.active ? 'Aktif' : 'Pasif'}</td>
              </tr>
            ))
          )}
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
  return (
    <div className="roomio-card">
      <KurulusToolbar title={title} />
      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        Bu kuruluş ekranı rollout sırasında dolduruluyor. Veri modeli ve form alanları bir sonraki adımda eklenecek.
      </p>
    </div>
  );
}

export function KurulusScreen({
  section,
  tab,
}: {
  section: string | null;
  tab: string | null;
}) {
  const key = screenKey(section, tab);

  switch (key) {
    case 'otel-bilgileri':
      return <HotelInfoScreen />;
    case 'room-types':
      return <RoomTypesScreen />;
    case 'rooms':
      return <RoomNumbersScreen />;
    case 'floors':
      return <FloorsScreen />;
    case 'users':
      return <UsersScreen />;
    case 'user-groups':
      return (
        <GenericTableScreen
          title="Kullanıcı Grup Tanımları"
          headerAction={<Button variant="secondary">Yeni grup</Button>}
          columns={[
            { key: 'code', label: 'Kod' },
            { key: 'name', label: 'Grup adı' },
            { key: 'users', label: 'Kullanıcı' },
          ]}
          rows={USER_GROUPS.map((g) => ({ code: g.code, name: g.name, users: g.users }))}
        />
      );
    case 'markets':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Market Kodları" actions={<Button>Yeni market</Button>} />
          <div style={{ marginTop: 12 }}><CodeTable rows={MARKET_CODES} /></div>
        </div>
      );
    case 'segments':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Segment Kodları" actions={<Button variant="secondary">Yeni segment</Button>} />
          <div style={{ marginTop: 12 }}><CodeTable rows={SEGMENT_CODES} columns={['Kod', 'Ad', 'Durum']} /></div>
        </div>
      );
    case 'sources':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Kaynak Kodları" actions={<Button variant="secondary">Yeni kaynak</Button>} />
          <div style={{ marginTop: 12 }}><CodeTable rows={SOURCE_CODES} columns={['Kod', 'Ad', 'Durum']} /></div>
        </div>
      );
    case 'departments':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Departman Tanımları" actions={<Button>Yeni departman</Button>} />
          <div style={{ marginTop: 12 }}><CodeTable rows={DEPARTMENTS} columns={['Kod', 'Ad', 'Durum']} /></div>
        </div>
      );
    case 'currencies':
      return (
        <>
          <ExchangeRatesTable title="Döviz Tanımları — TCMB kurları" />
          <ExchangeConfigPanel />
        </>
      );
    case 'tax-rules':
      return <TaxRulesPanel />;
    case 'nationalities':
      return (
        <GenericTableScreen
          title="Uyruk Tanımları"
          columns={[
            { key: 'code', label: 'Kod' },
            { key: 'name', label: 'Uyruk' },
          ]}
          rows={NATIONALITIES}
        />
      );
    case 'language':
      return (
        <>
          <GenericTableScreen
            title="Dil Tanımları"
            headerAction={<Button>Yeni dil</Button>}
            columns={[
              { key: 'code', label: 'Kod' },
              { key: 'name', label: 'Ad' },
              { key: 'nativeName', label: 'Yerel ad' },
              { key: 'defaultLang', label: 'Varsayılan' },
              { key: 'active', label: 'Durum' },
            ]}
            rows={DEMO_LANGUAGES.map((l) => ({
              ...l,
              defaultLang: l.defaultLang ? 'Evet' : '—',
              active: l.active ? 'Aktif' : 'Pasif',
            }))}
          />
          <p className="roomio-page-desc" style={{ marginTop: 12 }}>
            Uygulama dili header&apos;daki <strong>TR / EN</strong> seçicisinden değiştirilir.
          </p>
        </>
      );
    case 'meal-plans':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Pansiyon Tanımları" />
          <div style={{ marginTop: 12 }}><CodeTable rows={MEAL_PLANS} columns={['Kod', 'Ad', 'Durum']} /></div>
        </div>
      );
    case 'company-list':
      return (
        <GenericTableScreen
          title="Şirket Listesi"
          headerAction={<Button>Şirket kur</Button>}
          columns={[
            { key: 'code', label: 'Kod' },
            { key: 'name', label: 'Şirket' },
            { key: 'branch', label: 'Şube' },
            { key: 'active', label: 'Durum' },
          ]}
          rows={DEMO_COMPANIES.map((c) => ({ ...c, active: c.active ? 'Aktif' : 'Pasif' }))}
        />
      );
    case 'config':
      return (
        <GenericTableScreen
          title="Konfigürasyon Tablosu"
          columns={[
            { key: 'key', label: 'Parametre' },
            { key: 'value', label: 'Değer' },
            { key: 'description', label: 'Açıklama' },
          ]}
          rows={CONFIG_PARAMS}
        />
      );
    case 'program-date':
      return (
        <div className="roomio-card">
          <KurulusToolbar title="Program Tarihi Değiştir" actions={<Button>Kaydet</Button>} />
          <div className="roomio-form-grid" style={{ marginTop: 16, maxWidth: 360 }}>
            <label className="roomio-field">
              <span>İş günü (program tarihi)</span>
              <input className="roomio-input" type="date" defaultValue="2026-06-18" />
            </label>
            <label className="roomio-field">
              <span>Sistem tarihi</span>
              <input className="roomio-input" defaultValue={new Date().toLocaleDateString('tr-TR')} readOnly />
            </label>
          </div>
        </div>
      );
    default:
      return <PlaceholderScreen title={findTitle(key)} />;
  }
}
