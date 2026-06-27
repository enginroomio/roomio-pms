export type LoyaltyAccountRecord = {
  id: string;
  propertyId: string;
  guestName: string;
  email: string;
  phone?: string;
  tierId: string;
  tierName: string;
  points: number;
  lifetimeNights: number;
  lifetimeSpend: number;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyTransactionRecord = {
  id: string;
  propertyId: string;
  accountId: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  balanceAfter: number;
  reservationId?: string;
  refNo?: string;
  description: string;
  createdAt: string;
};

export type LoyaltySummary = {
  enabled: boolean;
  accountCount: number;
  totalPoints: number;
  tierBreakdown: Array<{ tierId: string; tierName: string; count: number }>;
  recentTransactions: LoyaltyTransactionRecord[];
};
