'use client';

import Link from 'next/link';

export type SistemReportTabId = 'hub' | 'design' | 'forms' | 'user' | 'special' | 'daily' | 'management';

const TABS: { id: SistemReportTabId; label: string; href: string }[] = [
  { id: 'hub', label: 'Raporlama Programı', href: '/reports' },
  { id: 'design', label: 'Rapor Tasarım', href: '/reports?tab=design' },
  { id: 'forms', label: 'Form Tasarım', href: '/reports?tab=forms' },
  { id: 'user', label: 'Kullanıcı Raporları', href: '/reports?tab=user' },
  { id: 'special', label: 'Özel Raporlar', href: '/reports?tab=special' },
  { id: 'daily', label: 'Günlük Raporlar', href: '/reports?tab=daily' },
  { id: 'management', label: 'Yönetim Raporları', href: '/reports?tab=management' },
];

type Props = {
  active: SistemReportTabId;
};

/** SİSTEM › Raporla alt ekranları — tutarlı sekme çubuğu */
export function SistemReportTabs({ active }: Props) {
  return (
    <nav className="roomio-tabs" aria-label="Rapor modülleri">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`roomio-tab${active === tab.id ? ' is-active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
