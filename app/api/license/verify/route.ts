import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { verifyLicense, signLicense } from '@/lib/license/crypto-server';
import type { LicensePayload } from '@/lib/license/types';
import { randomUUID } from 'node:crypto';

export async function POST(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { token?: string };
  if (!body.token) return NextResponse.json({ valid: false, error: 'token gerekli' }, { status: 400 });
  return NextResponse.json(verifyLicense(body.token));
}

/** Satıcı modu — ROOMIO_VENDOR_MODE=1 gerekir */
export async function PUT(req: Request) {
  if (process.env.ROOMIO_VENDOR_MODE !== '1') {
    return NextResponse.json({ error: 'Vendor modu kapalı' }, { status: 403 });
  }
  try {
    const payload = (await req.json()) as LicensePayload;
    const full: LicensePayload = {
      ...payload,
      v: 1,
      licenseId: payload.licenseId || randomUUID(),
    };
    const token = signLicense(full);
    return NextResponse.json({ token, payload: full });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Üretim hatası' }, { status: 500 });
  }
}
