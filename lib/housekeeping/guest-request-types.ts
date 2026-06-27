export const GUEST_REQUEST_TYPES = [
  { id: 'extra_towel', label: 'Ekstra havlu' },
  { id: 'double_pillow', label: 'Çift yastık' },
  { id: 'extra_blanket', label: 'Ekstra battaniye' },
  { id: 'crib', label: 'Bebek yatağı' },
  { id: 'late_checkout', label: 'Geç çıkış' },
  { id: 'early_checkin', label: 'Erken giriş hazırlığı' },
  { id: 'minibar', label: 'Minibar / ikram' },
  { id: 'dnd', label: 'Rahatsız etmeyin notu' },
  { id: 'vip', label: 'VIP özel istek' },
  { id: 'other', label: 'Diğer' },
] as const;

export type GuestRequestTypeId = (typeof GUEST_REQUEST_TYPES)[number]['id'];

export function guestRequestLabel(id: string): string {
  return GUEST_REQUEST_TYPES.find((t) => t.id === id)?.label ?? id;
}
