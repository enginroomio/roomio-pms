export type Technician = {
  id: string;
  name: string;
  trade: string;
  phone?: string;
};

export const HK_TECHNICIANS: Technician[] = [
  { id: 'mehmet', name: 'Mehmet T.', trade: 'Elektrik / Klima', phone: 'dahili 301' },
  { id: 'serkan', name: 'Serkan D.', trade: 'Genel bakım', phone: 'dahili 302' },
  { id: 'ali', name: 'Ali R.', trade: 'Tesisat', phone: 'dahili 303' },
];

export const FAULT_CATEGORIES = [
  { id: 'hvac', label: 'Klima / Isıtma' },
  { id: 'plumbing', label: 'Tesisat' },
  { id: 'electrical', label: 'Elektrik' },
  { id: 'furniture', label: 'Mobilya / Kapı' },
  { id: 'general', label: 'Genel bakım' },
] as const;

export type FaultCategoryId = (typeof FAULT_CATEGORIES)[number]['id'];

export function technicianById(id: string): Technician | undefined {
  return HK_TECHNICIANS.find((t) => t.id === id || t.name === id);
}
