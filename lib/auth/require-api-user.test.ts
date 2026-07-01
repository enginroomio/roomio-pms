import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEMO_ROLE_HEADER } from '@/lib/auth/config';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { hasPermission } from '@/lib/auth/roles';

describe('resolveApiUser demo role header', () => {
  it('admin header grants settings.admin in demo mode', async () => {
    const prev = process.env.ROOMIO_AUTH_REQUIRED;
    process.env.ROOMIO_AUTH_REQUIRED = '0';
    try {
      const req = new Request('http://localhost/api/test', {
        headers: { [DEMO_ROLE_HEADER]: 'admin' },
      });
      const user = await resolveApiUser(req);
      assert.ok(user);
      assert.equal(user!.role, 'admin');
      assert.equal(hasPermission(user!, 'settings.admin'), true);
    } finally {
      if (prev === undefined) delete process.env.ROOMIO_AUTH_REQUIRED;
      else process.env.ROOMIO_AUTH_REQUIRED = prev;
    }
  });

  it('fo_manager header lacks settings.admin', async () => {
    const prev = process.env.ROOMIO_AUTH_REQUIRED;
    process.env.ROOMIO_AUTH_REQUIRED = '0';
    try {
      const req = new Request('http://localhost/api/test');
      const user = await resolveApiUser(req);
      assert.ok(user);
      assert.equal(hasPermission(user!, 'settings.admin'), false);
    } finally {
      if (prev === undefined) delete process.env.ROOMIO_AUTH_REQUIRED;
      else process.env.ROOMIO_AUTH_REQUIRED = prev;
    }
  });
});
