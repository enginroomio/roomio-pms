'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/cash';
import { BANKET_HALLS } from '@/lib/data/banket';
import type { BanketReservation } from '@/lib/data/banket';
import { roomioFetch } from '@/lib/client/api';

export function BanketCalendarPanel() {
  const [events, setEvents] = useState<BanketReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/fnb/banket');
      const j = (await res.json()) as { events?: BanketReservation[] };
      setEvents(j.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, BanketReservation[]>();
    for (const e of events.filter((x) => x.status !== 'cancelled')) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Banket Ajanda</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
        </div>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{events.length} etkinlik</span>
          <span className="roomio-badge">{byDate.length} gün</span>
        </div>
      </div>

      {loading ? (
        <p className="roomio-page-desc">Yükleniyor…</p>
      ) : byDate.length === 0 ? (
        <p className="roomio-page-desc">Ajandada etkinlik yok.</p>
      ) : byDate.map(([date, items]) => (
        <div key={date} className="roomio-card" style={{ padding: 16 }}>
          <h3 className="roomio-card-title">{date}</h3>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Saat</th><th>Etkinlik</th><th>Salon</th><th>Kişi</th><th>İletişim</th><th>Gelir</th><th>Durum</th></tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td>{e.startTime}–{e.endTime}</td>
                  <td><strong>{e.eventName}</strong></td>
                  <td>{e.hall}</td>
                  <td>{e.pax}</td>
                  <td>{e.contact}</td>
                  <td>{formatMoney(e.revenue)}</td>
                  <td><span className="roomio-badge">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export function BanketAgreementsPanel() {
  const [events, setEvents] = useState<BanketReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void roomioFetch('/api/fnb/banket')
      .then((r) => r.json())
      .then((j: { events?: BanketReservation[] }) => setEvents(j.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  const agreements = events.filter((e) => e.status === 'confirmed' || e.status === 'option');

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Banket Anlaşmaları</h2>
        <Link href="/fnb" className="roomio-btn roomio-btn--ghost">+ Yeni rezervasyon</Link>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Etkinlik</th><th>Salon</th><th>Tarih</th><th>Saat</th><th>Kişi</th>
            <th>Müşteri</th><th>Anlaşma tutarı</th><th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8}>Yükleniyor…</td></tr>
          ) : agreements.length === 0 ? (
            <tr><td colSpan={8} className="roomio-table-empty">Anlaşma kaydı yok.</td></tr>
          ) : agreements.map((e) => (
            <tr key={e.id}>
              <td><strong>{e.eventName}</strong></td>
              <td>{e.hall}</td>
              <td>{e.date}</td>
              <td>{e.startTime}–{e.endTime}</td>
              <td>{e.pax}</td>
              <td>{e.contact}</td>
              <td>{formatMoney(e.revenue)}</td>
              <td>
                <span className={`roomio-badge${e.status === 'confirmed' ? ' roomio-badge--ok' : ''}`}>
                  {e.status === 'confirmed' ? 'Onaylı' : 'Opsiyon'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useBanketEvents() {
  const [events, setEvents] = useState<BanketReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/fnb/banket');
      const j = (await res.json()) as { events?: BanketReservation[] };
      setEvents(j.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, reload: load };
}

export function BanketOccupancyReportPanel() {
  const { events, loading, reload } = useBanketEvents();

  const hallStats = useMemo(() => {
    return BANKET_HALLS.map((hall) => {
      const booked = events.filter((e) => e.hall === hall && e.status !== 'cancelled');
      const capacity = hall.includes('Ballroom') ? 280 : hall.includes('Teras') ? 120 : 80;
      const pax = booked.reduce((s, e) => s + e.pax, 0);
      return { hall, capacity, events: booked.length, pax, utilization: capacity > 0 ? Math.round((pax / capacity) * 100) : 0 };
    });
  }, [events]);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Salon Doluluk Raporu</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void reload()}>Yenile</Button>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="ghost" href="/fnb?tab=calendar">Ajanda</Button>
          <Button variant="ghost" href="/fnb">Banket rezervasyon</Button>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Salon</th><th>Kapasite</th><th>Etkinlik</th><th>Toplam kişi</th><th>Doluluk %</th></tr>
          </thead>
          <tbody>
            {hallStats.map((h) => (
              <tr key={h.hall}>
                <td><strong>{h.hall}</strong></td>
                <td>{h.capacity}</td>
                <td>{h.events}</td>
                <td>{h.pax}</td>
                <td className={h.utilization > 85 ? 'roomio-text-warn' : ''}>{h.utilization}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BanketRevenueReportPanel() {
  const { events, loading, reload } = useBanketEvents();

  const confirmed = events.filter((e) => e.status === 'confirmed');
  const option = events.filter((e) => e.status === 'option');
  const totalConfirmed = confirmed.reduce((s, e) => s + e.revenue, 0);
  const totalOption = option.reduce((s, e) => s + e.revenue, 0);

  const byHall = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of confirmed) {
      map.set(e.hall, (map.get(e.hall) ?? 0) + e.revenue);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [confirmed]);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Etkinlik Gelir Raporu</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void reload()}>Yenile</Button>
        </div>
        <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Onaylı gelir</span><strong className="roomio-kpi-value">{formatMoney(totalConfirmed)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Opsiyon pipeline</span><strong className="roomio-kpi-value">{formatMoney(totalOption)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Onaylı etkinlik</span><strong className="roomio-kpi-value">{confirmed.length}</strong></div>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/reports/export?format=csv&module=banket">CSV indir</Button>
          <Button variant="ghost" href="/fnb?tab=agreements">Anlaşmalar</Button>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead><tr><th>Salon</th><th>Onaylı gelir</th></tr></thead>
          <tbody>
            {byHall.length === 0 ? (
              <tr><td colSpan={2} className="roomio-table-empty">Gelir kaydı yok.</td></tr>
            ) : byHall.map(([hall, rev]) => (
              <tr key={hall}><td><strong>{hall}</strong></td><td>{formatMoney(rev)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Etkinlik</th><th>Tarih</th><th>Salon</th><th>Durum</th><th>Gelir</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.eventName}</td>
                <td>{e.date}</td>
                <td>{e.hall}</td>
                <td>{e.status}</td>
                <td>{formatMoney(e.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BanketReportsHub() {
  return (
    <div className="roomio-gr-grid" style={{ marginTop: 16 }}>
      <Link href="/reports?category=banket&report=occupancy" className="roomio-card roomio-gr-card">
        <strong>Salon Doluluk Raporu</strong>
        <span className="roomio-page-desc">Salon bazlı etkinlik ve kişi doluluğu</span>
      </Link>
      <Link href="/reports?category=banket&report=revenue" className="roomio-card roomio-gr-card">
        <strong>Etkinlik Gelir Raporu</strong>
        <span className="roomio-page-desc">Onaylı ve opsiyon gelir özeti</span>
      </Link>
      <Link href="/fnb?tab=calendar" className="roomio-card roomio-gr-card">
        <strong>Ajanda Raporu</strong>
        <span className="roomio-page-desc">Tarih bazlı etkinlik takvimi</span>
      </Link>
      <Link href="/fnb?tab=agreements" className="roomio-card roomio-gr-card">
        <strong>Anlaşma Listesi</strong>
        <span className="roomio-page-desc">Onaylı banket anlaşmaları</span>
      </Link>
    </div>
  );
}

export function BanketDefinitionsHub() {
  const links = [
    { href: '/fnb?tab=halls', label: 'Salon Tanımları' },
    { href: '/fnb?tab=menus', label: 'Menü Paketleri' },
    { href: '/fnb?tab=rates', label: 'Banket Fiyatları' },
    { href: '/fnb?tab=equipment', label: 'Ekipman Listesi' },
    { href: '/fnb?tab=restaurant', label: 'Restoran Tanımları' },
  ];
  return (
    <div className="roomio-gr-grid" style={{ marginTop: 16 }}>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="roomio-card roomio-gr-card">
          <strong>{l.label}</strong>
        </Link>
      ))}
    </div>
  );
}
