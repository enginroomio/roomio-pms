export type CarbonConfig = {
  enabled: boolean;
  certificateProvider: string;
  co2PerNightKg: number;
  offsetCostPerKg: number;
  currency: string;
  autoOfferOnBooking: boolean;
  showGuestBadge: boolean;
};

export const DEFAULT_CARBON_CONFIG: CarbonConfig = {
  enabled: true,
  certificateProvider: 'Gold Standard',
  co2PerNightKg: 12.5,
  offsetCostPerKg: 2.8,
  currency: 'TRY',
  autoOfferOnBooking: true,
  showGuestBadge: true,
};

export type CarbonOffsetQuote = {
  ok: boolean;
  nights: number;
  totalCo2Kg: number;
  offsetCost: number;
  currency: string;
  certificatePreview?: string;
};
