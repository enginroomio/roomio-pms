export type LoyaltyTier = {
  id: string;
  name: string;
  minNights: number;
  minSpend: number;
  discountPercent: number;
  bonusMultiplier: number;
};

export type AgencyBonusRule = {
  agencyCode: string;
  agencyName: string;
  bonusPercent: number;
  enabled: boolean;
};

export type LoyaltyConfig = {
  enabled: boolean;
  pointsPerNight: number;
  pointsPer100Try: number;
  redeemValuePerPoint: number;
  minRedeemPoints: number;
  autoApplyOnBooking: boolean;
  tiers: LoyaltyTier[];
  agencyRules: AgencyBonusRule[];
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  pointsPerNight: 50,
  pointsPer100Try: 10,
  redeemValuePerPoint: 0.1,
  minRedeemPoints: 100,
  autoApplyOnBooking: true,
  tiers: [
    { id: 'bronze', name: 'Bronz', minNights: 0, minSpend: 0, discountPercent: 0, bonusMultiplier: 1 },
    { id: 'silver', name: 'Gümüş', minNights: 3, minSpend: 5000, discountPercent: 5, bonusMultiplier: 1 },
    { id: 'gold', name: 'Altın', minNights: 10, minSpend: 20000, discountPercent: 10, bonusMultiplier: 1.5 },
    { id: 'platinum', name: 'Platin', minNights: 25, minSpend: 50000, discountPercent: 15, bonusMultiplier: 2 },
  ],
  agencyRules: [
    { agencyCode: 'BOOKING', agencyName: 'Booking.com', bonusPercent: 3, enabled: true },
    { agencyCode: 'DIRECT-WEB', agencyName: 'Direkt Web', bonusPercent: 8, enabled: true },
    { agencyCode: 'TUI', agencyName: 'TUI', bonusPercent: 5, enabled: true },
  ],
};
