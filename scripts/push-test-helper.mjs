/** Sunucuda VAPID yapılandırılmışsa push send 200, değilse 503 beklenir. */
export async function expectedPushSendStatus(baseUrl) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/push/vapid-public-key`);
  const j = await res.json().catch(() => ({}));
  return j.ok === true && Boolean(j.publicKey) ? 200 : 503;
}
