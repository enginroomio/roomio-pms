import type { RoomHkStatus } from '@/lib/types/room';

export const HK_MAP_UPDATE_EVENT = 'roomio-hk-map-update';

export type HkMapUpdateDetail = {
  roomNo: string;
  hkStatus: RoomHkStatus;
};

const BC_NAME = 'roomio-hk-map';

let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(BC_NAME);
  return channel;
}

/** Oda HK durumu değişince tüm açık sekmelerde dinleyicilere bildir */
export function emitHkMapUpdate(detail: HkMapUpdateDetail) {
  window.dispatchEvent(new CustomEvent<HkMapUpdateDetail>(HK_MAP_UPDATE_EVENT, { detail }));
  getChannel()?.postMessage(detail);
}
