'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';

const SISTEM_LINKS = [
  { label: 'Kuruluş', href: '/settings', desc: 'Otel bilgileri ve tanımlar' },
  { label: 'Rapor Tasarım', href: '/reports?tab=design', desc: 'Kullanıcı tanımlı rapor şablonları' },
  { label: 'Raporla', href: '/reports', desc: 'Raporlama programı' },
  { label: 'Form Tasarım', href: '/reports?tab=forms', desc: 'Form ve sayfa şablonları' },
  { label: 'Kullanıcı Raporları', href: '/reports?tab=user', desc: 'Kayıtlı özel raporlar' },
  { label: 'Servis Programları', href: '/settings/integrations', desc: 'Entegrasyon merkezi' },
  { label: '5651 Hotspot', href: '/settings/compliance/5651', desc: 'Hotspot loglama uyumu' },
  { label: 'TESA Kapı', href: '/settings/integrations/tesa', desc: 'Kart kilit entegrasyonu' },
  { label: 'Grandstream Santral', href: '/settings/integrations/pbx', desc: 'PBX / UCM6301' },
  { label: 'Dil Tanımları', href: '/settings?section=language', desc: 'Çoklu dil metinleri' },
  { label: 'SQL / Kayıt İzleme', href: '/tools/sistem?tab=sql', desc: 'Audit log' },
  { label: 'Production Deploy', href: '/tools/deploy', desc: 'Canlıya alma hub' },
  { label: 'Rollout Test', href: '/tools/rollout?phase=sistem', desc: 'Menü doğrulama' },
  { label: 'Lisanslama', href: '/settings/licensing', desc: 'Modül lisansları' },
];

export function SistemOperationsHub() {
  return (
    <div className="roomio-detail-grid">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Sistem İşlemleri</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Kuruluş, raporlama, entegrasyonlar ve sistem araçları.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/settings">Kuruluş ekranı</Button>
          <Button variant="secondary" href="/settings/integrations">Entegrasyonlar</Button>
          <Button variant="ghost" href="/reports?tab=design">Rapor tasarım</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {SISTEM_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SqlMessagePanel() {
  type AuditRow = {
    id: string;
    createdAt: string;
    module: string;
    action: string;
    user: string;
    detail?: string;
  };

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
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="roomio-card" style={{ marginTop: 16, padding: 20 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">SQL Mesaj / Kayıt İzleme</h2>
        <Button variant="secondary" onClick={() => void loadLogs()} disabled={loading}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        Sistem işlemleri ve uygulama mesaj günlüğü — son 80 kayıt.
      </p>
      <div className="roomio-form-actions" style={{ marginTop: 12 }}>
        <Button href="/settings/privacy?tab=sql">KVKK kayıt ekranı</Button>
        <Button variant="secondary" href="/reports?tab=eod&action=audit">Gece denetim izi</Button>
      </div>
      <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
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
              <tr><td colSpan={5}>Kayıt yok.</td></tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{row.module}</td>
                  <td><strong>{row.action}</strong></td>
                  <td>{row.user}</td>
                  <td>{row.detail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
