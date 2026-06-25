export type TourOperatorLink = {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  allotmentRooms: number;
  releaseDays: number;
  commissionPercent: number;
  contractRef?: string;
};

export type TourOperatorConfig = {
  enabled: boolean;
  simulateWhenOffline: boolean;
  autoImportManifest: boolean;
  syncIntervalHours: number;
  operators: TourOperatorLink[];
};

export const DEFAULT_TOUR_OPERATOR_CONFIG: TourOperatorConfig = {
  enabled: true,
  simulateWhenOffline: true,
  autoImportManifest: true,
  syncIntervalHours: 4,
  operators: [
    { id: 'tui', name: 'TUI', code: 'TUI', enabled: true, allotmentRooms: 40, releaseDays: 7, commissionPercent: 18 },
    { id: 'anex', name: 'Anex Tour', code: 'ANEX', enabled: true, allotmentRooms: 25, releaseDays: 5, commissionPercent: 16 },
    { id: 'ets', name: 'ETS Tur', code: 'ETS', enabled: true, allotmentRooms: 30, releaseDays: 7, commissionPercent: 17 },
    { id: 'coral', name: 'Coral Travel', code: 'CORAL', enabled: false, allotmentRooms: 20, releaseDays: 5, commissionPercent: 15 },
    { id: 'paximum', name: 'Paximum', code: 'PAX', enabled: true, allotmentRooms: 15, releaseDays: 3, commissionPercent: 14 },
  ],
};

export type TourOperatorSyncResult = {
  ok: boolean;
  message: string;
  imported: number;
  operators: Array<{ code: string; reservations: number }>;
  simulated?: boolean;
};
