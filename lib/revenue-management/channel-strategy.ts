import type { ChannelRateStrategy } from '@/lib/revenue-management/types';
import { loadRevenueManagementConfig } from '@/lib/revenue-management/config';

export function applyChannelMarkup(baseRate: number, strategy: ChannelRateStrategy): number {
  if (!strategy.enabled) return baseRate;
  let rate = Math.round(baseRate * (1 + strategy.markupPercent / 100));
  if (strategy.minRate != null) rate = Math.max(rate, strategy.minRate);
  if (strategy.maxRate != null) rate = Math.min(rate, strategy.maxRate);
  return Math.max(0, rate);
}

export async function channelRateFor(
  channelId: string,
  baseRate: number,
): Promise<number> {
  const { channelStrategies } = await loadRevenueManagementConfig();
  const strategy = channelStrategies.find((s) => s.channelId === channelId);
  if (!strategy) return baseRate;
  return applyChannelMarkup(baseRate, strategy);
}

export async function channelStrategiesMap(): Promise<Map<string, ChannelRateStrategy>> {
  const { channelStrategies } = await loadRevenueManagementConfig();
  return new Map(channelStrategies.map((s) => [s.channelId, s]));
}
