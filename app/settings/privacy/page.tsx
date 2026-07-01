'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { AyarlarModuleShell } from '@/components/settings/AyarlarModuleShell';
import { roomioFetch } from '@/lib/client/api';
import { appendAudit, maskEmail, maskPhone } from '@/lib/kvkk';

type AuditRow = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  user: string;
  detail?: string;
};

function PrivacyPageInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const activeTab = tab === 'sql' ? 'sql' : 'kvkk';
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/audit?limit=80');
      const j = (await res.json()) as { logs?: AuditRow[] };
      setLogs(j.logs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sql') void loadLogs();
  }, [activeTab, loadLogs]);

  function requestExport() {
    appendAudit({ user: 'Yakup K.', action: 'export_data', resource: 'guest_data', success: true });
    alert('KVKK veri talebi kaydedildi. 30 gün içinde yanıt (demo).');
  }

  function requestDelete() {
    appendAudit({ user: 'Yakup K.', action: 'delete_request', resource: 'guest_data', success: true });
    alert('Silme/anonymize talebi kaydedildi (demo).');
  }

  const tabs = (
    <nav className="roomio-tabs" style={{ marginBottom: 16 }}>
      <Link href="/settings/privacy" className={`roomio-tab${activeTab === 'kvkk' ? ' is-active' : ''}`}>KVKK & Gizlilik</Link>
      <Link href="/settings/privacy?tab=sql" className={`roomio-tab${activeTab === 'sql' ? ' is-active' : ''}`}>Kayıt İzleme</Link>
      <Link href="/reports?tab=eod&action=audit" className="roomio-tab">Gece denetim</Link>
    </nav>
  );

  if (activeTab === 'sql') {
    return (
      <AyarlarModuleShell
        segment="Kayıt İzleme"
        title="Kayıt İzleme (Audit Log)"
        description="Sistem işlemleri ve SQL mesaj günlüğü — son 80 kayıt"
        actions={
          <Button variant="secondary" onClick={() => void loadLogs()} disabled={loading}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        }
      >
        {tabs}
        <div className="roomio-card roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Modül</th>
                <th>İşlem</th>
                <th>Kullanıcı</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Yükleniyor…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5}>Kayıt yok</td></tr>
              ) : logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{row.module}</td>
                  <td><strong>{row.action}</strong></td>
                  <td>{row.user}</td>
                  <td>{row.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AyarlarModuleShell>
    );
  }

  return (
    <AyarlarModuleShell
      segment="Gizlilik"
      title="Gizlilik & Veri Talepleri"
      description="KVKK md. 11 — ilgili kişi hakları"
    >
      {tabs}
      <div className="roomio-card">
        <h2 className="roomio-card-title">PII Maskeleme Örneği</h2>
        <dl className="roomio-dl">
          <dt>E-posta</dt><dd>{maskEmail('ayse.yilmaz@email.com')}</dd>
          <dt>Telefon</dt><dd>{maskPhone('+90 532 111 2233')}</dd>
        </dl>
      </div>

      <div className="roomio-form-actions" style={{ marginTop: 20 }}>
        <Button onClick={requestExport}>Verilerimi İndir (talep)</Button>
        <Button variant="secondary" onClick={requestDelete}>Verilerimi Sil (talep)</Button>
      </div>
    </AyarlarModuleShell>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <PrivacyPageInner />
    </Suspense>
  );
}
