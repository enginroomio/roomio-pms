export async function parseApiError(res: Response, fallback = 'İstek başarısız'): Promise<string> {
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) return 'Oturum gerekli — lütfen yeniden giriş yapın';
  if (res.status === 403) return j.error ?? 'Bu işlem için yetkiniz yok';
  return j.error ?? `${fallback} (${res.status})`;
}
