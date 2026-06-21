export type BanketReservation = {
  id: string;
  eventName: string;
  hall: string;
  date: string;
  startTime: string;
  endTime: string;
  pax: number;
  contact: string;
  status: 'confirmed' | 'option' | 'cancelled';
  revenue: number;
};

export const BANKET_HALLS = ['Sapphire Salon', 'Bosphorus A', 'Bosphorus B', 'Teras'] as const;

export const DEMO_BANKET: BanketReservation[] = [
  { id: 'bnk-1', eventName: 'Tech Summit Gala', hall: 'Sapphire Salon', date: '2026-06-20', startTime: '19:00', endTime: '23:30', pax: 180, contact: 'Events Co.', status: 'confirmed', revenue: 145000 },
  { id: 'bnk-2', eventName: 'Düğün — Yılmaz/Ak', hall: 'Bosphorus A', date: '2026-06-22', startTime: '18:00', endTime: '01:00', pax: 220, contact: 'Ayşe Yılmaz', status: 'confirmed', revenue: 198000 },
  { id: 'bnk-3', eventName: 'Kurumsal Kahvaltı', hall: 'Teras', date: '2026-06-19', startTime: '08:00', endTime: '11:00', pax: 45, contact: 'ABC Ltd.', status: 'option', revenue: 28000 },
];
