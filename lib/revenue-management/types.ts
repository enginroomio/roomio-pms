export type ChannelRateStrategy = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  /** OTA / direkt kanal fiyat farkı — +12 = %12 daha pahalı */
  markupPercent: number;
  minRate?: number;
  maxRate?: number;
};

export type CompetitorBenchmark = {
  enabled: boolean;
  /** 0–100 — yüksek = pazar baskısı (rakip fiyatları düşük) */
  marketIndex: number;
  /** Her 10 puan için uygulanacak % ayar (negatif = indirim) */
  adjustmentPer10Points: number;
};

export type RevenueForecastDay = {
  date: string;
  occupancyPct: number;
  roomsSold: number;
  roomsAvailable: number;
  totalRooms: number;
  bookedRevenue: number;
  forecastRevenue: number;
  adr: number;
  revpar: number;
  suggestedRate: number;
  currency: string;
};

export type RevenueChannelMix = {
  channel: string;
  channelId: string;
  rooms: number;
  revenue: number;
  sharePct: number;
};

export type RevenueForecastSnapshot = {
  ok: boolean;
  businessDate: string;
  horizonDays: number;
  currency: string;
  days: RevenueForecastDay[];
  summary: {
    avgOccupancy: number;
    totalForecastRevenue: number;
    avgAdr: number;
    avgRevpar: number;
    unsoldRoomNights: number;
  };
  channelMix: RevenueChannelMix[];
  competitor: CompetitorBenchmark;
  recommendedActions: string[];
};

export const DEFAULT_CHANNEL_STRATEGIES: ChannelRateStrategy[] = [
  { channelId: 'booking', channelName: 'Booking.com', enabled: true, markupPercent: 12 },
  { channelId: 'expedia', channelName: 'Expedia', enabled: true, markupPercent: 10 },
  { channelId: 'hotels-com', channelName: 'Hotels.com', enabled: true, markupPercent: 10 },
  { channelId: 'airbnb', channelName: 'Airbnb', enabled: true, markupPercent: 8 },
  { channelId: 'roomio-direct', channelName: 'Direkt Satış', enabled: true, markupPercent: -5 },
  { channelId: 'google', channelName: 'Google Hotel', enabled: true, markupPercent: 0 },
];

export const DEFAULT_COMPETITOR_BENCHMARK: CompetitorBenchmark = {
  enabled: true,
  marketIndex: 55,
  adjustmentPer10Points: -2,
};
