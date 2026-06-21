'use client';

import Link from 'next/link';

const ACTIONS = [
  { key: 'F1', label: 'Grafikler', href: '/reservations/calendar' },
  { key: 'F2', label: 'Yeni Rezervasyon', href: '/reservations/new', primary: true },
  { key: 'F3', label: 'Düzenle', href: '/reservations' },
  { key: 'F4', label: 'Oda Planı', href: '/reservations?tab=availability' },
  { key: 'F5', label: 'Fiyat Gör', href: '/reports?category=rezervasyon' },
  { key: 'F6', label: 'Misafir Değiştir', href: '/reception/inhouse' },
  { key: 'F7', label: 'Not Ekle', href: '/guest-relations/traces' },
  { key: 'F8', label: 'Yazdır', href: '/api/reports/export?format=pdf' },
  { key: 'F9', label: 'E-Posta', href: '/guest-relations' },
  { key: 'F10', label: 'Diğer', href: '/tools/rollout?phase=rezervasyon' },
] as const;

export function ReservationFnBar() {
  return (
    <div className="roomio-rez-fnbar" role="toolbar" aria-label="Rezervasyon kısayolları">
      {ACTIONS.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className={`roomio-rez-fnbar__btn${'primary' in action && action.primary ? ' is-primary' : ''}`}
          title={`${action.label} (${action.key})`}
        >
          <kbd>{action.key}</kbd>
          <span>{action.label}</span>
        </Link>
      ))}
      <span className="roomio-rez-fnbar__esc">ESC · Kapat</span>
    </div>
  );
}
