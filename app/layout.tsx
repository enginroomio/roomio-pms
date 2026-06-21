import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/AppShell';
import { RoomioProviders } from '@/components/RoomioProviders';
import './globals.css';
import './polish.css';

export const metadata: Metadata = {
  title: 'Roomio — Hotel PMS',
  description: 'Modern otel yönetim sistemi — çevrimdışı destekli, KVKK uyumlu',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Roomio HK' },
  icons: {
    icon: [{ url: '/icons/icon-192.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-192.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#1a6b4a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <RoomioProviders>
          <AppShell>{children}</AppShell>
        </RoomioProviders>
      </body>
    </html>
  );
}
