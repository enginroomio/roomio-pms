import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadJsonConfig<T>(fileName: string, defaults: T): Promise<T> {
  const file = path.join(process.cwd(), '.roomio-data', fileName);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(defaults)) {
      return (Array.isArray(parsed) ? parsed : defaults) as T;
    }
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export async function saveJsonConfig<T>(fileName: string, config: T): Promise<void> {
  const file = path.join(process.cwd(), '.roomio-data', fileName);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2), 'utf8');
}
