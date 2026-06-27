import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { appendAuditLog } from '@/lib/server/audit-log';
import {
  folioBalance,
  getCashRegistersServer,
  getFolioLinesServer,
} from '@/lib/server/folio-cash';
import { getDepositsServer } from '@/lib/server/cash-deposit';
import {
  getAllReservationsServer,
  getBusinessDate,
  getIdentityNotifications,
  init,
} from '@/lib/server/pms-store';

export type PreCloseSeverity = 'ok' | 'warn' | 'fail';

export type PreCloseCheck = {
  id: string;
  category: string;
  label: string;
  status: PreCloseSeverity;
  detail: string;
  count?: number;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export async function runNightAuditPreCloseChecks(
  propertyId?: string,
  opts: { log?: boolean } = {},
): Promise<{
  businessDate: string;
  ready: boolean;
  checks: PreCloseCheck[];
}> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const checks: PreCloseCheck[] = [];

  const registers = await getCashRegistersServer(prop, businessDate);
  const openRegisters = registers.filter((r) => r.status === 'open');
  checks.push({
    id: 'cash-open',
    category: 'Kasa',
    label: 'Açık kasa kontrolü',
    status: openRegisters.length === 0 ? 'ok' : 'fail',
    detail: openRegisters.length === 0
      ? 'Tüm kasalar kapalı'
      : `${openRegisters.length} kasa hâlâ açık: ${openRegisters.map((r) => r.register).join(', ')}`,
    count: openRegisters.length,
  });

  const reservations = await getAllReservationsServer(prop);
  const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN');
  let companyFolioOpen = 0;
  for (const r of inHouse) {
    const lines = await getFolioLinesServer(r.id, prop, 'company');
    if (folioBalance(lines) > 0) companyFolioOpen += 1;
  }
  checks.push({
    id: 'company-folio',
    category: 'Folyo',
    label: 'Şirket folyo bakiyesi',
    status: companyFolioOpen === 0 ? 'ok' : 'warn',
    detail: companyFolioOpen === 0
      ? 'Açık şirket folyosu yok'
      : `${companyFolioOpen} konaklayanda şirket folyosu açık (fatura kesilmedi)`,
    count: companyFolioOpen,
  });

  const identities = await getIdentityNotifications(prop);
  const pendingId = identities.filter((n) => n.status === 'draft' || n.status === 'missing' || n.status === 'ready').length;
  checks.push({
    id: 'egm-pending',
    category: 'EGM',
    label: 'Kimlik bildirimi',
    status: pendingId === 0 ? 'ok' : 'warn',
    detail: pendingId === 0 ? 'Bekleyen bildirim yok' : `${pendingId} bekleyen/taslak bildirim`,
    count: pendingId,
  });

  const deposits = await getDepositsServer(prop);
  const heldDeposits = deposits.filter((d) => d.status === 'held').length;
  checks.push({
    id: 'deposit-held',
    category: 'Depozit',
    label: 'Bekleyen depozit',
    status: heldDeposits === 0 ? 'ok' : 'warn',
    detail: heldDeposits === 0 ? 'Mahsup bekleyen depozit yok' : `${heldDeposits} depozit held durumda`,
    count: heldDeposits,
  });

  const departuresTomorrow = reservations.filter(
    (r) => r.status === 'CHECKED_IN' && r.checkOut === businessDate,
  ).length;
  checks.push({
    id: 'departures',
    category: 'Resepsiyon',
    label: 'Bugün çıkışlar',
    status: 'ok',
    detail: `${departuresTomorrow} konaklayan bugün çıkış yapacak`,
    count: departuresTomorrow,
  });

  const ready = !checks.some((c) => c.status === 'fail');

  if (opts.log !== false) {
    await appendAuditLog({
      module: 'eod',
      action: 'pre_close_check',
      entityType: 'BusinessDay',
      entityId: businessDate,
      user: 'Sistem',
      detail: ready ? 'Pre-close OK' : `Uyarı: ${checks.filter((c) => c.status !== 'ok').length} madde`,
      businessDate,
    }, prop);
  }

  return { businessDate, ready, checks };
}
