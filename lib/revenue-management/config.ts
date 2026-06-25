import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { loadDynamicPricingConfig, saveDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import {
  DEFAULT_CHANNEL_STRATEGIES,
  DEFAULT_COMPETITOR_BENCHMARK,
  type ChannelRateStrategy,
  type CompetitorBenchmark,
} from '@/lib/revenue-management/types';

const STRATEGIES_FILE = 'channel-rate-strategies.json';
const COMPETITOR_FILE = 'competitor-benchmark.json';

export type RevenueManagementConfig = {
  channelStrategies: ChannelRateStrategy[];
  competitor: CompetitorBenchmark;
};

export const DEFAULT_REVENUE_MANAGEMENT_CONFIG: RevenueManagementConfig = {
  channelStrategies: DEFAULT_CHANNEL_STRATEGIES,
  competitor: DEFAULT_COMPETITOR_BENCHMARK,
};

export async function loadRevenueManagementConfig(): Promise<RevenueManagementConfig> {
  const strategies = await loadJsonConfig(STRATEGIES_FILE, DEFAULT_CHANNEL_STRATEGIES);
  const competitor = await loadJsonConfig(COMPETITOR_FILE, DEFAULT_COMPETITOR_BENCHMARK);
  return { channelStrategies: strategies, competitor };
}

export async function saveChannelStrategies(strategies: ChannelRateStrategy[]): Promise<void> {
  await saveJsonConfig(STRATEGIES_FILE, strategies);
}

export async function saveCompetitorBenchmark(competitor: CompetitorBenchmark): Promise<void> {
  await saveJsonConfig(COMPETITOR_FILE, competitor);
}

export async function saveRevenueManagementConfig(config: RevenueManagementConfig): Promise<void> {
  await saveChannelStrategies(config.channelStrategies);
  await saveCompetitorBenchmark(config.competitor);
  const pricing = await loadDynamicPricingConfig();
  await saveDynamicPricingConfig({ ...pricing, competitor: config.competitor });
}
