import Link from 'next/link';

const GUEST_SERVICES = [
  { href: '/restaurant', label: 'Restoran rezervasyonu' },
  { href: '/carbon', label: 'Karbon dengeleme' },
  { href: '/spa', label: 'SPA & Wellness' },
  { href: '/gym', label: 'Spor salonu' },
  { href: '/fair', label: 'Fuar & etkinlik' },
  { href: '/hotel', label: 'Otel web sitesi' },
  { href: '/viofun', label: 'Aktiviteler' },
  { href: '/menu', label: 'Dijital menü' },
] as const;

export function GuestServiceLinks({ title = 'Otel hizmetleri' }: { title?: string }) {
  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--roomio-border, #e5e7eb)' }}>
      <p className="roomio-card-title">{title}</p>
      <div className="roomio-form-actions--spaced" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {GUEST_SERVICES.map((s) => (
          <Link key={s.href} className="roomio-btn roomio-btn--secondary roomio-btn--sm" href={s.href}>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
