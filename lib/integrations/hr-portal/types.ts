export type HrPortalConfig = {
  enabled: boolean;
  appName: string;
  allowLeaveRequests: boolean;
  allowShiftSwap: boolean;
  allowPayrollView: boolean;
  allowTraining: boolean;
  pushEnabled: boolean;
  simulateWhenOffline: boolean;
};

export const DEFAULT_HR_PORTAL_CONFIG: HrPortalConfig = {
  enabled: true,
  appName: 'Elektraweb IK Mobil',
  allowLeaveRequests: true,
  allowShiftSwap: true,
  allowPayrollView: false,
  allowTraining: true,
  pushEnabled: true,
  simulateWhenOffline: true,
};
