export type FixedAsset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  value: number;
  currency: string;
  status: 'active' | 'maintenance' | 'retired';
};

export type FixedAssetsConfig = {
  enabled: boolean;
  depreciationMethod: 'linear' | 'declining';
  auditIntervalMonths: number;
  assets: FixedAsset[];
};

export const DEFAULT_FIXED_ASSETS_CONFIG: FixedAssetsConfig = {
  enabled: true,
  depreciationMethod: 'linear',
  auditIntervalMonths: 12,
  assets: [
    { id: 'a1', tag: 'FA-001', name: 'Lobi Klima Ünitesi', category: 'Mekanik', location: 'Lobi', purchaseDate: '2022-03-15', value: 85000, currency: 'TRY', status: 'active' },
    { id: 'a2', tag: 'FA-002', name: 'Asansör #1', category: 'Taşıma', location: 'A Blok', purchaseDate: '2020-06-01', value: 320000, currency: 'TRY', status: 'active' },
    { id: 'a3', tag: 'FA-003', name: 'Jeneratör 150kVA', category: 'Enerji', location: 'Bodrum', purchaseDate: '2021-11-20', value: 180000, currency: 'TRY', status: 'maintenance' },
  ],
};
