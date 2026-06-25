import type { CompetitorBenchmark } from '@/lib/revenue-management/types';
import { DEFAULT_COMPETITOR_BENCHMARK } from '@/lib/revenue-management/types';

export type PricingRuleType =
  | 'occupancy'
  | 'occupancy_below'
  | 'lead_time'
  | 'weekend'
  | 'hourly'
  | 'competitor';

export type PricingRule = {
  id: string;
  name: string;
  type: PricingRuleType;
  enabled: boolean;
  /** Doluluk eşiği (%) — occupancy / occupancy_below */
  occupancyThreshold?: number;
  /** Gün öncesi — lead_time tipi */
  daysBefore?: number;
  /** Saat (0-23) — hourly tipi */
  hourFrom?: number;
  /** Yüzde indirim (+) veya zam (-) */
  adjustmentPercent: number;
  roomTypes?: string[];
  ratePlanCode?: string;
};

export type DynamicPricingConfig = {
  enabled: boolean;
  autoApplyOnSync: boolean;
  pushToChannelManager: boolean;
  simulateWhenOffline: boolean;
  defaultRatePlan: string;
  rules: PricingRule[];
  competitor?: CompetitorBenchmark;
  lastAppliedAt?: string;
  lastAppliedCount?: number;
};

export const DEFAULT_DYNAMIC_PRICING_CONFIG: DynamicPricingConfig = {
  enabled: true,
  autoApplyOnSync: true,
  pushToChannelManager: true,
  simulateWhenOffline: true,
  defaultRatePlan: 'BAR',
  rules: [
    {
      id: 'occ-high',
      name: 'Yüksek doluluk zammı',
      type: 'occupancy',
      enabled: true,
      occupancyThreshold: 80,
      adjustmentPercent: 12,
    },
    {
      id: 'occ-low',
      name: 'Düşük doluluk indirimi',
      type: 'occupancy_below',
      enabled: true,
      occupancyThreshold: 40,
      adjustmentPercent: 15,
    },
    {
      id: 'lead-7',
      name: 'Son dakika indirimi',
      type: 'lead_time',
      enabled: true,
      daysBefore: 3,
      adjustmentPercent: 10,
    },
    {
      id: 'weekend',
      name: 'Hafta sonu zammı',
      type: 'weekend',
      enabled: true,
      adjustmentPercent: 8,
    },
    {
      id: 'hourly-16',
      name: '16:00 sonrası günlük indirim',
      type: 'hourly',
      enabled: true,
      hourFrom: 16,
      adjustmentPercent: 10,
    },
    {
      id: 'competitor',
      name: 'Rakip endeks ayarı',
      type: 'competitor',
      enabled: true,
      adjustmentPercent: 0,
    },
  ],
  competitor: DEFAULT_COMPETITOR_BENCHMARK,
};

export type DynamicPricingApplyResult = {
  ok: boolean;
  message: string;
  updatedCells: number;
  simulated?: boolean;
  channelSyncTriggered?: boolean;
  sampleRates?: Array<{ date: string; roomType: string; oldRate: number; newRate: number }>;
};
