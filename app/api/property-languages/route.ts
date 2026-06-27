import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getPropertyLanguagesServer, savePropertyLanguageServer } from '@/lib/server/property-languages';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const languages = await getPropertyLanguagesServer(propertyId);
    return NextResponse.json({ ok: true, languages });
  } catch (err) {
    logApiError('GET /api/property-languages', err);
    return NextResponse.json({ error: 'languages fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    nativeName?: string;
    active?: boolean;
    defaultLang?: boolean;
  };
  if (!body.code || !body.name || !body.nativeName) {
    return NextResponse.json({ error: 'code, name, nativeName gerekli' }, { status: 400 });
  }
  try {
    const language = await savePropertyLanguageServer({
      code: body.code,
      name: body.name,
      nativeName: body.nativeName,
      active: body.active ?? true,
      defaultLang: body.defaultLang ?? false,
    }, propertyId);
    return NextResponse.json({ ok: true, language });
  } catch (err) {
    logApiError('POST /api/property-languages', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
