export type LicenseEdition = 'starter' | 'professional' | 'enterprise';

export type LicenseModule =
  | 'reservations'
  | 'reception'
  | 'housekeeping'
  | 'guest-relations'
  | 'fnb'
  | 'accounting'
  | 'reports'
  | 'integrations';

export type LicensePayload = {
  v: 1;
  licenseId: string;
  companyName: string;
  taxNumber?: string;
  propertyName: string;
  propertyCode: string;
  contactEmail: string;
  maxRooms: number;
  maxUsers: number;
  edition: LicenseEdition;
  modules: LicenseModule[];
  issuedAt: string;
  expiresAt: string;
  notes?: string;
};

export type LicenseValidation = {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
  daysRemaining?: number;
};

export const LICENSE_PREFIX = 'ROOMIO-LIC-v1';

export const ALL_MODULES: LicenseModule[] = [
  'reservations',
  'reception',
  'housekeeping',
  'guest-relations',
  'fnb',
  'accounting',
  'reports',
  'integrations',
];

export const EDITION_DEFAULTS: Record<LicenseEdition, { maxUsers: number; modules: LicenseModule[] }> = {
  starter: { maxUsers: 10, modules: ['reservations', 'reception', 'housekeeping'] },
  professional: {
    maxUsers: 50,
    modules: ['reservations', 'reception', 'housekeeping', 'guest-relations', 'reports', 'integrations'],
  },
  enterprise: { maxUsers: 999, modules: ALL_MODULES },
};
