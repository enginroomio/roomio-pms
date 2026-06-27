/** Rack görünüm komutları — oda sağ tık menüsünden tetiklenir. */
export type RackDisplayAction =
  | { type: 'floorColor'; color?: string }
  | { type: 'changeView' }
  | { type: 'clearSort' }
  | { type: 'toggleDragDrop' }
  | { type: 'fixPositions' }
  | { type: 'roomCoordinates'; roomNo: string; floor: number };

export const RACK_DISPLAY_EVENT = 'roomio-rack-display-action';

export function dispatchRackDisplayAction(action: RackDisplayAction) {
  window.dispatchEvent(new CustomEvent(RACK_DISPLAY_EVENT, { detail: action }));
}

export const RACK_FLOOR_COLORS = ['#e8eef5', '#e2e8f0', '#dbeafe', '#dcfce7', '#fef3c7'] as const;

export function nextRackFloorColor(current: string): string {
  const idx = RACK_FLOOR_COLORS.indexOf(current as (typeof RACK_FLOOR_COLORS)[number]);
  const next = idx < 0 ? 0 : (idx + 1) % RACK_FLOOR_COLORS.length;
  return RACK_FLOOR_COLORS[next];
}
