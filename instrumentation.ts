/** Sunucu başlatma yan etkileri lib/server/pms-store init() içinde lazy yüklenir. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
}
