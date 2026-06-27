import { getPropertyProfileServer } from '@/lib/server/property-profile';

export const PDF_BRAND = '#1a6b4a';
export const PDF_BRAND_LIGHT = '#e8f5ef';
export const PDF_MUTED = '#64748b';

export type PdfTheme = {
  brand: string;
  brandLight: string;
  muted: string;
  hotel: string;
  company: string;
  taxOffice: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  businessDate: string;
  propertyCode: string;
};

export async function buildPdfTheme(
  propertyId?: string,
  overrides?: Partial<Pick<PdfTheme, 'hotel' | 'businessDate'>>,
): Promise<PdfTheme> {
  const profile = await getPropertyProfileServer(propertyId);
  return {
    brand: PDF_BRAND,
    brandLight: PDF_BRAND_LIGHT,
    muted: PDF_MUTED,
    hotel: overrides?.hotel ?? profile.name,
    company: profile.company,
    taxOffice: profile.taxOffice,
    taxNumber: profile.taxNumber,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    currency: profile.currency,
    businessDate: overrides?.businessDate ?? profile.businessDate,
    propertyCode: profile.code,
  };
}
