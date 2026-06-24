'use client';

import { useCallback, useEffect, useState } from 'react';
import { ALL_PERMISSIONS, PERMISSION_LABELS, hasPermission, type Permission } from '@/lib/auth/roles';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useSession } from '@/components/auth/SessionProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { UserGroupRow } from '@/lib/server/user-groups';

export function UserGroupsSettingsPanel() {
  const { t } = useI18n();
  const { user } = useSession();
  const canAdmin = hasPermission(user, 'settings.admin');
  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [form, setForm] = useState({ code: '', name: '', userCount: '', description: '' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/user-groups');
      if (!res.ok) throw new Error(await parseApiError(res, t('kurulus.userGroups.loadError')));
      const j = (await res.json()) as { groups?: UserGroupRow[] };
      setGroups(j.groups ?? []);
    } catch (err) {
      setGroups([]);
      setMsg(err instanceof Error ? err.message : t('kurulus.userGroups.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveNew(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await roomioFetch('/api/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          userCount: Number(form.userCount) || 0,
          description: form.description || undefined,
          permissions: [],
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, t('kurulus.userGroups.saveError')));
      setForm({ code: '', name: '', userCount: '', description: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.userGroups.saveError'));
    }
  }

  async function savePermissions(row: UserGroupRow) {
    try {
      const res = await roomioFetch('/api/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: row.code,
          name: row.name,
          userCount: row.userCount,
          description: row.description,
          active: row.active,
          permissions: editPerms,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, t('kurulus.userGroups.permSaveError')));
      setEditingCode(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.userGroups.permSaveError'));
    }
  }

  function togglePerm(p: Permission) {
    setEditPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function openPermissions(row: UserGroupRow) {
    setEditingCode(editingCode === row.code ? null : row.code);
    setEditPerms(row.permissions);
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.userGroups.title')} ({t('kurulus.userGroups.rbac')})</h2>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? t('kurulus.loading') : t('kurulus.users.refresh')}
        </Button>
        <PermissionGate permission="settings.admin">
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.userGroups.new')}</Button>
        </PermissionGate>
      </div>
      {msg ? <p className="roomio-page-desc roomio-text-warn" role="alert">{msg}</p> : null}
      {!canAdmin && !loading && groups.length > 0 ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {t('kurulus.userGroups.readonly')}
        </p>
      ) : null}
      {showForm ? (
        <PermissionGate permission="settings.admin">
        <form className="roomio-form" onSubmit={(e) => void saveNew(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('kurulus.col.code')}</span><input className="roomio-input" value={form.code} disabled={!canAdmin} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} /></label>
            <label className="roomio-field"><span>{t('kurulus.userGroups.col.groupName')}</span><input className="roomio-input" value={form.name} disabled={!canAdmin} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
            <label className="roomio-field"><span>{t('kurulus.userGroups.col.userCount')}</span><input className="roomio-input" type="number" min={0} value={form.userCount} disabled={!canAdmin} onChange={(e) => setForm((p) => ({ ...p, userCount: e.target.value }))} /></label>
            <label className="roomio-field roomio-field--full"><span>{t('kurulus.col.description')}</span><input className="roomio-input" value={form.description} disabled={!canAdmin} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </PermissionGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.col.code')}</th>
              <th>{t('kurulus.userGroups.col.groupName')}</th>
              <th>{t('kurulus.userGroups.col.users')}</th>
              <th>{t('kurulus.userGroups.col.permissions')}</th>
              <th>{t('kurulus.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>{t('kurulus.loading')}</td></tr>
            ) : groups.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.name}</td>
                <td>{row.userCount}</td>
                <td title={row.permissions.join(', ')}>
                  {t('kurulus.userGroups.permCount').replace('{count}', String(row.permissions.length))}
                  {row.permissions.includes('identity.read') ? ` · ${t('kurulus.userGroups.identityRead')}` : ''}
                </td>
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                <td>
                  <PermissionGate
                    permission="settings.admin"
                    fallback={(
                      <Button variant="secondary" onClick={() => openPermissions(row)}>
                        {editingCode === row.code ? t('kurulus.userGroups.close') : t('kurulus.userGroups.view')}
                      </Button>
                    )}
                  >
                    <Button variant="secondary" onClick={() => openPermissions(row)}>
                      {editingCode === row.code ? t('kurulus.userGroups.close') : t('kurulus.userGroups.permissions')}
                    </Button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingCode ? (
        <div className="roomio-card" style={{ marginTop: 12, padding: 12 }}>
          <h3 className="roomio-card-title" style={{ fontSize: '1rem' }}>
            {t('kurulus.userGroups.permTitle').replace('{code}', editingCode)}
          </h3>
          {!canAdmin ? (
            <p className="roomio-page-desc" style={{ marginTop: 8 }}>
              {t('kurulus.userGroups.readonly')}
            </p>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {ALL_PERMISSIONS.map((p) => (
              <label key={p} className="roomio-field roomio-field--checkbox" title={p}>
                <input
                  type="checkbox"
                  checked={editPerms.includes(p)}
                  disabled={!canAdmin}
                  onChange={() => togglePerm(p)}
                />
                <span>{PERMISSION_LABELS[p]}</span>
              </label>
            ))}
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <PermissionGate permission="settings.admin">
              <Button onClick={() => {
                const row = groups.find((g) => g.code === editingCode);
                if (row) void savePermissions(row);
              }}>{t('kurulus.userGroups.savePerms')}</Button>
            </PermissionGate>
          </div>
        </div>
      ) : null}
    </div>
  );
}
