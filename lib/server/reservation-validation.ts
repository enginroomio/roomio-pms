import { isMarketRequiredServer } from '@/lib/server/user-params';

export async function validateMarketForReservation(
  market: string | undefined,
  propertyId?: string,
): Promise<string | null> {
  const required = await isMarketRequiredServer(propertyId);
  if (required && !market?.trim()) return 'Market kodu zorunlu';
  return null;
}
