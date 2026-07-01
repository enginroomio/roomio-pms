'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Minus, Plus, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';
import type { MenuItem } from '@/lib/integrations/digital-menu/types';
import type { RoomServiceOrder } from '@/lib/integrations/room-service/types';

type MenuResponse = {
  ok: boolean;
  hotelName?: string;
  categories?: Record<string, MenuItem[]>;
  message?: string;
};

type BookResponse = {
  ok: boolean;
  message: string;
  order?: RoomServiceOrder;
};

function RoomServiceOrderForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [categories, setCategories] = useState<Record<string, MenuItem[]>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookResponse | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/digital-menu/menu')
      .then((r) => r.json())
      .then((j: MenuResponse) => {
        if (j.ok && j.categories) setCategories(j.categories);
      })
      .catch(() => undefined);
  }, []);

  const catalog = useMemo(() => Object.values(categories).flat(), [categories]);

  function setQty(item: MenuItem, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[item.id];
      else next[item.id] = Math.min(qty, 20);
      return next;
    });
  }

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: catalog.find((m) => m.id === id), qty }))
        .filter((l): l is { item: MenuItem; qty: number } => !!l.item),
    [cart, catalog],
  );
  const total = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const currency = lines[0]?.item.currency ?? 'TRY';

  async function submit() {
    if (!token) {
      setError('Geçersiz bağlantı — lütfen misafir portalı üzerinden tekrar deneyin.');
      return;
    }
    if (!lines.length) {
      setError('Sepetinize en az bir ürün ekleyin.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch('/api/integrations/room-service/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        items: lines.map((l) => ({ menuItemId: l.item.id, qty: l.qty })),
        notes,
      }),
    });
    const j = (await res.json()) as BookResponse;
    setLoading(false);
    if (!j.ok) {
      setError(j.message);
      return;
    }
    setResult(j);
    setCart({});
  }

  if (result?.ok) {
    return (
      <div className="roomio-public-portal">
        <div className="roomio-public-portal__card roomio-public-portal__card--wide">
          <div className="roomio-public-portal__success">
            <h2>Siparişiniz Alındı</h2>
            <p>{result.message}</p>
            {result.order ? (
              <p>
                <strong>Oda:</strong> {result.order.roomNo} · <strong>Toplam:</strong> {result.order.totalAmount}{' '}
                {result.order.currency}
              </p>
            ) : null}
            <button className="roomio-btn roomio-btn--secondary" type="button" onClick={() => setResult(null)}>
              Yeni sipariş ver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <UtensilsCrossed size={28} />
          <div>
            <strong>{PROPERTY.name}</strong>
            <span>Oda Servisi</span>
          </div>
        </div>

        {!token ? (
          <p className="roomio-public-portal__error">
            Bu sayfaya misafir portalındaki bağlantı üzerinden ulaşmalısınız.
          </p>
        ) : null}

        {!catalog.length ? (
          <p className="roomio-page-desc">Menü yükleniyor…</p>
        ) : (
          Object.entries(categories).map(([cat, items]) => (
            <div key={cat} className="roomio-card" style={{ marginTop: 12 }}>
              <p className="roomio-card-title">{cat}</p>
              <div className="roomio-table-wrap">
                <table className="roomio-table">
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.description ? (
                            <div className="roomio-page-desc">{item.description}</div>
                          ) : null}
                        </td>
                        <td>{item.price} {item.currency}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              className="roomio-btn roomio-btn--secondary roomio-btn--sm"
                              type="button"
                              onClick={() => setQty(item, (cart[item.id] ?? 0) - 1)}
                              disabled={!cart[item.id]}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{cart[item.id] ?? 0}</span>
                            <button
                              className="roomio-btn roomio-btn--secondary roomio-btn--sm"
                              type="button"
                              onClick={() => setQty(item, (cart[item.id] ?? 0) + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        <label className="roomio-field" style={{ marginTop: 12 }}>
          <span>Not (opsiyonel)</span>
          <input className="roomio-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Örn: Az baharatlı olsun" />
        </label>

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}

        <div className="roomio-form-actions--spaced" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span className="roomio-page-desc">
            <ShoppingCart size={14} style={{ verticalAlign: 'middle' }} /> {lines.length} ürün · Toplam {total} {currency}
          </span>
          <button className="roomio-btn roomio-btn--primary" type="button" onClick={() => void submit()} disabled={loading || !token}>
            {loading ? 'Gönderiliyor…' : 'Siparişi Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestRoomServicePage() {
  return (
    <Suspense fallback={<div className="roomio-public-portal"><p>Yükleniyor…</p></div>}>
      <RoomServiceOrderForm />
    </Suspense>
  );
}
