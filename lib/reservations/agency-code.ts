import type { Reservation } from '@/lib/types/reservation';

export type AgencyContractRef = { code: string; name: string };

const NAME_ALIASES: Record<string, string> = {
  'booking.com': 'BKG',
  booking: 'BKG',
  expedia: 'EXP',
  direct: 'DIR',
  'doğrudan / walk-in': 'DIR',
  'dogrudan / walk-in': 'DIR',
  tui: 'TUI',
  'tui deutschland': 'TUI',
  tantur: 'TNT',
  'tantur turizm': 'TNT',
  corporate: 'CRP',
  münferit: 'MNF',
  munferit: 'MNF',
  şirket: 'SRK',
  sirket: 'SRK',
};

function reservationExtra(reservation: AgencyCodeSource, key: string): string {
  return reservation.extraData?.[key]?.trim() ?? '';
}

export type AgencyCodeSource = Pick<Reservation, 'agency' | 'roomNo' | 'extraData'> & {
  market?: Reservation['market'];
};

export function buildAgencyCodeLookup(contracts: AgencyContractRef[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const { code, name } of contracts) {
    map.set(code.toLowerCase(), code);
    map.set(name.toLowerCase(), code);
  }
  for (const [name, code] of Object.entries(NAME_ALIASES)) {
    if (!map.has(name)) map.set(name, code);
  }
  return map;
}

/** Liste sütununda gösterilecek tam acenta adı (kısaltma yok). */
export function resolveAgencyDisplayName(
  reservation: AgencyCodeSource,
  contracts: AgencyContractRef[],
): string {
  const lookup = buildAgencyCodeLookup(contracts);
  const code = resolveAgencyCode(reservation, lookup);
  const byCode = contracts.find((c) => c.code.toUpperCase() === code);
  if (byCode) return byCode.name;

  const agency = reservation.agency?.trim() ?? '';
  if (agency) {
    const byName = contracts.find((c) => c.name.toLowerCase() === agency.toLowerCase());
    if (byName) return byName.name;
    return agency;
  }

  return code === '—' ? '' : code;
}

/** Liste ve raporlarda gösterilecek kısa acenta kodu (BKG, EXP, TNT …). */
export function resolveAgencyCode(
  reservation: AgencyCodeSource,
  lookup?: Map<string, string>,
): string {
  const fromExtra = reservationExtra(reservation, 'agencyCode');
  if (fromExtra) return fromExtra.toUpperCase();

  const agency = reservation.agency?.trim() ?? '';
  if (agency && lookup?.has(agency.toLowerCase())) {
    return lookup.get(agency.toLowerCase())!;
  }

  const alias = NAME_ALIASES[agency.toLowerCase()];
  if (alias) return alias;

  const market = reservation.market?.trim();
  if (market?.includes('-')) {
    const suffix = market.split('-').pop()?.trim();
    if (suffix && /^[A-Za-z0-9]{2,8}$/.test(suffix)) return suffix.toUpperCase();
  }

  if (/^[A-Z0-9]{2,8}$/.test(agency)) return agency;

  if (agency) return agency.slice(0, 6).toUpperCase();
  return '—';
}

/** Atanan oda no — yalnızca rezervasyona yazılmış oda; yoksa boş. */
export function resolveReservationRoomNo(reservation: AgencyCodeSource): string | undefined {
  const direct = reservation.roomNo?.trim();
  return direct || undefined;
}
