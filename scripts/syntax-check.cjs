#!/usr/bin/env node
/**
 * node_modules kurulu olmadığı durumlarda tam tip kontrolü (tsc -p .)
 * çalışmaz. Bu script, TypeScript Compiler API'sini kullanarak her .ts/.tsx
 * dosyasını bağımsız olarak parse eder ve SADECE SÖZDİZİMSEL hataları
 * (syntax errors) tespit eder — modül çözümlemesi yapmaz, bu yüzden eksik
 * node_modules'tan etkilenmez. Tip hatalarını (örn. yanlış parametre tipi)
 * YAKALAMAZ, ama şunları yakalar: dengesiz parantez/süslü parantez, yanlış
 * yazılmış sözdizimi, eksik noktalı virgül (gerekiyorsa), bozuk JSX, vb.
 *
 * `npm install` çalıştırıldıktan sonra bu script gereksizdir — `npm run
 * typecheck` (gerçek `tsc -p .`) çok daha kapsamlı bir kontrol yapar. Bu
 * script sadece node_modules kurulamayan/erişilemeyen ortamlarda (CI
 * öncesi hızlı bir sözdizimi taraması, sandbox/offline ortamlar) faydalıdır.
 */
const path = require('path');
const fs = require('fs');

function findTypeScript() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'typescript'),
    path.join(__dirname, '..', '..', 'node_modules', 'typescript'),
  ];
  // Global npm kurulumlarını da dene (npm root -g ile bulunabilir ama
  // senkron/bağımlılıksız tutmak için yaygın yolları deniyoruz).
  if (process.env.NPM_GLOBAL_TYPESCRIPT) candidates.push(process.env.NPM_GLOBAL_TYPESCRIPT);
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  try {
    return require.resolve('typescript');
  } catch {
    return null;
  }
}

const tsPath = findTypeScript();
if (!tsPath) {
  console.error('TypeScript bulunamadı. `npm install` çalıştırın ya da NPM_GLOBAL_TYPESCRIPT env değişkenini ayarlayın.');
  console.error('(Bu durumda asıl `npm run typecheck` komutunu kullanın — daha kapsamlıdır.)');
  process.exit(2);
}
const ts = require(tsPath);

const ROOT = process.argv[2] || '.';
const targets = [];

function walk(dir) {
  if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git')) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      targets.push(full);
    }
  }
}

walk(path.join(ROOT, 'app'));
walk(path.join(ROOT, 'lib'));
walk(path.join(ROOT, 'components'));
walk(path.join(ROOT, 'scripts'));
walk(path.join(ROOT, 'e2e'));
// Kök dizindeki yapılandırma dosyaları (next.config.ts, middleware.ts, vb.)
// alt klasörlerin dışında olduğu için yukarıdaki walk() çağrılarına dahil
// olmuyor; bu yüzden kök dizinin kendisini (alt klasörlere inmeden) ayrıca
// tarıyoruz.
try {
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      targets.push(path.join(ROOT, entry.name));
    }
  }
} catch {
  // ROOT okunamadı — sessizce geç, asıl klasör taramaları zaten yapıldı.
}

let totalErrors = 0;
const filesWithErrors = [];

for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');
  const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.ES2020,
    /* setParentNodes */ true,
    scriptKind,
  );

  // parseDiagnostics, parser'ın syntax error olarak işaretlediği düğümleri içerir.
  const diagnostics = sourceFile.parseDiagnostics || [];
  if (diagnostics.length > 0) {
    filesWithErrors.push({ file, diagnostics });
    totalErrors += diagnostics.length;
  }
}

console.log(`Taranan dosya: ${targets.length}`);
console.log(`Sözdizimi hatası bulunan dosya: ${filesWithErrors.length}`);
console.log(`Toplam hata: ${totalErrors}`);
console.log('');

for (const { file, diagnostics } of filesWithErrors) {
  console.log(`--- ${file} ---`);
  for (const d of diagnostics) {
    const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    console.log(`  [${line + 1}:${character + 1}] ${message}`);
  }
}

process.exitCode = filesWithErrors.length > 0 ? 1 : 0;
