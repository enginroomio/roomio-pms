import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getRoomBlocksServer, saveRoomBlocksServer } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { RoomBlock } from '@/lib/data/room-blocks';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const blocks = await getRoomBlocksServer(propertyId);
  return NextResponse.json({ ok: true, blocks });
}

export async function PUT(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as { blocks: RoomBlock[] };
    if (!Array.isArray(body.blocks)) {
      return NextResponse.json({ error: 'blocks array required' }, { status: 400 });
    }
    await saveRoomBlocksServer(body.blocks, propertyId);
    return NextResponse.json({ ok: true, count: body.blocks.length });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const block = (await req.json()) as Omit<RoomBlock, 'id'>;
    const blocks = await getRoomBlocksServer(propertyId);
    const entry: RoomBlock = { ...block, id: `blk-${Date.now()}` };
    blocks.push(entry);
    await saveRoomBlocksServer(blocks, propertyId);
    return NextResponse.json({ ok: true, block: entry });
  } catch {
    return NextResponse.json({ error: 'add failed' }, { status: 500 });
  }
}
