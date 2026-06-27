import type { EgmIdentityForm } from '@/lib/egm/types';
import { emptyEgmForm } from '@/lib/egm/types';
import { inferIdType, validateIdScanDocument } from '@/lib/integrations/id-reader/validate';
import type { IdScanDocument, IdScanResult } from '@/lib/integrations/id-reader/types';

function normalizeGender(raw?: string): EgmIdentityForm['gender'] {
  const g = (raw ?? '').trim().toUpperCase();
  if (g === 'E' || g === 'M' || g === 'MALE' || g === 'ERKEK') return 'E';
  if (g === 'K' || g === 'F' || g === 'FEMALE' || g === 'KADIN') return 'K';
  return '';
}

export function scanDocumentToEgmPatch(
  doc: IdScanDocument,
  seed?: Partial<EgmIdentityForm>,
): Partial<EgmIdentityForm> {
  const idType = inferIdType(doc);
  return {
    ...seed,
    firstName: doc.firstName?.trim() || seed?.firstName || '',
    lastName: doc.lastName?.trim() || seed?.lastName || '',
    nationality: (doc.nationality ?? seed?.nationality ?? 'TR').trim().toUpperCase(),
    idNo: (doc.documentNo ?? seed?.idNo ?? '').trim(),
    idType,
    birthDate: doc.birthDate ?? seed?.birthDate ?? '',
    birthPlace: doc.birthPlace?.trim() || seed?.birthPlace || '',
    gender: normalizeGender(doc.gender) || seed?.gender || '',
    fatherName: doc.fatherName?.trim() || seed?.fatherName || '',
    motherName: doc.motherName?.trim() || seed?.motherName || '',
  };
}

export function buildEgmFormFromScan(
  scan: IdScanResult,
  seed?: Partial<EgmIdentityForm>,
): { form: EgmIdentityForm; validation: ReturnType<typeof validateIdScanDocument> } {
  const base = emptyEgmForm(seed);
  if (!scan.data) {
    return {
      form: base,
      validation: { ok: false, score: 0, errors: [scan.message || 'Tarama verisi yok'], warnings: [] },
    };
  }
  const patch = scanDocumentToEgmPatch(scan.data, seed);
  const form = emptyEgmForm({ ...base, ...patch });
  const validation = validateIdScanDocument(scan.data);
  return { form, validation };
}
