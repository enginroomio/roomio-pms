import fs from 'node:fs/promises';
import path from 'node:path';

type ConfigCacheEntry = { mtimeMs: number; value: unknown };

const configCache = new Map<string, ConfigCacheEntry>();

function configPath(fileName: string): string {
  return path.join(process.cwd(), '.roomio-data', fileName);
}

function parseConfig<T>(raw: string, defaults: T): T {
  const parsed = JSON.parse(raw) as T;
  if (Array.isArray(defaults)) {
    return (Array.isArray(parsed) ? parsed : defaults) as T;
  }
  return { ...defaults, ...parsed };
}

export async function loadJsonConfig<T>(fileName: string, defaults: T): Promise<T> {
  const file = configPath(fileName);
  try {
    const stat = await fs.stat(file);
    const cached = configCache.get(fileName);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.value as T;
    }
    const raw = await fs.readFile(file, 'utf8');
    const value = parseConfig(raw, defaults);
    configCache.set(fileName, { mtimeMs: stat.mtimeMs, value });
    return value;
  } catch {
    return defaults;
  }
}

export async function saveJsonConfig<T>(fileName: string, config: T): Promise<void> {
  const file = configPath(fileName);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2), 'utf8');
  configCache.delete(fileName);
}
