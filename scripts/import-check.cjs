#!/usr/bin/env node
/**
 * node_modules olmadan tsc tam tip kontrolü yapamıyor. Bu script, en azından
 * "import edilen sembol, hedef modülde gerçekten export ediliyor mu" sorusunu
 * (modül bulunamadı hatası DIŞINDA, named-export uyumsuzluğu) statik olarak
 * kontrol eder. Yakaladığı hata sınıfı: yanlış yazılmış import adı, silinmiş
 * ama hâlâ import edilen bir export, vb. Tip uyumluluğunu KONTROL ETMEZ.
 *
 * `npm install` çalıştırıldıktan sonra bu script gereksizdir — `npm run
 * typecheck` çok daha kapsamlıdır. Sadece node_modules erişilemeyen
 * ortamlarda (sandbox/offline) ek bir güvenlik ağı olarak faydalıdır.
 */
const fs = require('fs');
const path = require('path');

function findTypeScript() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'typescript'),
    path.join(__dirname, '..', '..', 'node_modules', 'typescript'),
  ];
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

const ROOT = path.resolve(process.argv[2] || '.');
const files = [];

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
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
  }
}
['app', 'lib', 'components', 'scripts', 'e2e'].forEach((d) => walk(path.join(ROOT, d)));
// Kök dizindeki yapılandırma dosyaları (next.config.ts, middleware.ts, vb.)
try {
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(path.join(ROOT, entry.name));
    }
  }
} catch {
  // ROOT okunamadı — sessizce geç.
}

function resolveModulePath(importPath, fromFile) {
  let basePath;
  if (importPath.startsWith('@/')) {
    basePath = path.join(ROOT, importPath.slice(2));
  } else if (importPath.startsWith('.')) {
    basePath = path.resolve(path.dirname(fromFile), importPath);
  } else {
    return null; // node_modules paketi — kontrol kapsamımız dışında
  }
  const candidates = [
    basePath + '.ts',
    basePath + '.tsx',
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Basit bir export-cache: dosya -> Set<export adı> (+ '*default*' varsa)
const exportCache = new Map();

function getExportsOf(filePath) {
  if (exportCache.has(filePath)) return exportCache.get(filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const exported = new Set();
  let hasStarExport = false;

  function visit(node) {
    if (ts.isExportDeclaration(node)) {
      if (!node.exportClause) {
        hasStarExport = true; // export * from '...'
      } else if (ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          exported.add(el.name.text);
        }
      }
    } else if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exported.add(node.name.text);
    } else if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      exported.add(node.name.text);
    } else if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) exported.add(decl.name.text);
      }
    } else if (ts.isExportAssignment(node)) {
      exported.add('default');
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  const result = { exported, hasStarExport };
  exportCache.set(filePath, result);
  return result;
}

const issues = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2020, true, scriptKind);

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const importPath = node.moduleSpecifier.text;
      const targetFile = resolveModulePath(importPath, file);
      if (targetFile && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        const { exported, hasStarExport } = getExportsOf(targetFile);
        if (!hasStarExport) {
          for (const el of node.importClause.namedBindings.elements) {
            const importedName = (el.propertyName ?? el.name).text;
            if (!exported.has(importedName)) {
              issues.push({
                file,
                importPath,
                targetFile,
                symbol: importedName,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
}

console.log(`Taranan dosya: ${files.length}`);
console.log(`Şüpheli (hedefte bulunamayan) import: ${issues.length}`);
console.log('');
for (const issue of issues) {
  console.log(`${issue.file}`);
  console.log(`  '${issue.symbol}' sembolü '${issue.importPath}' (-> ${path.relative(ROOT, issue.targetFile)}) içinde bulunamadı`);
}
process.exitCode = issues.length > 0 ? 1 : 0;
