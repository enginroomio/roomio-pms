export type ReputationSource = 'booking' | 'google' | 'tripadvisor' | 'internal';

export type ReputationConfig = {
  enabled: boolean;
  autoReply: boolean;
  syncIntervalHours: number;
  sources: ReputationSource[];
  minRatingAlert: number;
  simulateWhenOffline: boolean;
};

export const DEFAULT_REPUTATION_CONFIG: ReputationConfig = {
  enabled: true,
  autoReply: false,
  syncIntervalHours: 6,
  sources: ['booking', 'google', 'internal'],
  minRatingAlert: 3,
  simulateWhenOffline: true,
};

export type ReputationSyncResult = {
  ok: boolean;
  message: string;
  imported: number;
  simulated?: boolean;
};
