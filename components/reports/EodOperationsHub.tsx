'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { DEMO_EOD_REPORTS, type EodArchive, type EodReport } from '@/lib/data/eod';
import { formatMoney } from '@/lib/data/reservations';
import { NightAuditPanel } from '@/components/reports/NightAuditPanel';
import { NightAuditPreClosePanel } from '@/components/reports/NightAuditPreClosePanel';

type ExtraCharge = { code: string; name: string; price: number; priceUnit: string; active: boolean };
type ProfileIssue = { room: string; guest: string; issue: string };

const ROOM_RATE_PREVIEW = [
  { type: 'DBL', current: 5200, next: 5400, status: 'pending' as const },
  { type: 'SUI', current: 9800, next: 10200, status: 'pending' as const },
  { type: 'TRP', current: 6100, next: 6100, status: 'unchanged' as const },
];

export function EodOperationsHub({ action }: { action: string | null }) {
  const { t } = useI18n();
  const active = action ?? 'fetch';
  const [businessDate, setBusinessDate] = useState('2026-06-18');
  const [eodArchive, setEodArchive] = useState<EodArchive[]>([]);
  const [reports, setReports] = useState<EodReport[]>(DEMO_EOD_REPORTS);
  const [eodMsg, setEodMsg] = useState<string | null>(null);
  const [eodBusy, setEodBusy] = useState(false);
  const [eodCanClose, setEodCanClose] = useState(true);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [profileIssues, setProfileIssues] = useState<ProfileIssue[]>([]);

  const loadEod = useCallback(async () => {
    const r = await roomioFetch('/api/eod/close');
    const j = (await r.json()) as { businessDate?: string; archive?: EodArchive[] };
    if (j.businessDate) setBusinessDate(j.businessDate);
    if (j.archive) setEodArchive(j.archive);
  }, []);

  useEffect(() => {
    void loadEod();
  }, [loadEod]);

  useEffect(() => {
    if (active !== 'extra-prices' && active !== 'profile-check') return;
    void roomioFetch('/api/extra-charges')
      .then((r) => r.json())
      .then((j: { charges?: ExtraCharge[] }) => setExtraCharges(j.charges ?? []));
  }, [active]);

  useEffect(() => {
    if (active !== 'profile-check') return;
    setProfileIssues([
      { room: '218', guest: 'Hans Mueller', issue: 'Pasaport no eksik' },
      { room: '405', guest: 'Ayşe Yılmaz', issue: 'EGM bildirimi bekliyor' },
    ]);
  }, [active]);

  const title =
    active === 'close' ? 'Günü Kapat'
      : active === 'archive' ? 'Eski Gün Sonu Raporları'
        : active === 'room-prices' ? 'Oda Fiyatlarını İşle'
          : active === 'audit' ? 'Gece Denetim İzi'
            : active === 'backup' ? 'Yedek Al'
              : active === 'extra-prices' ? 'Ek Fiyatları Bas'
                : active === 'profile-check' ? 'Misafir Profil Kontrol'
                  : 'Gün Sonu Raporları';

  async function handleCloseDay() {
    setEodBusy(true);
    setEodMsg(null);
    const r = await roomioFetch('/api/eod/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closedBy: 'Arda Yılmaz' }),
    });
    const j = (await r.json()) as { ok?: boolean; newBusinessDate?: string; error?: string; pdfBase64?: string };
    if (r.ok && j.ok) {
      setEodMsg(`Gün kapatıldı. Yeni iş günü: ${j.newBusinessDate}`);
      if (j.newBusinessDate) setBusinessDate(j.newBusinessDate);
      if (j.pdfBase64) {
        const blob = new Blob([Uint8Array.from(atob(j.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'roomio-gun-sonu.pdf';
        a.click();
      }
      await loadEod();
    } else {
      setEodMsg(j.error ?? 'Kapatma başarısız');
    }
    setEodBusy(false);
  }

  async function fetchAllReports() {
    setEodBusy(true);
    setEodMsg(null);
    try {
      const res = await roomioFetch('/api/eod/night-audit-package', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && j.ok !== false) {
        setReports((prev) => prev.map((r) => ({ ...r, status: 'ready' as const })));
        setEodMsg('Gün sonu rapor paketi hazırlandı.');
      } else {
        setEodMsg(j.error ?? 'Rapor alınamadı');
      }
    } catch {
      setReports((prev) => prev.map((r) => ({ ...r, status: 'ready' as const })));
      setEodMsg('Raporlar güncellendi (demo).');
    } finally {
      setEodBusy(false);
    }
  }

  async function runNightPosting(kind: 'room' | 'extra') {
    setEodBusy(true);
    setEodMsg(null);
    const res = await roomioFetch('/api/eod/night-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'Gün Sonu' }),
    });
    const j = (await res.json()) as {
      ok?: boolean;
      result?: { roomCharges: number; extraCharges: number; reservations: number };
      error?: string;
    };
    if (res.ok && j.result) {
      setEodMsg(
        kind === 'room'
          ? `${j.result.roomCharges} oda ücreti işlendi (${j.result.reservations} rezervasyon).`
          : `${j.result.extraCharges} ek ücret işlendi.`,
      );
    } else {
      setEodMsg(j.error ?? 'İşlem başarısız');
    }
    setEodBusy(false);
  }

  async function runBackup() {
    setEodBusy(true);
    setEodMsg(null);
    const res = await roomioFetch('/api/integrations/google-backup/backup', { method: 'POST' });
    const j = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (res.ok) {
      setEodMsg(j.message ?? 'Yedek paketi hazırlandı.');
    } else {
      setEodMsg(j.error ?? 'Yedek alınamadı — CSV dışa aktarma kullanılıyor.');
      window.open('/api/reports/export?format=csv', '_blank');
    }
    setEodBusy(false);
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">{title}</h2>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        İş günü: <strong>{businessDate}</strong>
      </p>

      <nav className="roomio-tabs" style={{ marginTop: 12 }}>
        <Link href="/reports?tab=eod&action=fetch" className={`roomio-tab${active === 'fetch' ? ' is-active' : ''}`}>{t('reports.eod.fetch')}</Link>
        <Link href="/reports?tab=eod&action=close" className={`roomio-tab${active === 'close' ? ' is-active' : ''}`}>{t('reports.eod.close')}</Link>
        <Link href="/reports?tab=eod&action=archive" className={`roomio-tab${active === 'archive' ? ' is-active' : ''}`}>{t('reports.eod.archive')}</Link>
        <Link href="/reports?tab=eod&action=backup" className={`roomio-tab${active === 'backup' ? ' is-active' : ''}`}>Yedek</Link>
        <Link href="/reports?tab=eod&action=room-prices" className={`roomio-tab${active === 'room-prices' ? ' is-active' : ''}`}>{t('reports.eod.roomPrices')}</Link>
        <Link href="/reports?tab=eod&action=extra-prices" className={`roomio-tab${active === 'extra-prices' ? ' is-active' : ''}`}>Ek fiyatlar</Link>
        <Link href="/reports?tab=eod&action=profile-check" className={`roomio-tab${active === 'profile-check' ? ' is-active' : ''}`}>Profil kontrol</Link>
        <Link href="/reports?report=gunluk-maliye" className="roomio-tab">Maliye</Link>
        <Link href="/reception?tab=kimlik" className="roomio-tab">Kimlik</Link>
        <Link href="/reports?tab=eod&action=audit" className={`roomio-tab${active === 'audit' ? ' is-active' : ''}`}>{t('reports.eod.audit')}</Link>
      </nav>

      {eodMsg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{eodMsg}</p> : null}

      {active === 'backup' ? (
        <div style={{ marginTop: 16 }}>
          <p className="roomio-page-desc">İş günü veritabanı ve rapor arşivi yedeklenir.</p>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button disabled={eodBusy} onClick={() => void runBackup()}>Yedek al</Button>
            <Button variant="secondary" href="/settings/integrations/google-backup">Google yedek ayarları</Button>
          </div>
        </div>
      ) : null}

      {active === 'extra-prices' ? (
        <div style={{ marginTop: 16 }}>
          <p className="roomio-page-desc">Gece ücreti olan ek hizmetler konaklayan folyolara işlenir.</p>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead><tr><th>Kod</th><th>Ek hizmet</th><th>Fiyat</th><th>Birim</th><th>Durum</th></tr></thead>
              <tbody>
                {extraCharges.filter((c) => c.active && c.priceUnit === 'gece').length === 0 ? (
                  <tr><td colSpan={5} className="roomio-table-empty">Gece ek ücret tanımı yok.</td></tr>
                ) : extraCharges.filter((c) => c.active && c.priceUnit === 'gece').map((c) => (
                  <tr key={c.code}>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.name}</td>
                    <td>{formatMoney(c.price)}</td>
                    <td>{c.priceUnit}</td>
                    <td><span className="roomio-badge">Bekliyor</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button disabled={eodBusy} onClick={() => void runNightPosting('extra')}>Ek fiyatları işle</Button>
          </div>
        </div>
      ) : null}

      {active === 'profile-check' ? (
        <div style={{ marginTop: 16 }}>
          <p className="roomio-page-desc">EGM ve profil eksiklikleri kontrol edilir.</p>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead><tr><th>Oda</th><th>Misafir</th><th>Sorun</th></tr></thead>
              <tbody>
                {profileIssues.length === 0 ? (
                  <tr><td colSpan={3} className="roomio-table-empty">Eksik profil yok.</td></tr>
                ) : profileIssues.map((p) => (
                  <tr key={p.room}><td>{p.room}</td><td>{p.guest}</td><td className="roomio-text-warn">{p.issue}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button href="/reception/guest-profile">Misafir profil ekranı</Button>
            <Button variant="secondary" href="/reservations?tab=egm">EGM listesi</Button>
            <Button variant="secondary" href="/reception?tab=kimlik-new">Yeni kimlik sistemi</Button>
          </div>
        </div>
      ) : null}

      {active === 'audit' ? <NightAuditPanel businessDate={businessDate} /> : null}

      {active === 'close' ? (
        <div style={{ marginTop: 16 }}>
          <NightAuditPreClosePanel businessDate={businessDate} onReadyChange={setEodCanClose} />
          <p className="roomio-page-desc">İş günü <strong>{businessDate}</strong> kapatılmaya hazır.</p>
          {!eodCanClose ? (
            <p className="roomio-page-desc roomio-text-warn">Açık kasa varken gün kapatılamaz — önce kasaları kapatın.</p>
          ) : null}
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <PermissionGate permission="eod.close" fallback={<p className="roomio-page-desc">Gün kapatma yetkiniz yok (RBAC).</p>}>
              <Button disabled={eodBusy || !eodCanClose} onClick={() => void handleCloseDay()}>
                {eodBusy ? 'Kapatılıyor…' : 'Günü kapat ve arşivle'}
              </Button>
            </PermissionGate>
            <Button variant="secondary" href="/reports?tab=eod&action=fetch">Önce raporları al</Button>
          </div>
        </div>
      ) : null}

      {active === 'archive' ? (
        <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr><th>İş günü</th><th>Kapanış</th><th>Kullanıcı</th><th>Doluluk</th><th>Gelir</th><th /></tr>
            </thead>
            <tbody>
              {eodArchive.length === 0 ? (
                <tr><td colSpan={6} className="roomio-table-empty">Arşiv kaydı yok.</td></tr>
              ) : eodArchive.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.businessDate}</strong></td>
                  <td>{a.closedAt}</td>
                  <td>{a.closedBy}</td>
                  <td>%{a.occupancy}</td>
                  <td>{formatMoney(a.revenue)}</td>
                  <td>
                    <Button variant="secondary" href={`/api/reports/export?format=pdf&category=gunluk&date=${encodeURIComponent(a.businessDate)}`}>
                      İndir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {active === 'room-prices' ? (
        <div style={{ marginTop: 16 }}>
          <p className="roomio-page-desc">BAR ve kontrat fiyatları gece posting ile folyolara işlenir.</p>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead><tr><th>Oda tipi</th><th>Mevcut</th><th>Yeni</th><th>Durum</th></tr></thead>
              <tbody>
                {ROOM_RATE_PREVIEW.map((r) => (
                  <tr key={r.type}>
                    <td><strong>{r.type}</strong></td>
                    <td>{formatMoney(r.current)}</td>
                    <td>{formatMoney(r.next)}</td>
                    <td>
                      <span className={`roomio-badge${r.status === 'unchanged' ? ' roomio-badge--muted' : ''}`}>
                        {r.status === 'unchanged' ? 'Değişmedi' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button disabled={eodBusy} onClick={() => void runNightPosting('room')}>Fiyatları işle</Button>
            <Button variant="secondary" href="/settings?section=rate-plans">Fiyat kodları</Button>
          </div>
        </div>
      ) : null}

      {active === 'fetch' ? (
        <>
          <p className="roomio-page-desc" style={{ marginTop: 12 }}>Bugünün gün sonu rapor paketi.</p>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead><tr><th>Rapor</th><th>İş günü</th><th>Oluşturma</th><th>Durum</th><th /></tr></thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.type}</strong></td>
                    <td>{r.businessDate}</td>
                    <td>{r.generatedAt}</td>
                    <td><span className={`roomio-badge roomio-badge--${r.status === 'ready' ? 'ok' : 'warn'}`}>{r.status === 'ready' ? 'Hazır' : 'Bekliyor'}</span></td>
                    <td>
                      <Button
                        variant="secondary"
                        disabled={r.status !== 'ready'}
                        href="/api/eod/night-audit-package?format=pdf"
                      >
                        İndir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button disabled={eodBusy} onClick={() => void fetchAllReports()}>Tüm raporları al</Button>
            <Button variant="secondary" href="/reports?tab=eod&action=close">Günü kapat</Button>
            <Button variant="ghost" href="/api/eod/night-audit-package?format=pdf">Paket PDF</Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
