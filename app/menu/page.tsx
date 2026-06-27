'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import type { DigitalMenuConfig } from '@/lib/integrations/digital-menu/types';

type MenuData = {
  ok: boolean;
  hotelName: string;
  categories: Record<string, DigitalMenuConfig['items']>;
};

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/digital-menu/menu')
      .then((r) => r.json())
      .then((j: MenuData) => {
        if (!j.ok) setError('Dijital menü şu an kullanılamıyor');
        else setMenu(j);
      })
      .catch(() => setError('Menü yüklenemedi'));
  }, []);

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <UtensilsCrossed size={28} />
          <div>
            <strong>{menu?.hotelName ?? 'Dijital Menü'}</strong>
            <span>QR masa menüsü</span>
          </div>
        </div>

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}

        {menu?.categories ? Object.entries(menu.categories).map(([category, items]) => (
          <section key={category} style={{ marginTop: 20 }}>
            <h2 className="roomio-card-title">{category}</h2>
            <div className="roomio-public-portal__stack">
              {items.map((item) => (
                <div key={item.id} className="roomio-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{item.name}</strong>
                    {item.description ? <p className="roomio-page-desc">{item.description}</p> : null}
                    {item.allergens ? <p className="roomio-page-desc">Alerjen: {item.allergens}</p> : null}
                  </div>
                  <strong>{item.price} {item.currency}</strong>
                </div>
              ))}
            </div>
          </section>
        )) : !error ? <p>Yükleniyor…</p> : null}

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          <Link href="/book">Oda rezervasyonu</Link>
        </p>
      </div>
    </div>
  );
}
