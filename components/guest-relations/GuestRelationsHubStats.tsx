'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

type Stats = {
  businessDate: string;
  inHouse: number;
  openTraces: number;
  openComplaints: number;
  pendingReviews: number;
  openLostFound: number;
  openReclamations: number;
};

const TILES: { key: keyof Stats; label: string; href: string; warn?: boolean }[] = [
  { key: 'inHouse', label: 'Konaklayan', href: '/guest-relations/inhouse' },
  { key: 'openTraces', label: 'Açık trace', href: '/guest-relations/traces', warn: true },
  { key: 'openComplaints', label: 'Açık şikayet', href: '/guest-relations/complaints', warn: true },
  { key: 'pendingReviews', label: 'Bekleyen yorum', href: '/guest-relations/reviews', warn: true },
  { key: 'openLostFound', label: 'Kayıp/buluntu', href: '/guest-relations/lost-found', warn: true },
  { key: 'openReclamations', label: 'Reklamasyon', href: '/guest-relations/reclamations', warn: true },
];

export function GuestRelationsHubStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void roomioFetch('/api/guest-activities?view=stats')
      .then((r) => r.json())
      .then((j: { stats?: Stats }) => setStats(j.stats ?? null));
  }, []);

  return (
    <div className="roomio-card" style={{ marginBottom: 16 }}>
      <p className="roomio-page-desc" style={{ padding: '12px 16px 0' }}>
        Operasyon özeti {stats?.businessDate ? `· iş günü ${stats.businessDate}` : ''}
      </p>
      <div className="roomio-kpi-grid" style={{ padding: 16 }}>
        {TILES.map((tile) => {
          const value = stats ? Number(stats[tile.key]) : 0;
          const highlight = tile.warn && value > 0;
          return (
            <Link key={tile.key} href={tile.href} className="roomio-kpi roomio-kpi--link">
              <span className="roomio-kpi-label">{tile.label}</span>
              <strong className={`roomio-kpi-value${highlight ? ' roomio-text-warn' : ''}`}>{stats ? value : '…'}</strong>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
