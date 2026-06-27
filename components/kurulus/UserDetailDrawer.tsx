'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { PropertyInfo } from '@/lib/server/property-context';

type AuditRow = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  detail?: string;
};

type SessionRow = {
  jti: string;
  startedAt: string;
};

type DetailTab = 'general' | 'properties' | 'audit' | 'sessions';

type Props = {
  userId: string;
  userName: string;
  email: string;
  canAdmin: boolean;
  propertyIds: string[];
  allProperties: boolean;
  lastLoginAt: string | null;
  onClose: () => void;
};

export function UserDetailDrawer({
  userId,
  userName,
  email,
  canAdmin,
  propertyIds: initialPropertyIds,
  allProperties: initialAllProperties,
  lastLoginAt,
  onClose,
}: Props) {
  const [tab, setTab] = useState<DetailTab>('general');
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [propertyIds, setPropertyIds] = useState<string[]>(initialPropertyIds);
  const [allProperties, setAllProperties] = useState(initialAllProperties);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [redis, setRedis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPropertyIds(initialPropertyIds);
    setAllProperties(initialAllProperties);
  }, [initialPropertyIds, initialAllProperties]);

  const loadProperties = useCallback(async () => {
    const res = await roomioFetch('/api/properties');
    const j = (await res.json()) as { properties?: PropertyInfo[] };
    setProperties(j.properties ?? []);
  }, []);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch(`/api/users/${userId}/audit?limit=40`);
      if (!res.ok) throw new Error(await parseApiError(res, 'İşlem geçmişi yüklenemedi'));
      const j = (await res.json()) as { logs?: AuditRow[] };
      setAudit(j.logs ?? []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'İşlem geçmişi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch(`/api/users/${userId}/sessions`);
      if (!res.ok) throw new Error(await parseApiError(res, 'Oturumlar yüklenemedi'));
      const j = (await res.json()) as { sessions?: SessionRow[]; redis?: boolean };
      setSessions(j.sessions ?? []);
      setRedis(Boolean(j.redis));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Oturumlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (tab === 'properties') void loadProperties();
    if (tab === 'audit') void loadAudit();
    if (tab === 'sessions') void loadSessions();
  }, [tab, loadProperties, loadAudit, loadSessions]);

  function toggleProperty(id: string) {
    setAllProperties(false);
    setPropertyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveProperties() {
    setMsg(null);
    try {
      const res = await roomioFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          propertyIds: allProperties ? [] : propertyIds,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Şube yetkileri kaydedilemedi'));
      setMsg('Şube yetkileri güncellendi');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Kayıt başarısız');
    }
  }

  async function revokeAllSessions() {
    if (!window.confirm(`${userName} için tüm oturumları kapatmak istiyor musunuz?`)) return;
    setMsg(null);
    try {
      const res = await roomioFetch(`/api/users/${userId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke-all' }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Oturumlar kapatılamadı'));
      const j = (await res.json()) as { revoked?: number };
      setMsg(`${j.revoked ?? 0} oturum kapatıldı`);
      await loadSessions();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Oturumlar kapatılamadı');
    }
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'general', label: 'Özet' },
    { id: 'properties', label: 'Şubeler' },
    { id: 'audit', label: 'İşlem geçmişi' },
    { id: 'sessions', label: 'Oturumlar' },
  ];

  return (
    <tr>
      <td colSpan={8}>
        <div className="roomio-card" style={{ margin: '8px 0', padding: 14, background: 'var(--roomio-surface-muted)' }}>
          <div className="roomio-kurulus-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="roomio-card-title" style={{ fontSize: '0.95rem' }}>
              {userName} · {email}
            </h3>
            <Button variant="ghost" onClick={onClose}>Kapat</Button>
          </div>

          <div className="roomio-quick-actions" style={{ marginBottom: 12 }}>
            {tabs.map((t) => (
              <Button
                key={t.id}
                variant={tab === t.id ? 'primary' : 'secondary'}
                onClick={() => { setTab(t.id); setMsg(null); }}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {msg ? <p className="roomio-page-desc" role="status">{msg}</p> : null}

          {tab === 'general' ? (
            <dl className="roomio-page-desc" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px' }}>
              <dt>Son giriş</dt>
              <dd>{lastLoginAt ? new Date(lastLoginAt).toLocaleString('tr-TR') : '—'}</dd>
              <dt>Şube erişimi</dt>
              <dd>{allProperties ? 'Tüm şubeler' : `${propertyIds.length} şube`}</dd>
              <dt>Yetki grubu</dt>
              <dd>
                Grup tanımlarından izin matrisi düzenlenir{' '}
                <Button variant="ghost" href="/settings?section=user-groups">Grup tanımları →</Button>
              </dd>
            </dl>
          ) : null}

          {tab === 'properties' ? (
            <div>
              <p className="roomio-page-desc">
                Boş seçim = yalnızca varsayılan şube. Admin rolü her zaman tüm şubelere erişir.
              </p>
              {canAdmin ? (
                <>
                  <label className="roomio-field" style={{ marginTop: 8 }}>
                    <span>
                      <input
                        type="checkbox"
                        checked={allProperties}
                        onChange={(e) => {
                          setAllProperties(e.target.checked);
                          if (e.target.checked) setPropertyIds([]);
                        }}
                      />
                      {' '}Tüm şubeler
                    </span>
                  </label>
                  <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                    {properties.map((p) => (
                      <label key={p.id} className="roomio-field">
                        <span>
                          <input
                            type="checkbox"
                            disabled={allProperties}
                            checked={allProperties || propertyIds.includes(p.id)}
                            onChange={() => toggleProperty(p.id)}
                          />
                          {' '}{p.name}{p.city ? ` — ${p.city}` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="roomio-form-actions" style={{ marginTop: 12 }}>
                    <Button onClick={() => void saveProperties()}>Şube yetkilerini kaydet</Button>
                  </div>
                </>
              ) : (
                <p className="roomio-page-desc">Şube yetkilerini yalnızca sistem yöneticisi düzenleyebilir.</p>
              )}
            </div>
          ) : null}

          {tab === 'audit' ? (
            <div className="roomio-table-wrap">
              {loading ? <p className="roomio-page-desc">Yükleniyor…</p> : (
                <table className="roomio-table">
                  <thead>
                    <tr>
                      <th>Zaman</th>
                      <th>Modül</th>
                      <th>İşlem</th>
                      <th>Detay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.length === 0 ? (
                      <tr><td colSpan={4}>Kayıt yok</td></tr>
                    ) : audit.map((row) => (
                      <tr key={row.id}>
                        <td>{row.createdAt}</td>
                        <td>{row.module}</td>
                        <td>{row.action}</td>
                        <td>{row.detail ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}

          {tab === 'sessions' ? (
            <div>
              {!redis ? (
                <p className="roomio-page-desc">
                  Oturum listesi için Redis gerekir (production). Geliştirmede yalnızca çıkış cookie ile sonlanır.
                </p>
              ) : null}
              {canAdmin && redis ? (
                <Button variant="secondary" onClick={() => void revokeAllSessions()} style={{ marginBottom: 10 }}>
                  Tüm oturumları kapat
                </Button>
              ) : null}
              {loading ? <p className="roomio-page-desc">Yükleniyor…</p> : (
                <table className="roomio-table">
                  <thead>
                    <tr><th>Oturum ID</th><th>Başlangıç</th></tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr><td colSpan={2}>Aktif oturum yok</td></tr>
                    ) : sessions.map((s) => (
                      <tr key={s.jti}>
                        <td><code>{s.jti.slice(0, 8)}…</code></td>
                        <td>{s.startedAt ? new Date(s.startedAt).toLocaleString('tr-TR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
