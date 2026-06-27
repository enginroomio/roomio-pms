import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { syncChannelManager } from '@/lib/integrations/channel-manager/client';
import { loadChannelManagerConfig } from '@/lib/integrations/channel-manager/client';
import { loadDynamicPricingConfig, saveDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import type { DynamicPricingApplyResult, DynamicPricingConfig, PricingRule } from '@/lib/dynamic-pricing/types';
import { competitorAdjustment } from '@/lib/revenue-management/forecast';
import { getAllReservationsServer } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { availabilityMatrix } from '@/lib/server/report-export';
import { getRateCalendarServer, upsertCalendarRate } from '@/lib/server/rate-calendar';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function applyRuleAdjustment(baseRate: number, rule: PricingRule, config: DynamicPricingConfig): number {
  let pct = rule.adjustmentPercent;
  if (rule.type === 'competitor' && config.competitor) {
    pct = competitorAdjustment(config.competitor);
  }
  const factor = 1 + pct / 100;
  return Math.max(0, Math.round(baseRate * factor));
}

function ruleMatches(
  rule: PricingRule,
  config: DynamicPricingConfig,
  ctx: {
    date: string;
    roomType: string;
    occupancyPct: number;
    daysBefore: number;
    hour: number;
    ratePlanCode: string;
  },
): boolean {
  if (!rule.enabled) return false;
  if (rule.ratePlanCode && rule.ratePlanCode !== ctx.ratePlanCode) return false;
  if (rule.roomTypes?.length && !rule.roomTypes.includes(ctx.roomType)) return false;

  switch (rule.type) {
    case 'occupancy':
      return ctx.occupancyPct >= (rule.occupancyThreshold ?? 100);
    case 'occupancy_below':
      return ctx.occupancyPct <= (rule.occupancyThreshold ?? 0);
    case 'lead_time':
      return ctx.daysBefore <= (rule.daysBefore ?? 0);
    case 'weekend': {
      const dow = new Date(ctx.date).getDay();
      return dow === 0 || dow === 6;
    }
    case 'hourly':
      return ctx.hour >= (rule.hourFrom ?? 24);
    case 'competitor':
      return Boolean(config.competitor?.enabled);
    default:
      return false;
  }
}

export async function applyDynamicPricing(
  propertyId = DEFAULT_PROPERTY_ID,
  days = 14,
): Promise<DynamicPricingApplyResult> {
  const config = await loadDynamicPricingConfig();
  if (!config.enabled) {
    return { ok: false, message: 'Dinamik fiyatlandırma kapalı', updatedCells: 0 };
  }

  const from = new Date().toISOString().slice(0, 10);
  const reservations = await getAllReservationsServer(propertyId);
  const matrix = availabilityMatrix(reservations, from, days);
  const rates = await getRateCalendarServer(from, addDays(from, days - 1), {
    code: config.defaultRatePlan,
    propertyId,
  });

  const today = new Date();
  const hour = today.getHours();
  let updatedCells = 0;
  const sampleRates: DynamicPricingApplyResult['sampleRates'] = [];

  for (const day of matrix) {
    const daysBefore = Math.round(
      (new Date(day.date).getTime() - today.getTime()) / 86_400_000,
    );
    for (const cell of day.cells) {
      const existing = rates.find(
        (r) => r.date === day.date && (r.roomType === cell.type || !r.roomType),
      );
      if (!existing) continue;

      let newRate = existing.rate;
      for (const rule of config.rules) {
        if (
          ruleMatches(rule, config, {
            date: day.date,
            roomType: cell.type,
            occupancyPct: cell.occupancyPct,
            daysBefore,
            hour,
            ratePlanCode: config.defaultRatePlan,
          })
        ) {
          newRate = applyRuleAdjustment(newRate, rule, config);
        }
      }

      if (newRate !== existing.rate) {
        await upsertCalendarRate(
          { ...existing, roomType: cell.type, rate: newRate },
          propertyId,
        );
        updatedCells += 1;
        if (sampleRates.length < 8) {
          sampleRates.push({
            date: day.date,
            roomType: cell.type,
            oldRate: existing.rate,
            newRate,
          });
        }
      }
    }
  }

  const now = new Date().toISOString();
  await saveDynamicPricingConfig({
    ...config,
    lastAppliedAt: now,
    lastAppliedCount: updatedCells,
  });

  let channelSyncTriggered = false;
  if (config.pushToChannelManager && updatedCells > 0) {
    const cm = await loadChannelManagerConfig();
    if (cm.enabled) {
      await syncChannelManager(cm);
      channelSyncTriggered = true;
    }
  }

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;

  return {
    ok: true,
    updatedCells,
    simulated,
    channelSyncTriggered,
    sampleRates,
    message: simulated
      ? `Simülasyon: ${updatedCells} fiyat hücresi güncellendi${channelSyncTriggered ? ', kanallara gönderildi' : ''}`
      : `${updatedCells} fiyat hücresi güncellendi${channelSyncTriggered ? ', kanallara gönderildi' : ''}`,
  };
}
