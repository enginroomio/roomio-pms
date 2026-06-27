'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const LINKS = [
  { label: 'Yeni Fatura', href: '/accounting?tab=invoices&new=1', desc: 'Konaklama / ekstra fatura oluştur' },
  { label: 'Fatura Listesi', href: '/accounting?tab=invoices', desc: 'Kesilmiş faturalar ve düzenleme' },
  { label: 'Proforma Listesi', href: '/accounting?tab=proforma', desc: 'Taslak ve onay bekleyen proformalar' },
  { label: 'Acenta Kontratları', href: '/settings?section=agencies', desc: 'Acenta ve fiyat anlaşmaları' },
  { label: 'Fiyat Kodları', href: '/settings?section=rate-plans', desc: 'Rate plan ve BAR tarifeleri' },
  { label: 'Tekrarlayan Misafir', href: '/guest-relations/repeat-guests', desc: 'Sadakat ve segmentasyon' },
  { label: 'Cari Kartlar', href: '/accounting?tab=cari', desc: 'Şirket / acenta cari bakiyeleri' },
  { label: 'Cari Ödemeler', href: '/accounting?tab=cari-payments', desc: 'Tahsilat ve ödeme hareketleri' },
  { label: 'Kasa — Banka', href: '/accounting?tab=bank-cards', desc: 'Açık kasalar ve banka hesapları' },
  { label: 'Ürün Kartları', href: '/settings?section=inventory', desc: 'Stok SKU ve min/max seviyeler' },
  { label: 'POS İndirimleri', href: '/fnb?tab=discounts', desc: 'Restoran indirim kodları' },
  { label: 'Bütçe Girişleri', href: '/accounting?tab=budget', desc: 'Aylık bütçe satırları' },
  { label: 'Yönetim Raporları', href: '/reports?tab=management', desc: 'Özet KPI ve departman gelirleri' },
  { label: 'Rapor Hazırlama', href: '/reports?tab=prepare', desc: 'Küp, doluluk ve 3 yıllık analiz' },
  { label: 'Kredi Kontrol', href: '/reports?report=kredi-kontrol', desc: 'Acenta limit aşım listesi' },
  { label: 'Günlük Maliye', href: '/reports?report=gunluk-maliye', desc: 'Kasa ve döviz özeti' },
  { label: 'Günlük Balanslar', href: '/reports?report=gunluk-balans', desc: 'Konaklayan folyo bakiyeleri' },
] as const;

export function ArkaBuroHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Arka büro merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Fatura, cari, bütçe, acenta kontratları ve yönetim raporları — Elektra ARKA BÜRO menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/accounting?tab=invoices&new=1">+ Yeni fatura</Button>
          <Button variant="ghost" href="/settings?section=agencies">Acentalar</Button>
          <Button variant="ghost" href="/accounting?tab=ledger">Cari defter</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
