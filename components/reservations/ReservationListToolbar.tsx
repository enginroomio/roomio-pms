'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  selectedId?: string | null;
  onRefresh?: () => void;
};

const TOOLBAR = [
  { id: 'add', label: 'Ekle', href: '/reservations/new', primary: true },
  { id: 'refresh', label: 'Yenile', action: 'refresh' as const },
  { id: 'show', label: 'Göster', action: 'show' as const },
  { id: 'delete', label: 'Sil', action: 'delete' as const, disabled: true },
  { id: 'copy', label: 'Çoğalt', action: 'copy' as const, disabled: true },
  { id: 'docs', label: 'Belgeler', href: '/reports?tab=forms' },
  { id: 'print', label: 'Yazdır', href: '/api/reports/export?format=pdf' },
  { id: 'send', label: 'Gönder', href: '/guest-relations' },
  { id: 'tools', label: 'Araçlar', href: '/tools/rollout?phase=rezervasyon' },
];

export function ReservationListToolbar({ selectedId, onRefresh }: Props) {
  const router = useRouter();

  function onAction(action: 'refresh' | 'show' | 'delete' | 'copy') {
    if (action === 'refresh') {
      onRefresh?.();
      router.refresh();
      return;
    }
    if (action === 'show' && selectedId) {
      router.push(`/reservations/${selectedId}/edit`);
    }
  }

  return (
    <div className="roomio-rez-pro__toolbar" role="toolbar" aria-label="Rezervasyon listesi araçları">
      {TOOLBAR.map((item) => {
        if ('href' in item && item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`roomio-btn roomio-btn--sm${'primary' in item && item.primary ? ' roomio-btn--primary' : ' roomio-btn--secondary'}`}
            >
              {item.label}
            </Link>
          );
        }
        const disabled =
          item.disabled ||
          (item.action === 'show' && !selectedId);
        return (
          <button
            key={item.id}
            type="button"
            className="roomio-btn roomio-btn--secondary roomio-btn--sm"
            disabled={disabled}
            onClick={() => item.action && onAction(item.action)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
