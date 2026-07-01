import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { getDeviceStatus, testNetworkDevices } from '@/lib/integrations/hotspot5651/devices';
import { loadPbxConfig, testPbxConnection } from '@/lib/integrations/pbx/client';
import { loadTesaConfig, testTesaConnection } from '@/lib/integrations/tesa/client';
import { loadChannelManagerConfig, testChannelManagerConnection } from '@/lib/integrations/channel-manager/client';
import { loadBookingEngineConfig } from '@/lib/booking-engine/client';
import { loadDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import { loadGuestPortalConfig } from '@/lib/guest-portal/client';
import { loadEfaturaConfig, testEfaturaConnection } from '@/lib/integrations/efatura/client';
import { loadWhatsappConfig, testWhatsappConnection } from '@/lib/integrations/whatsapp/client';
import { loadLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import { loadDigitalMenuConfig } from '@/lib/integrations/digital-menu/client';
import { loadReputationConfig } from '@/lib/integrations/reputation/client';
import { loadBankingConfig } from '@/lib/integrations/banking/client';
import { loadCallCenterConfig, testCallCenterStack } from '@/lib/integrations/call-center/client';
import { loadKioskConfig } from '@/lib/kiosk/client';
import { loadSpaConfig } from '@/lib/spa/client';
import { loadTourOperatorConfig, testTourOperatorConnection } from '@/lib/integrations/tour-operator/client';
import { loadViofunConfig, testViofunConnection } from '@/lib/integrations/viofun/client';
import { loadGuestAppConfig } from '@/lib/integrations/guest-app/client';
import { loadAiAssistantConfig, testAiAssistantConnection } from '@/lib/integrations/ai-assistant/client';
import { loadMarinaConfig, testMarinaConnection } from '@/lib/integrations/marina/client';
import { loadHrPortalConfig, testHrPortalConnection } from '@/lib/integrations/hr-portal/client';
import { loadSupplierPortalConfig } from '@/lib/integrations/supplier-portal/client';
import { loadInventoryConfig } from '@/lib/integrations/inventory/client';
import { loadRestaurantBookingConfig } from '@/lib/integrations/restaurant-booking/client';
import { loadVirtualPosConfig, testVirtualPosConnection } from '@/lib/integrations/virtual-pos/client';
import { loadLiteMobileConfig } from '@/lib/integrations/lite-mobile/client';
import { loadQualityConfig } from '@/lib/integrations/quality/client';
import { loadCarbonConfig } from '@/lib/integrations/carbon/client';
import { loadFairEventsConfig } from '@/lib/integrations/fair-events/client';
import { loadGoogleBackupConfig, testGoogleBackupConnection } from '@/lib/integrations/google-backup/client';
import { loadCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { listCloudBackupHistory, testCloudBackupConnection } from '@/lib/server/cloud-backup/service';
import { loadFixedAssetsConfig } from '@/lib/integrations/fixed-assets/client';
import { loadProcurementConfig } from '@/lib/integrations/procurement/client';
import { loadWebsiteBuilderConfig } from '@/lib/integrations/website-builder/client';
import { loadGymConfig } from '@/lib/integrations/gym/client';
import { loadEdispatchConfig, testEdispatchConnection } from '@/lib/integrations/e-dispatch/client';
import { loadIdReaderConfig, testIdReaderConnection } from '@/lib/integrations/id-reader/client';
import { loadElektraServerConfig, testElektraServerConnection } from '@/lib/integrations/elektra-server/client';
import { loadTgaConfig, testTgaConnection } from '@/lib/integrations/tga/client';
import { loadTihConfig, testTihConnection } from '@/lib/integrations/tih/client';
import { loadTisConfig, testTisConnection } from '@/lib/integrations/tis/client';
import { loadRoomServiceConfig, listRoomServiceOrders } from '@/lib/integrations/room-service/client';
import { loadIcalFeeds } from '@/lib/integrations/ical-import/client';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const [
    tesaConfig, tesaTest, pbxConfig, pbxTest, deviceStatus, deviceTests,
    channelConfig, channelTest, bookingConfig, pricingConfig, guestPortalConfig, efaturaConfig, efaturaTest,
    whatsappConfig, whatsappTest, loyaltyConfig, digitalMenuConfig, reputationConfig, bankingConfig,
    callCenterConfig, callCenterTest, kioskConfig, spaConfig,
    tourOperatorConfig, tourOperatorTest, viofunConfig, viofunTest,
    guestAppConfig, aiConfig, aiTest, marinaConfig, marinaTest,
    hrPortalConfig, hrPortalTest, supplierPortalConfig, inventoryConfig,
    restaurantBookingConfig, virtualPosConfig, virtualPosTest,
    liteMobileConfig, qualityConfig, carbonConfig,
    fairEventsConfig, googleBackupConfig, googleBackupTest,
    cloudBackupConfig, cloudBackupTest, cloudBackupHistory,
    fixedAssetsConfig, procurementConfig, websiteBuilderConfig, gymConfig,
    edispatchConfig, edispatchTest, idReaderConfig, idReaderTest,
    elektraServerConfig, elektraServerTest, tgaConfig, tgaTest, tihConfig, tihTest,
    tisConfig, tisTest,
    roomServiceConfig, roomServiceOrders,
    icalFeeds,
  ] = await Promise.all([
    loadTesaConfig(),
    testTesaConnection(),
    loadPbxConfig(),
    testPbxConnection(),
    getDeviceStatus(),
    testNetworkDevices(),
    loadChannelManagerConfig(),
    loadChannelManagerConfig().then((cfg) => testChannelManagerConnection(cfg)),
    loadBookingEngineConfig(),
    loadDynamicPricingConfig(),
    loadGuestPortalConfig(),
    loadEfaturaConfig(),
    loadEfaturaConfig().then((cfg) => testEfaturaConnection(cfg)),
    loadWhatsappConfig(),
    loadWhatsappConfig().then((cfg) => testWhatsappConnection(cfg)),
    loadLoyaltyConfig(),
    loadDigitalMenuConfig(),
    loadReputationConfig(),
    loadBankingConfig(),
    loadCallCenterConfig(),
    loadCallCenterConfig().then((cfg) => testCallCenterStack(cfg)),
    loadKioskConfig(),
    loadSpaConfig(),
    loadTourOperatorConfig(),
    loadTourOperatorConfig().then((cfg) => testTourOperatorConnection(cfg)),
    loadViofunConfig(),
    loadViofunConfig().then((cfg) => testViofunConnection(cfg)),
    loadGuestAppConfig(),
    loadAiAssistantConfig(),
    loadAiAssistantConfig().then((cfg) => testAiAssistantConnection(cfg)),
    loadMarinaConfig(),
    loadMarinaConfig().then((cfg) => testMarinaConnection(cfg)),
    loadHrPortalConfig(),
    loadHrPortalConfig().then((cfg) => testHrPortalConnection(cfg)),
    loadSupplierPortalConfig(),
    loadInventoryConfig(),
    loadRestaurantBookingConfig(),
    loadVirtualPosConfig(),
    loadVirtualPosConfig().then((cfg) => testVirtualPosConnection(cfg)),
    loadLiteMobileConfig(),
    loadQualityConfig(),
    loadCarbonConfig(),
    loadFairEventsConfig(),
    loadGoogleBackupConfig(),
    loadGoogleBackupConfig().then((cfg) => testGoogleBackupConnection(cfg)),
    loadCloudBackupConfig(),
    loadCloudBackupConfig().then((cfg) => testCloudBackupConnection(cfg)),
    listCloudBackupHistory(3),
    loadFixedAssetsConfig(),
    loadProcurementConfig(),
    loadWebsiteBuilderConfig(),
    loadGymConfig(),
    loadEdispatchConfig(),
    loadEdispatchConfig().then((cfg) => testEdispatchConnection(cfg)),
    loadIdReaderConfig(),
    loadIdReaderConfig().then((cfg) => testIdReaderConnection(cfg)),
    loadElektraServerConfig(),
    loadElektraServerConfig().then((cfg) => testElektraServerConnection(cfg)),
    loadTgaConfig(),
    loadTgaConfig().then((cfg) => testTgaConnection(cfg)),
    loadTihConfig(),
    loadTihConfig().then((cfg) => testTihConnection(cfg)),
    loadTisConfig(),
    loadTisConfig().then((cfg) => testTisConnection(cfg)),
    loadRoomServiceConfig(),
    listRoomServiceOrders(),
    loadIcalFeeds(),
  ]);

  return NextResponse.json({
    ok: true,
    mode: isIntegrationLiveMode() ? 'live' : 'simulated',
    elektraServer: {
      enabled: elektraServerConfig.enabled,
      host: elektraServerConfig.host,
      port: elektraServerConfig.port,
      hotelCode: elektraServerConfig.hotelCode,
      relayServices: elektraServerConfig.relayServices,
      connection: elektraServerTest,
    },
    tga: {
      enabled: tgaConfig.enabled,
      useElektraServer: tgaConfig.useElektraServer,
      autoSubmitDaily: tgaConfig.autoSubmitDaily,
      connection: tgaTest,
    },
    tih: {
      enabled: tihConfig.enabled,
      useElektraServer: tihConfig.useElektraServer,
      autoSubmitOnCheckIn: tihConfig.autoSubmitOnCheckIn,
      connection: tihTest,
    },
    tis: {
      enabled: tisConfig.enabled,
      useElektraServer: tisConfig.useElektraServer,
      autoSubmitDaily: tisConfig.autoSubmitDaily,
      autoSubmitMonthly: tisConfig.autoSubmitMonthly,
      connection: tisTest,
    },
    tesa: {
      enabled: tesaConfig.enabled,
      host: tesaConfig.host,
      port: tesaConfig.port,
      simulateWhenOffline: tesaConfig.simulateWhenOffline,
      connection: tesaTest,
    },
    pbx: {
      enabled: pbxConfig.enabled,
      model: pbxConfig.model,
      host: pbxConfig.host,
      port: pbxConfig.port,
      macAddress: pbxConfig.macAddress,
      simulateWhenOffline: pbxConfig.simulateWhenOffline,
      autoOnCheckIn: pbxConfig.autoOnCheckIn,
      autoOnCheckOut: pbxConfig.autoOnCheckOut,
      connection: pbxTest,
    },
    hotspot5651: {
      status: deviceStatus,
      tests: deviceTests,
    },
    channelManager: {
      enabled: channelConfig.enabled,
      enabledChannels: channelConfig.channels.filter((c) => c.enabled).length,
      syncIntervalMinutes: channelConfig.syncIntervalMinutes,
      autoConfirmReservations: channelConfig.autoConfirmReservations,
      connection: channelTest,
    },
    icalImport: {
      feedCount: icalFeeds.feeds.length,
      channels: [...new Set(icalFeeds.feeds.map((f) => f.channel))],
      lastPulledAt: icalFeeds.feeds.reduce<string | null>((latest, f) => {
        if (!f.lastPulledAt) return latest;
        if (!latest || f.lastPulledAt > latest) return f.lastPulledAt;
        return latest;
      }, null),
    },
    bookingEngine: {
      enabled: bookingConfig.enabled,
      hotelName: bookingConfig.hotelName,
      googleHotel: bookingConfig.googleHotelEnabled,
      trivago: bookingConfig.trivagoEnabled,
      virtualPos: bookingConfig.allowVirtualPos,
    },
    dynamicPricing: {
      enabled: pricingConfig.enabled,
      ruleCount: pricingConfig.rules.filter((r) => r.enabled).length,
      lastAppliedAt: pricingConfig.lastAppliedAt,
      pushToChannelManager: pricingConfig.pushToChannelManager,
    },
    guestPortal: {
      enabled: guestPortalConfig.enabled,
      onlineCheckIn: guestPortalConfig.allowOnlineCheckIn,
      folioView: guestPortalConfig.allowFolioView,
      qrCheckIn: guestPortalConfig.qrCheckInEnabled,
    },
    efatura: {
      enabled: efaturaConfig.enabled,
      environment: efaturaConfig.environment,
      autoSendOnIssue: efaturaConfig.autoSendOnIssue,
      connection: efaturaTest,
    },
    whatsapp: {
      enabled: whatsappConfig.enabled,
      phoneNumberId: whatsappConfig.phoneNumberId,
      connection: whatsappTest,
    },
    loyalty: {
      enabled: loyaltyConfig.enabled,
      tierCount: loyaltyConfig.tiers.length,
      agencyRules: loyaltyConfig.agencyRules.filter((r) => r.enabled).length,
      autoApplyOnBooking: loyaltyConfig.autoApplyOnBooking,
    },
    digitalMenu: {
      enabled: digitalMenuConfig.enabled,
      itemCount: digitalMenuConfig.items.filter((i) => i.available).length,
      qrTableOrdering: digitalMenuConfig.qrTableOrdering,
    },
    reputation: {
      enabled: reputationConfig.enabled,
      sources: reputationConfig.sources,
      autoReply: reputationConfig.autoReply,
    },
    banking: {
      enabled: bankingConfig.enabled,
      accountCount: bankingConfig.accounts.length,
      autoReconcile: bankingConfig.autoReconcile,
    },
    callCenter: {
      enabled: callCenterConfig.enabled,
      queueName: callCenterConfig.queueName,
      linkToPbx: callCenterConfig.linkToPbx,
      connection: callCenterTest,
    },
    kiosk: {
      enabled: kioskConfig.enabled,
      hotelName: kioskConfig.hotelName,
      printRoomKey: kioskConfig.printRoomKey,
    },
    spa: {
      enabled: spaConfig.enabled,
      treatmentCount: spaConfig.treatments.filter((t) => t.available).length,
      allowOnlineBooking: spaConfig.allowOnlineBooking,
    },
    tourOperator: {
      enabled: tourOperatorConfig.enabled,
      operatorCount: tourOperatorConfig.operators.filter((o) => o.enabled).length,
      autoImportManifest: tourOperatorConfig.autoImportManifest,
      connection: tourOperatorTest,
    },
    viofun: {
      enabled: viofunConfig.enabled,
      activityCount: viofunConfig.activities.filter((a) => a.available).length,
      allowGuestBooking: viofunConfig.allowGuestBooking,
      connection: viofunTest,
    },
    guestApp: {
      enabled: guestAppConfig.enabled,
      appName: guestAppConfig.appName,
      pushEnabled: guestAppConfig.pushEnabled,
      minAppVersion: guestAppConfig.minAppVersion,
    },
    aiAssistant: {
      enabled: aiConfig.enabled,
      provider: aiConfig.provider,
      guestFacing: aiConfig.guestFacing,
      staffFacing: aiConfig.staffFacing,
      connection: aiTest,
    },
    marina: {
      enabled: marinaConfig.enabled,
      berthCount: marinaConfig.berths.filter((b) => b.available).length,
      allowOnlineBooking: marinaConfig.allowOnlineBooking,
      connection: marinaTest,
    },
    hrPortal: {
      enabled: hrPortalConfig.enabled,
      appName: hrPortalConfig.appName,
      pushEnabled: hrPortalConfig.pushEnabled,
      connection: hrPortalTest,
    },
    supplierPortal: {
      enabled: supplierPortalConfig.enabled,
      supplierCount: supplierPortalConfig.suppliers.filter((s) => s.enabled).length,
      autoApproveOrders: supplierPortalConfig.autoApproveOrders,
    },
    inventory: {
      enabled: inventoryConfig.enabled,
      itemCount: inventoryConfig.items.length,
      warehouseCount: inventoryConfig.warehouses.length,
      autoDeductOnSale: inventoryConfig.autoDeductOnSale,
    },
    restaurantBooking: {
      enabled: restaurantBookingConfig.enabled,
      tableCount: restaurantBookingConfig.tables.filter((t) => t.available).length,
      allowOnlineBooking: restaurantBookingConfig.allowOnlineBooking,
    },
    virtualPos: {
      enabled: virtualPosConfig.enabled,
      provider: virtualPosConfig.provider,
      threeDSecure: virtualPosConfig.threeDSecure,
      connection: virtualPosTest,
    },
    liteMobile: {
      enabled: liteMobileConfig.enabled,
      appName: liteMobileConfig.appName,
      offlineSync: liteMobileConfig.offlineSync,
    },
    quality: {
      enabled: qualityConfig.enabled,
      documentCount: qualityConfig.documents.length,
      iso9001Mode: qualityConfig.iso9001Mode,
    },
    carbon: {
      enabled: carbonConfig.enabled,
      co2PerNightKg: carbonConfig.co2PerNightKg,
      autoOfferOnBooking: carbonConfig.autoOfferOnBooking,
    },
    fairEvents: {
      enabled: fairEventsConfig.enabled,
      eventCount: fairEventsConfig.events.filter((e) => e.open).length,
      allowOnlineRegistration: fairEventsConfig.allowOnlineRegistration,
    },
    googleBackup: {
      enabled: googleBackupConfig.enabled,
      datasetId: googleBackupConfig.datasetId,
      backupIntervalHours: googleBackupConfig.backupIntervalHours,
      connection: googleBackupTest,
    },
    cloudBackup: {
      enabled: cloudBackupConfig.enabled,
      provider: cloudBackupConfig.provider,
      backupIntervalHours: cloudBackupConfig.backupIntervalHours,
      backupOnEodClose: cloudBackupConfig.backupOnEodClose,
      backupAfterDailyArchive: cloudBackupConfig.backupAfterDailyArchive,
      connection: cloudBackupTest,
      recentRuns: cloudBackupHistory,
    },
    fixedAssets: {
      enabled: fixedAssetsConfig.enabled,
      assetCount: fixedAssetsConfig.assets.length,
      depreciationMethod: fixedAssetsConfig.depreciationMethod,
    },
    procurement: {
      enabled: procurementConfig.enabled,
      approvalThreshold: procurementConfig.approvalThreshold,
      departmentCount: procurementConfig.departments.length,
    },
    websiteBuilder: {
      enabled: websiteBuilderConfig.enabled,
      domain: websiteBuilderConfig.domain,
      showBookingEngine: websiteBuilderConfig.showBookingEngine,
    },
    gym: {
      enabled: gymConfig.enabled,
      classCount: gymConfig.classes.filter((c) => c.available).length,
      allowOnlineBooking: gymConfig.allowOnlineBooking,
    },
    eDispatch: {
      enabled: edispatchConfig.enabled,
      environment: edispatchConfig.environment,
      autoSendOnShipment: edispatchConfig.autoSendOnShipment,
      connection: edispatchTest,
    },
    idReader: {
      enabled: idReaderConfig.enabled,
      deviceCount: idReaderConfig.devices.filter((d) => d.enabled).length,
      autoFillOnCheckIn: idReaderConfig.autoFillOnCheckIn,
      connection: idReaderTest,
    },
    roomService: {
      enabled: roomServiceConfig.enabled,
      serviceHours: `${roomServiceConfig.serviceHoursStart}–${roomServiceConfig.serviceHoursEnd}`,
      openOrders: roomServiceOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
      totalOrders: roomServiceOrders.length,
    },
  });
}
