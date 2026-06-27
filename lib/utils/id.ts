export function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 12)}`;
}
