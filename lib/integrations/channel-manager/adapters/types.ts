import type {
  ChannelConnectionStatus,
  ChannelLinkConfig,
  ChannelManagerConfig,
  ChannelPulledReservation,
} from '@/lib/integrations/channel-manager/types';
import type { ChannelAvailabilityPush, ChannelRatePush } from '@/lib/integrations/channel-manager/payload';

export type ChannelAdapterContext = {
  propertyId: string;
  config: ChannelManagerConfig;
  rates: ChannelRatePush[];
  availability: ChannelAvailabilityPush[];
  testOnly: boolean;
};

export type ChannelAdapterResult = {
  channelId: string;
  ok: boolean;
  status: ChannelConnectionStatus;
  message: string;
  simulated: boolean;
  pushedRates: number;
  pushedAvailability: number;
  pulledReservations: ChannelPulledReservation[];
};

export type ChannelAdapter = {
  channelIds: string[];
  testConnection(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): Promise<ChannelAdapterResult>;
  syncChannel(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): Promise<ChannelAdapterResult>;
};
