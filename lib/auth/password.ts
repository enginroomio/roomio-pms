const MIN_LENGTH = 8;

export function validatePassword(password: string): string | null {
  const p = password.trim();
  if (p.length < MIN_LENGTH) return `Şifre en az ${MIN_LENGTH} karakter olmalıdır`;
  if (!/[a-zA-Z]/.test(p)) return 'Şifre en az bir harf içermelidir';
  if (!/[0-9]/.test(p)) return 'Şifre en az bir rakam içermelidir';
  return null;
}

export function passwordsMatch(a: string, b: string): boolean {
  return a === b;
}
