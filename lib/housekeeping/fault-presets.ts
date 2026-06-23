export const FAULT_QUICK_NOTES = [
  'Klima çalışmıyor',
  'Lavabo tıkanıklığı',
  'Duş suyu yok',
  'TV açılmıyor',
  'Kapı kilidi arızalı',
  'Ampul / aydınlatma',
  'Minibar arızası',
] as const;

export const FAULT_REPORTED_BY = [
  { id: 'hk_katci', label: 'HK Katçı' },
  { id: 'hk_sef', label: 'HK Şefi' },
  { id: 'reception', label: 'Resepsiyon' },
] as const;

export type FaultReportedById = (typeof FAULT_REPORTED_BY)[number]['id'];

export function reportedByLabel(id: string): string {
  return FAULT_REPORTED_BY.find((r) => r.id === id)?.label ?? id;
}
