export type NightAuditTextPackage = {
  hotel: string;
  businessDate: string;
  generatedAt: string;
  ready: boolean;
  checks: { ok: boolean; label: string; detail?: string }[];
  auditLogs: { createdAt: string; module: string; action: string; user: string; detail?: string; entityId?: string }[];
};

export function formatNightAuditPackageText(pkg: NightAuditTextPackage): string {
  const lines = [
    'GECE DENETİM PAKETİ',
    `Otel: ${pkg.hotel}`,
    `İş günü: ${pkg.businessDate}`,
    `Oluşturma: ${pkg.generatedAt}`,
    `Hazır: ${pkg.ready ? 'Evet' : 'Hayır'}`,
    '',
    '--- Ön kapanış kontrolleri ---',
  ];
  for (const check of pkg.checks) {
    lines.push(`${check.ok ? '[OK]' : '[!!]'} ${check.label}${check.detail ? ` — ${check.detail}` : ''}`);
  }
  lines.push('', '--- Denetim kayıtları ---');
  if (pkg.auditLogs.length === 0) {
    lines.push('Kayıt yok.');
  } else {
    for (const log of pkg.auditLogs) {
      lines.push(
        `${log.createdAt} | ${log.module} | ${log.action} | ${log.user} | ${log.detail ?? log.entityId ?? ''}`,
      );
    }
  }
  lines.push('', `Listelenen ${pkg.auditLogs.length}`);
  return lines.join('\n');
}

export function nightAuditSnapshotDisplayText(text: string): string {
  try {
    return formatNightAuditPackageText(JSON.parse(text) as NightAuditTextPackage);
  } catch {
    return text;
  }
}
