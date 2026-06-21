/** Canlı entegrasyon modu — simülasyon kapalı, gerçek cihaz beklenir. */
export function isIntegrationLiveMode(): boolean {
  return process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true';
}

export function effectiveSimulateWhenOffline(configSimulate: boolean): boolean {
  if (isIntegrationLiveMode()) return false;
  return configSimulate;
}
