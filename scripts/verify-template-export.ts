/**
 * Şablon export — canlı veri doğrulama (tek seferlik script)
 * Kullanım: npx tsx scripts/verify-template-export.ts
 */
import { saveReportTemplate } from '@/lib/server/pms-store';
import { buildTemplateCsv } from '@/lib/server/template-export';
import { templateDataRows } from '@/lib/server/template-data';

async function main() {
  const tpl = await saveReportTemplate({
    name: 'HK doğrulama',
    module: 'Kat Hizmetleri',
    columns: ['roomNo', 'floor', 'hkStatus', 'guestName', 'checkOut'],
  });

  const rows = await templateDataRows(tpl);
  const csv = await buildTemplateCsv(tpl.id);
  if (!csv) throw new Error('CSV üretilemedi');

  const roomNos = rows.map((r) => r[0]).filter(Boolean);
  const hasRealRooms = roomNos.some((n) => /^\d{3}$/.test(n));
  const lineCount = csv.csv.split('\n').length - 1;

  console.log('Şablon:', tpl.id, tpl.module);
  console.log('Satır sayısı:', rows.length, '| CSV satır:', lineCount);
  console.log('İlk 3 oda:', roomNos.slice(0, 3).join(', ') || '(boş)');
  console.log('Gerçek oda no:', hasRealRooms ? 'EVET' : 'HAYIR');

  if (!hasRealRooms || rows.length < 5) {
    process.exitCode = 1;
    console.error('DOĞRULAMA BAŞARISIZ');
    return;
  }
  console.log('DOĞRULAMA OK');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
