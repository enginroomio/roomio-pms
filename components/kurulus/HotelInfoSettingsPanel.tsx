'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import type { PropertyProfile } from '@/lib/server/property-profile';

export function HotelInfoSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const { activeProperty } = useProperty();
  const [profile, setProfile] = useState<PropertyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/property-profile');
      const j = (await res.json()) as { profile?: PropertyProfile };
      setProfile(j.profile ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/property-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const j = (await res.json()) as { ok?: boolean; profile?: PropertyProfile; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? t('gr.traces.saveFailed'));
      setProfile(j.profile ?? profile);
      setMsg(t('kurulus.hotelInfo.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('gr.traces.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return <div className="roomio-card"><p>{t('kurulus.loading')}</p></div>;
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.hotelInfo.title')} ({t('kurulus.live')})</h2>
        {activeProperty?.city ? <span className="roomio-badge">{activeProperty.city}</span> : null}
      </div>
      <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 16 }}>
        <div className="roomio-form-grid roomio-form-grid--2">
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.name')} value={profile.name} onChange={(e) => setProfile((p) => p && ({ ...p, name: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.code')} value={profile.code} onChange={(e) => setProfile((p) => p && ({ ...p, code: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.company')} value={profile.company} onChange={(e) => setProfile((p) => p && ({ ...p, company: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.taxNumber')} value={profile.taxNumber} onChange={(e) => setProfile((p) => p && ({ ...p, taxNumber: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.address')} fieldClassName="roomio-field roomio-field--full" value={profile.address} onChange={(e) => setProfile((p) => p && ({ ...p, address: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.phone')} value={profile.phone} onChange={(e) => setProfile((p) => p && ({ ...p, phone: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.email')} value={profile.email} onChange={(e) => setProfile((p) => p && ({ ...p, email: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.stars')} type="number" min={1} max={5} value={profile.stars} onChange={(e) => setProfile((p) => p && ({ ...p, stars: Number(e.target.value) }))} />
          <label className="roomio-field"><span>{t('kurulus.hotelInfo.roomCount')}</span><input className="roomio-input" type="number" value={profile.totalRooms} readOnly /></label>
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.checkIn')} value={profile.checkInTime} onChange={(e) => setProfile((p) => p && ({ ...p, checkInTime: e.target.value }))} />
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.checkOut')} value={profile.checkOutTime} onChange={(e) => setProfile((p) => p && ({ ...p, checkOutTime: e.target.value }))} />
          <label className="roomio-field"><span>{t('kurulus.hotelInfo.businessDate')}</span><input className="roomio-input" value={profile.businessDate} readOnly /></label>
          <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.hotelInfo.currency')} value={profile.currency} onChange={(e) => setProfile((p) => p && ({ ...p, currency: e.target.value }))} />
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <KurulusAdminGate>
            <Button type="submit" disabled={saving}>{saving ? t('kurulus.saving') : t('kurulus.save')}</Button>
          </KurulusAdminGate>
        </div>
        {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
      </form>
    </div>
  );
}
