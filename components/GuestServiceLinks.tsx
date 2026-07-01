import Link from 'next/link';
import type { GuestServiceKey, GuestServiceLinksConfig } from '@/lib/guest-portal/types';

const GUEST_SERVICES: ReadonlyArray<{ key: GuestServiceKey; href: string; label: string }> = [
  { key: 'restaurant', href: '/restaurant', label: 'Restoran rezervasyonu' },
  { key: 'roomService', href: '/guest/room-service', label: 'Oda servisi siparişi' },
  { key: 'carbon', href: '/carbon', label: 'Karbon dengeleme' },
  { key: 'spa', href: '/spa', label: 'SPA & Wellness' },
  { key: 'gym', href: '/gym', label: 'Spor salonu' },
  { key: 'fair', href: '/fair', label: 'Fuar & etkinlik' },
  { key: 'hotel', href: '/hotel', label: 'Otel web sitesi' },
  { key: 'viofun', href: '/viofun', label: 'Aktiviteler' },
  { key: 'menu', href: '/menu', label: 'Dijital menü' },
];

type Props = {
  title?: string;
  /** Hangi hizmetlerin görüneceği — otel admin panelinden kapatılan ekranlar listede çıkar. Verilmezse tümü gösterilir. */
  enabled?: Partial<GuestServiceLinksConfig>;
  /** Oda servisi siparişi verirken misafir token'ı linke eklenir (kimlik doğrulama için). */
  token?: string;
};

export function GuestServiceLinks({ title = 'Otel hizmetleri', enabled, token }: Props) {
  const visible = GUEST_SERVICES.filter((s) => enabled?.[s.key] !== false);
  if (!visible.length) return null;

  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--roomio-border, #e5e7eb)' }}>
      <p className="roomio-card-title">{title}</p>
      <div className="roomio-form-actions--spaced" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {visible.map((s) => {
          const href = s.key === 'roomService' && token ? `${s.href}?token=${encodeURIComponent(token)}` : s.href;
          return (
            <Link key={s.href} className="roomio-btn roomio-btn--secondary roomio-btn--sm" href={href}>
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
