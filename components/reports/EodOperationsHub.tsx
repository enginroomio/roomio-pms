'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { type EodArchive, type EodReport } from '@/lib/data/eod';
import { formatMoney } from '@/lib/data/reservations';
import { NightAuditPanel } from '@/components/reports/NightAuditPanel';
import { NightAuditPreClosePanel } from '@/components/reports/NightAuditPreClosePanel';
import { EodLegacyReportWorkspace } from '@/components/reports/EodLegacyReportWorkspace';

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
  const [reports, setReports] = useState<EodReport[]>([
    { id: 'pkg-audit', businessDate, generatedAt: '—', type: 'Gece Denetim Paketi', status: 'pending' },
    { id: 'pkg-gr', businessDate, generatedAt: '—', type: 'Elektra GR Paketi (49 rapor)', status: 'pending' },
  ]);
  const [eodMsg, setEodMsg] = useState<string | null>(null);
  const [eodBusy, setEodBusy] = useState(false);
  const [backupHistory, setBackupHistory] = useState<
    { id: string; startedAt: string; provider: string; status: string; sizeBytes: number }[]
  >([]);
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

  useEffect(() => {
    if (active !== 'backup') return;
    void roomioFetch('/api/cloud-backup/history?limit=5')
      .then((r) => r.json())
      .then((j: { runs?: { id: string; startedAt: string; provider: string; status: string; sizeBytes: number }[] }) =>
        setBackupHistory(j.runs ?? []),
      );
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
    const j = (await r.json()) as {
      ok?: boolean;
      newBusinessDate?: string;
      error?: string;
      pdfBase64?: string;
      archivedReports?: { gr: number; total: number };
      cloudBackup?: { ok?: boolean; message?: string; skipped?: boolean; sizeBytes?: number };
    };
    if (r.ok && j.ok) {
      const archiveMsg = j.archivedReports
        ? ` ${j.archivedReports.gr} GR + gece denetim arşivlendi (toplam ${j.archivedReports.total}).`
        : '';
      const backupMsg = j.cloudBackup?.message
        ? ` Bulut yedek: ${j.cloudBackup.message}${j.cloudBackup.sizeBytes ? ` (${Math.round(j.cloudBackup.sizeBytes / 1024)} KB)` : ''}.`
        : '';
      setEodMsg(`Gün kapatıldı. Yeni iş günü: ${j.newBusinessDate}.${archiveMsg}${backupMsg}`);
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

  useEffect(() => {
    setReports((prev) =>
      prev.map((r) => (r.id.startsWith('pkg-') ? { ...r, businessDate } : r)),
    );
  }, [businessDate]);

  async function fetchAllReports() {
    setEodBusy(true);
    setEodMsg(null);
    const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    try {
      const [grRes, auditRes] = await Promise.all([
        roomioFetch('/api/eod/gr-package', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessDate, persist: true }),
        }),
        roomioFetch('/api/eod/night-audit-package', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessDate }),
        }),
      ]);
      const grJson = grRes.ok
        ? ((await grRes.json()) as {
            reportCount?: number;
            reports?: { id: string; title: string }[];
            persisted?: boolean;
            archived?: { totalCount: number };
            cloudBackup?: { ok?: boolean; message?: string; skipped?: boolean };
          })
        : null;
      const auditOk = auditRes.ok;

      if (grJson?.reportCount) {
        const grRows: EodReport[] = grJson.reports?.slice(0, 12).map((r) => ({
          id: `gr-${r.id}`,
          businessDate,
          generatedAt,
          type: `${r.id} — ${r.title}`,
          status: 'ready' as const,
        })) ?? [];
        const summary: EodReport = {
          id: 'pkg-gr',
          businessDate,
          generatedAt,
          type: `Elektra GR Paketi (${grJson.reportCount} rapor)`,
          status: 'ready',
        };
        const auditRow: EodReport = {
          id: 'pkg-audit',
          businessDate,
          generatedAt,
          type: 'Gece Denetim Paketi',
          status: auditOk ? 'ready' : 'pending',
        };
        const overflow =
          (grJson.reportCount ?? 0) > 12
            ? [{
                id: 'pkg-gr-more',
                businessDate,
                generatedAt,
                type: `… ve ${(grJson.reportCount ?? 0) - 12} rapor daha (arşiv)`,
                status: 'ready' as const,
              }]
            : [];
        setReports([auditRow, summary, ...grRows, ...overflow]);
        setEodMsg(
          `Gün sonu paketi DB'ye kaydedildi — ${grJson.reportCount} GR raporu + gece denetim${
            grJson.archived?.totalCount ? ` (toplam ${grJson.archived.totalCount} snapshot)` : ''
          }${grJson.cloudBackup?.message ? ` · ${grJson.cloudBackup.message}` : ''}.`,
        );
        await loadEod();
      } else {
        setEodMsg('GR paketi alınamadı');
      }
    } catch {
      setEodMsg('Rapor paketi alınamadı');
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
    const res = await roomioFetch('/api/cloud-backup/run', { method: 'POST' });
    const j = (await res.json()) as { ok?: boolean; message?: string; sizeBytes?: number; simulated?: boolean };
    if (res.ok && j.ok) {
      setEodMsg(`${j.message ?? 'Yedek tamamlandı'}${j.sizeBytes ? ` · ${Math.round(j.sizeBytes / 1024)} KB` : ''}${j.simulated ? ' (simülasyon)' : ''}`);
      void roomioFetch('/api/cloud-backup/history?limit=5')
        .then((r) => r.json())
        .then((hist: { runs?: typeof backupHistory }) => setBackupHistory(hist.runs ?? []));
    } else {
      setEodMsg(j.message ?? 'Yedek alınamadı');
      window.open('/api/reports/export?format=csv', '_blank');
    }
    setEodBusy(false);
  }

  if (active === 'archive') {
    return (
      <EodLegacyReportWorkspace businessDate={businessDate} archive={eodArchive} />
    );
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
          <p className="roomio-page-desc">
            Veritabanı + gün sonu GR arşivi paketlenir; Google Drive, S3 veya webhook ile buluta gönderilir.
          </p>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button disabled={eodBusy} onClick={() => void runBackup()}>Yedek al</Button>
            <Button variant="secondary" href="/settings/integrations/cloud-backup">Bulut yedek ayarları</Button>
          </div>
          {backupHistory.length > 0 ? (
            <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
              <table className="roomio-table">
                <thead><tr><th>Tarih</th><th>Sağlayıcı</th><th>Durum</th><th>Boyut</th><th></th></tr></thead>
                <tbody>
                  {backupHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{h.startedAt}</td>
                      <td>{h.provider}</td>
                      <td>{h.status}</td>
                      <td>{h.sizeBytes ? `${Math.round(h.sizeBytes / 1024)} KB` : '—'}</td>
                      <td>
                        {h.status === 'ok' ? (
                          <a className="roomio-link" href={`/api/cloud-backup/download?runId=${encodeURIComponent(h.id)}`}>İndir</a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
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
                      {r.id === 'pkg-gr' ? (
                        <Button
                          variant="secondary"
                          disabled={r.status !== 'ready'}
                          href={`/api/eod/gr-package?businessDate=${encodeURIComponent(businessDate)}&format=txt`}
                        >
                          TXT
                        </Button>
                      ) : r.id === 'pkg-audit' ? (
                        <Button
                          variant="secondary"
                          disabled={r.status !== 'ready'}
                          href={`/api/eod/night-audit-package?businessDate=${encodeURIComponent(businessDate)}&format=pdf`}
                        >
                          PDF
                        </Button>
                      ) : r.id.startsWith('gr-') && r.id !== 'pkg-gr-more' ? (
                        <Button
                          variant="secondary"
                          href={`/reports?tab=eod&action=archive&rpr=${encodeURIComponent(r.id.replace(/^gr-/, ''))}&date=${encodeURIComponent(businessDate)}`}
                        >
                          Aç
                        </Button>
                      ) : r.id === 'pkg-gr-more' ? (
                        <Button variant="secondary" href={`/reports?tab=eod&action=archive&date=${encodeURIComponent(businessDate)}`}>
                          Arşiv
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled>
                          —
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button disabled={eodBusy} onClick={() => void fetchAllReports()}>Tüm raporları al</Button>
            <Button variant="secondary" href="/reports?tab=eod&action=archive">GR arşivi</Button>
            <Button variant="secondary" href="/reports?tab=eod&action=close">Günü kapat</Button>
            <Button variant="ghost" href={`/api/eod/gr-package?businessDate=${encodeURIComponent(businessDate)}&format=txt`}>GR TXT paket</Button>
            <Button variant="ghost" href={`/api/eod/night-audit-package?businessDate=${encodeURIComponent(businessDate)}&format=pdf`}>Denetim PDF</Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
