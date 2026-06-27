import { z } from 'zod';

/**
 * Auth route'ları (login, setup, change-password) için zod şemaları.
 *
 * Önceden bu route'larda yalnızca `(await req.json()) as { email?: string }`
 * gibi TypeScript tip iddiaları kullanılıyordu — runtime'da hiçbir kontrol
 * yoktu (örn. `email` alanı bir sayı veya iç içe obje olarak gönderilse bile
 * kabul edilirdi, sadece sonraki kodda muhtemelen bir hata fırlatırdı).
 * Bu dosya, doğrulamayı route'tan ayırıp tek bir yerde test edilebilir
 * kılar.
 */

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(200).email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1).max(512),
});

export const setupSchema = z
  .object({
    email: z.string().trim().min(1).max(200).email('Geçerli bir e-posta adresi girin'),
    name: z.string().trim().min(1).max(200),
    password: z.string().min(1).max(512),
    confirmPassword: z.string().min(1).max(512),
    propertyName: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().max(512).optional(),
    newPassword: z.string().min(1).max(512),
    confirmPassword: z.string().min(1).max(512),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yeni şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

/**
 * Zod hata mesajlarını tek bir Türkçe metne indirger (mevcut route'ların
 * `{ error: string }` response formatını bozmamak için). İlk hatayı alır —
 * birden fazla alan hatalı olsa bile kullanıcıya tek, anlaşılır bir mesaj
 * göstermek, tüm hataları JSON olarak dökmekten daha iyi bir UX'tir.
 */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Geçersiz istek';
}
