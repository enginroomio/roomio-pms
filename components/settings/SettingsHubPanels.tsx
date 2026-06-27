'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';

const AYARLAR_LINKS = [
  { label: 'Şifre Değiştir', href: '/settings?tab=password', desc: 'Hesap güvenliği' },
  { label: 'Tema Seç', href: '/settings?tab=theme', desc: 'Standart, koyu veya klasik' },
  { label: 'Tema Sabitle', href: '/settings?tab=theme&fixed=1', desc: 'Kullanıcı tema değiştiremez' },
  { label: 'Hesap Makinesi', href: '/settings?tool=calculator', desc: 'Hızlı hesaplama aracı' },
  { label: 'Mesajlaşma', href: '/guest-relations?tab=messages', desc: 'CRM mesaj kutusu' },
  { label: 'Adres Rehberi', href: '/guest-relations?tab=directory', desc: 'İç hat ve acil numaralar' },
  { label: 'Not Al', href: '/guest-relations/traces?action=new-note', desc: 'Yeni misafir notu' },
  { label: 'Sarı Notlar', href: '/guest-relations/traces?type=yellow', desc: 'Öncelikli notlar' },
  { label: 'İş Takip', href: '/housekeeping/tasks', desc: 'HK görev listesi' },
  { label: 'Santral', href: '/settings/integrations/pbx', desc: 'PBX entegrasyonu' },
  { label: 'Kayıt İzleme', href: '/tools/sistem?tab=sql', desc: 'Audit log' },
  { label: 'KVKK', href: '/settings/privacy', desc: 'Veri talepleri' },
  { label: 'Lisanslama', href: '/settings/licensing', desc: 'Modül lisansları' },
  { label: 'Kapı Entegrasyonu', href: '/settings/integrations/tesa', desc: 'TESA kilit sistemi' },
  { label: 'Entegrasyonlar', href: '/settings/integrations', desc: 'Tüm modül bağlantıları' },
  { label: 'Kuruluş', href: '/settings?section=config', desc: 'Otel tanımları' },
];

export function SettingsAyalarHub() {
  const { user, logout } = useSession();

  return (
    <div className="roomio-detail-grid" style={{ marginBottom: 20 }}>
      <div className="roomio-card">
        <h2 className="roomio-card-title">Ayarlar Kısayolları</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          {user ? `Oturum: ${user.name}` : 'Sisteme giriş yapılmadı'}
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/settings?tab=password">Şifre</Button>
          <Button variant="ghost" onClick={() => void logout()}>Çıkış</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {AYARLAR_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function evalCalc(expr: string): string {
  const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
  if (!sanitized.trim()) return '';
  try {
    const val = Function(`"use strict"; return (${sanitized})`)() as number;
    if (typeof val !== 'number' || !Number.isFinite(val)) return 'Hata';
    return String(Math.round(val * 10000) / 10000);
  } catch {
    return 'Hata';
  }
}

export function CalculatorToolPanel() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const calculate = useCallback(() => {
    const out = evalCalc(expr);
    setResult(out);
    if (out && out !== 'Hata') {
      setHistory((prev) => [`${expr} = ${out}`, ...prev].slice(0, 8));
    }
  }, [expr]);

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'];

  function onKey(k: string) {
    if (k === 'C') {
      setExpr('');
      setResult(null);
      return;
    }
    if (k === '=') {
      calculate();
      return;
    }
    setExpr((prev) => prev + k);
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16, maxWidth: 420, padding: 20 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Hesap Makinesi</h2>
        <Button variant="ghost" href="/settings">← Ayarlar</Button>
      </div>
      <input
        className="roomio-input"
        style={{ width: '100%', marginTop: 12, fontSize: '1.25rem', textAlign: 'right' }}
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') calculate(); }}
        placeholder="0"
        aria-label="Hesap ifadesi"
      />
      {result ? (
        <p className="roomio-page-desc" style={{ textAlign: 'right', marginTop: 8, fontSize: '1.1rem' }}>
          = <strong>{result}</strong>
        </p>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginTop: 16,
        }}
      >
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            className="roomio-btn roomio-btn--secondary"
            style={{ padding: '12px 0' }}
            onClick={() => onKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <Button style={{ width: '100%', marginTop: 12 }} onClick={calculate}>Hesapla</Button>
      {history.length > 0 ? (
        <ul className="roomio-page-desc" style={{ marginTop: 16 }}>
          {history.map((h) => <li key={h}>{h}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

const TESA_MODULES = [
  { id: 'door', name: 'Kapı / Kart Kilidi', status: 'active', href: '/settings/integrations/tesa' },
  { id: 'minibar', name: 'Minibar', status: 'active', href: '/settings/integrations/inventory' },
  { id: 'paytv', name: 'Pay TV', status: 'optional', href: '/settings/integrations/tesa?tab=modules' },
  { id: 'safe', name: 'Kasa (Safe)', status: 'optional', href: '/settings/integrations/tesa?tab=modules' },
  { id: 'energy', name: 'Enerji Yönetimi', status: 'active', href: '/reports?report=enerji' },
  { id: 'pbx', name: 'Santral (PBX)', status: 'active', href: '/settings/integrations/pbx' },
  { id: 'id-reader', name: 'Kimlik Okuyucu', status: 'active', href: '/settings/integrations/id-reader' },
  { id: 'kiosk', name: 'Self Check-in Kiosk', status: 'active', href: '/settings/integrations/kiosk' },
];

export function TesaModulesPanel() {
  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Ek Modüller (TESA)</h2>
        <Button variant="ghost" href="/settings/integrations/tesa">Kapı ayarları</Button>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        TESA Hospitality ile entegre opsiyonel modüller ve durumları.
      </p>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Modül</th><th>Durum</th><th /></tr>
        </thead>
        <tbody>
          {TESA_MODULES.map((m) => (
            <tr key={m.id}>
              <td><strong>{m.name}</strong></td>
              <td>
                <span className={`roomio-badge${m.status === 'active' ? ' roomio-badge--ok' : ''}`}>
                  {m.status === 'active' ? 'Aktif' : 'Opsiyonel'}
                </span>
              </td>
              <td><Button variant="ghost" href={m.href}>Aç</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
