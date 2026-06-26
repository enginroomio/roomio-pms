/** KVKK — sunucu ve istemci ortak maskeleme */

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `*** *** ${digits.slice(-4)}`;
}

export function maskIdNo(idNo: string): string {
  const v = idNo.trim();
  if (v.length < 4) return '****';
  if (v.length <= 8) return `${v.slice(0, 2)}****`;
  return `${v.slice(0, 3)}****${v.slice(-2)}`;
}

export function maskGuestName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts
    .map((part) => {
      if (part.length <= 1) return `${part}***`;
      const visible = Math.min(2, part.length);
      return `${part.slice(0, visible)}${'*'.repeat(Math.max(3, part.length - visible))}`;
    })
    .join(' ');
}

export function maskBirthDate(iso: string): string {
  if (!iso || iso.length < 4) return '—';
  return `${iso.slice(0, 4)}-**-**`;
}
