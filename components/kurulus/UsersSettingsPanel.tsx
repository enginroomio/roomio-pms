'use client';

import { Fragment } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useSession } from '@/components/auth/SessionProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { hasPermission, ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { UserDetailDrawer } from '@/components/kurulus/UserDetailDrawer';

type UserRow = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  roleId?: string;
  department: string;
  groupCode: string | null;
  active: boolean;
  propertyIds?: string[];
  allProperties?: boolean;
  lastLoginAt?: string | null;
};

type GroupOption = { code: string; name: string };

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [Role, string][];

const emptyCreateForm = {
  email: '',
  name: '',
  role: 'reception' as Role,
  password: '',
  department: '',
  groupCode: '',
};

export function UsersSettingsPanel() {
  const { t } = useI18n();
  const { user, loading: sessionLoading, authenticated } = useSession();
  const canAdmin = hasPermission(user, 'settings.admin');
  const canViewIdentity = hasPermission(user, 'identity.read');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    department: '',
    groupCode: '',
    active: true,
    role: 'reception' as Role,
    newPassword: '',
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        roomioFetch('/api/users'),
        roomioFetch('/api/user-groups'),
      ]);
      if (!usersRes.ok) throw new Error(await parseApiError(usersRes, t('kurulus.users.loadError')));
      const usersJ = (await usersRes.json()) as { ok?: boolean; users?: UserRow[]; message?: string };
      if (!usersJ.ok) throw new Error(usersJ.message ?? t('kurulus.users.loadError'));
      if (!groupsRes.ok) throw new Error(await parseApiError(groupsRes, t('kurulus.users.loadError')));
      const groupsJ = (await groupsRes.json()) as { groups?: Array<{ code: string; name: string }> };
      setUsers(usersJ.users ?? []);
      setGroups((groupsJ.groups ?? []).map((g) => ({ code: g.code, name: g.name })));
    } catch (err) {
      setUsers([]);
      setGroups([]);
      setError(err instanceof Error ? err.message : t('kurulus.users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function openRow(u: UserRow) {
    setDetailId(null);
    setEditingId(u.id);
    setEditForm({
      department: u.department,
      groupCode: u.groupCode ?? '',
      active: u.active,
      role: (u.roleId as Role) ?? 'reception',
      newPassword: '',
    });
  }

  async function deleteUser(id: string, email: string) {
    if (!window.confirm(`${email} kullanıcısını silmek istediğinize emin misiniz?`)) return;
    setSaveMsg(null);
    try {
      const res = await roomioFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Kullanıcı silinemedi'));
      setEditingId(null);
      await load();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Kullanıcı silinemedi');
    }
  }

  async function saveUser(id: string) {
    setSaveMsg(null);
    try {
      const res = await roomioFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          department: editForm.department,
          groupCode: editForm.groupCode || null,
          active: editForm.active,
          role: editForm.role,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, t('kurulus.users.saveError')));

      if (editForm.newPassword.trim()) {
        const pwRes = await roomioFetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset-password',
            id,
            newPassword: editForm.newPassword,
          }),
        });
        if (!pwRes.ok) throw new Error(await parseApiError(pwRes, 'Şifre sıfırlanamadı'));
      }

      setEditingId(null);
      await load();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : t('kurulus.users.saveError'));
    }
  }

  async function createUser() {
    setSaveMsg(null);
    try {
      const res = await roomioFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: createForm.email,
          name: createForm.name,
          role: createForm.role,
          password: createForm.password,
          department: createForm.department || undefined,
          groupCode: createForm.groupCode || null,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Kullanıcı oluşturulamadı'));
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      await load();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Kullanıcı oluşturulamadı');
    }
  }

  return (
    <div className="roomio-card roomio-table-wrap">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.users.title')} ({t('kurulus.live')})</h2>
        <Button variant="secondary" disabled={loading || sessionLoading} onClick={() => void load()}>
          {loading ? t('kurulus.loading') : t('kurulus.users.refresh')}
        </Button>
        <PermissionGate permission="settings.admin">
          <Button onClick={() => { setShowCreate(true); setSaveMsg(null); }}>Yeni kullanıcı</Button>
        </PermissionGate>
        <span className="roomio-badge">{loading ? '…' : t('kurulus.users.count').replace('{count}', String(users.length))}</span>
      </div>

      {!sessionLoading && !canAdmin ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {authenticated
            ? `Oturum: ${user.name} (${user.roleLabel}) — kullanıcı ekleme/silme için Sistem Yöneticisi girişi gerekir.`
            : 'Demo moddasınız. Tam yetki için /login üzerinden admin@roomio.local ile giriş yapın.'}
          {!authenticated ? (
            <>
              {' '}
              <Button variant="secondary" href="/login?next=/settings%3Fsection%3Dusers">Giriş yap</Button>
            </>
          ) : null}
        </p>
      ) : null}

      {showCreate ? (
        <div className="roomio-card" style={{ marginTop: 12, padding: 12, background: 'var(--roomio-surface-muted)' }}>
          <h3 className="roomio-card-title" style={{ fontSize: '0.9rem' }}>Yeni kullanıcı</h3>
          <div className="roomio-form-grid roomio-form-grid--3" style={{ marginTop: 12 }}>
            <label className="roomio-field">
              <span>Ad soyad</span>
              <input className="roomio-input" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="roomio-field">
              <span>E-posta</span>
              <input className="roomio-input" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
            </label>
            <label className="roomio-field">
              <span>Rol</span>
              <select className="roomio-input" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as Role }))}>
                {ROLE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <label className="roomio-field">
              <span>Geçici şifre</span>
              <input className="roomio-input" type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
            </label>
            <label className="roomio-field">
              <span>Departman</span>
              <input className="roomio-input" value={createForm.department} onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))} />
            </label>
            <label className="roomio-field">
              <span>Grup</span>
              <select className="roomio-input" value={createForm.groupCode} onChange={(e) => setCreateForm((p) => ({ ...p, groupCode: e.target.value }))}>
                <option value="">—</option>
                {groups.map((g) => <option key={g.code} value={g.code}>{g.code}</option>)}
              </select>
            </label>
          </div>
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            İlk girişte kullanıcıdan şifre değiştirmesi istenir. Ek yetkiler için kullanıcıyı bir gruba atayın
            {' '}
            <Button variant="ghost" href="/settings?section=user-groups">(Grup tanımları)</Button>
          </p>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button onClick={() => void createUser()}>Oluştur</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('kurulus.cancel')}</Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="roomio-text-warn" role="alert" style={{ marginTop: 12 }}>{error}</p> : null}
      {saveMsg ? <p className="roomio-text-warn" role="status" style={{ marginTop: 12 }}>{saveMsg}</p> : null}
      {!canAdmin && !loading && users.length > 0 ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {t('kurulus.users.readonly')}
        </p>
      ) : null}
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>{t('kurulus.users.col.username')}</th>
            <th>{t('kurulus.users.col.fullName')}</th>
            <th>{t('kurulus.users.col.email')}</th>
            <th>{t('kurulus.users.col.role')}</th>
            <th>{t('kurulus.users.col.department')}</th>
            <th>{t('kurulus.users.col.group')}</th>
            <th>{t('kurulus.col.status')}</th>
            <th>Son giriş</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9}>{t('kurulus.loading')}</td></tr>
          ) : users.map((u) => {
            const isOpen = editingId === u.id;
            const isDetail = detailId === u.id;
            return (
              <Fragment key={u.id}>
              <tr>
                <td><strong>{u.username}</strong></td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  {isOpen ? (
                    <select
                      className="roomio-input"
                      value={editForm.role}
                      disabled={!canAdmin}
                      onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as Role }))}
                    >
                      {ROLE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  ) : (
                    u.role
                  )}
                </td>
                <td>
                  {isOpen ? (
                    <input
                      className="roomio-input"
                      value={editForm.department}
                      disabled={!canAdmin}
                      onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                    />
                  ) : (
                    u.department
                  )}
                </td>
                <td>
                  {isOpen ? (
                    <select
                      className="roomio-input"
                      value={editForm.groupCode}
                      disabled={!canAdmin}
                      onChange={(e) => setEditForm((p) => ({ ...p, groupCode: e.target.value }))}
                    >
                      <option value="">—</option>
                      {groups.map((g) => <option key={g.code} value={g.code}>{g.code}</option>)}
                    </select>
                  ) : (
                    u.groupCode ?? '—'
                  )}
                </td>
                <td>
                  {isOpen ? (
                    <select
                      className="roomio-input"
                      value={editForm.active ? '1' : '0'}
                      disabled={!canAdmin}
                      onChange={(e) => setEditForm((p) => ({ ...p, active: e.target.value === '1' }))}
                    >
                      <option value="1">{t('kurulus.active')}</option>
                      <option value="0">{t('kurulus.inactive')}</option>
                    </select>
                  ) : (
                    u.active ? t('kurulus.active') : t('kurulus.inactive')
                  )}
                </td>
                <td className="roomio-page-desc">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('tr-TR') : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {isOpen ? (
                    canAdmin ? (
                      <PermissionGate permission="settings.admin">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                          <input
                            className="roomio-input"
                            type="password"
                            placeholder="Yeni şifre (sıfırla)"
                            value={editForm.newPassword}
                            onChange={(e) => setEditForm((p) => ({ ...p, newPassword: e.target.value }))}
                          />
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button onClick={() => void saveUser(u.id)}>{t('kurulus.save')}</Button>
                            <Button variant="ghost" onClick={() => setEditingId(null)}>{t('kurulus.cancel')}</Button>
                            <Button
                              variant="ghost"
                              onClick={() => void deleteUser(u.id, u.email)}
                              disabled={u.id === user.id}
                            >
                              Sil
                            </Button>
                          </div>
                        </div>
                      </PermissionGate>
                    ) : (
                      <Button variant="ghost" onClick={() => setEditingId(null)}>{t('kurulus.users.close')}</Button>
                    )
                  ) : (
                    <PermissionGate
                      permission="settings.admin"
                      fallback={
                        canViewIdentity ? (
                          <Button variant="secondary" onClick={() => openRow(u)}>{t('kurulus.users.edit')}</Button>
                        ) : (
                          <span className="roomio-page-desc">—</span>
                        )
                      }
                    >
                      <Button variant="secondary" onClick={() => openRow(u)}>{t('kurulus.users.edit')}</Button>
                    </PermissionGate>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setDetailId(isDetail ? null : u.id);
                    }}
                  >
                    {isDetail ? 'Detay ▲' : 'Detay'}
                  </Button>
                  </div>
                </td>
              </tr>
              {isDetail ? (
                <UserDetailDrawer
                  key={`${u.id}-detail`}
                  userId={u.id}
                  userName={u.fullName}
                  email={u.email}
                  canAdmin={canAdmin}
                  propertyIds={u.propertyIds ?? []}
                  allProperties={u.allProperties ?? u.roleId === 'admin'}
                  lastLoginAt={u.lastLoginAt ?? null}
                  onClose={() => setDetailId(null)}
                />
              ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
