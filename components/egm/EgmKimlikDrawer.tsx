'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import {
  EGM_GENDER_LABELS,
  EGM_ID_TYPE_LABELS,
  egmRequiredFields,
  emptyEgmForm,
  type EgmIdentityForm,
  type EgmIdentityRecord,
} from '@/lib/egm/types';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';

type Props = {
  open: boolean;
  seed: Partial<EgmIdentityForm>;
  record?: EgmIdentityRecord;
  onClose: () => void;
  onSaved: (record: EgmIdentityRecord) => void;
};

export function EgmKimlikDrawer({ open, seed, record, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EgmIdentityForm>(() => emptyEgmForm(seed));
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyEgmForm({
        ...seed,
        firstName: record?.firstName ?? seed.firstName,
        lastName: record?.lastName ?? seed.lastName,
        roomNo: record?.roomNo ?? seed.roomNo,
        nationality: record?.nationality ?? seed.nationality,
        idNo: record?.idNo ?? seed.idNo,
        idType: record?.idType ?? seed.idType,
        birthDate: record?.birthDate ?? seed.birthDate,
        birthPlace: record?.birthPlace ?? seed.birthPlace,
        gender: record?.gender ?? seed.gender,
        fatherName: record?.fatherName ?? seed.fatherName,
        motherName: record?.motherName ?? seed.motherName,
        checkIn: record?.checkIn ?? seed.checkIn,
        checkOut: record?.checkOut ?? seed.checkOut,
      }));
      setMsg(null);
    }
  }, [open, seed, record]);

  if (!open) return null;

  const missing = egmRequiredFields(form);

  function setField<K extends keyof EgmIdentityForm>(key: K, value: EgmIdentityForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(andSend = false) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/egm/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Kayıt başarısız'));
      const j = (await res.json()) as { record?: EgmIdentityRecord; error?: string };
      if (!j.record) throw new Error(j.error ?? 'Kayıt başarısız');
      onSaved(j.record);
      if (andSend) {
        const sendRes = await roomioFetch('/api/egm/identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', id: j.record.id }),
        });
        if (!sendRes.ok) throw new Error(await parseApiError(sendRes, 'EGM gönderimi başarısız'));
        const sj = (await sendRes.json()) as { record?: EgmIdentityRecord; error?: string };
        if (!sj.record) throw new Error(sj.error ?? 'EGM gönderimi başarısız');
        setMsg(`EGM bildirimi gönderildi · Ref: ${sj.record.egmRef}`);
        onSaved(sj.record);
        return;
      }
      setMsg('Kimlik kaydı güncellendi.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function sendEgm() {
    if (!record?.id) {
      await save(true);
      return;
    }
    if (missing.length > 0) {
      setMsg('Önce eksik alanları doldurun.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/egm/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', id: record.id }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'EGM gönderimi başarısız'));
      const j = (await res.json()) as { record?: EgmIdentityRecord; error?: string };
      if (!j.record) throw new Error(j.error ?? 'EGM gönderimi başarısız');
      setMsg(`EGM bildirimi gönderildi · Ref: ${j.record.egmRef}`);
      onSaved(j.record);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'EGM gönderimi başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-egm-drawer-backdrop" onClick={onClose} role="presentation">
      <aside className="roomio-egm-drawer" onClick={(e) => e.stopPropagation()} aria-label="EGM kimlik bildirimi">
        <header className="roomio-egm-drawer__head">
          <div>
            <p className="roomio-egm-drawer__eyebrow">EGM / KBS Kimlik Bildirimi</p>
            <h2 className="roomio-card-title" style={{ margin: 0 }}>
              {form.refNo ? `${form.refNo} · ` : ''}{form.firstName} {form.lastName}
            </h2>
            {record ? <EgmStatusBadge status={record.status} /> : null}
          </div>
          <button type="button" className="roomio-egm-drawer__close" onClick={onClose} aria-label="Kapat">×</button>
        </header>

        {msg ? (
          <p
            className={`roomio-page-desc roomio-egm-drawer__msg${/başarısız|Yetkisiz|Oturum/i.test(msg) ? ' roomio-text-warn' : ''}`}
            role="status"
          >
            {msg}
          </p>
        ) : null}

        {missing.length > 0 && record?.status !== 'sent' ? (
          <div className="roomio-alert roomio-alert--warn roomio-egm-drawer__warn">
            Eksik alanlar: {missing.join(', ')}
          </div>
        ) : null}

        <div className="roomio-egm-drawer__body">
          <section className="roomio-egm-section">
            <h3>Temel bilgiler</h3>
            <div className="roomio-form-grid roomio-form-grid--2">
              <label className="roomio-field"><span>Ad *</span><input className="roomio-input" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} /></label>
              <label className="roomio-field"><span>Soyad *</span><input className="roomio-input" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} /></label>
              <label className="roomio-field"><span>Uyruk *</span><input className="roomio-input" value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} /></label>
              <label className="roomio-field"><span>Oda no *</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setField('roomNo', e.target.value)} /></label>
              <label className="roomio-field"><span>Giriş *</span><input className="roomio-input" type="date" value={form.checkIn} onChange={(e) => setField('checkIn', e.target.value)} /></label>
              <label className="roomio-field"><span>Çıkış</span><input className="roomio-input" type="date" value={form.checkOut ?? ''} onChange={(e) => setField('checkOut', e.target.value)} /></label>
            </div>
          </section>

          <section className="roomio-egm-section">
            <h3>Kimlik bilgileri</h3>
            <div className="roomio-form-grid roomio-form-grid--2">
              <label className="roomio-field">
                <span>Belge tipi</span>
                <select className="roomio-select" value={form.idType} onChange={(e) => setField('idType', e.target.value as EgmIdentityForm['idType'])}>
                  {Object.entries(EGM_ID_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="roomio-field"><span>Kimlik / pasaport no *</span><input className="roomio-input" value={form.idNo} onChange={(e) => setField('idNo', e.target.value)} /></label>
              <label className="roomio-field"><span>Doğum tarihi *</span><input className="roomio-input" type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} /></label>
              <label className="roomio-field"><span>Doğum yeri *</span><input className="roomio-input" value={form.birthPlace} onChange={(e) => setField('birthPlace', e.target.value)} /></label>
              <label className="roomio-field">
                <span>Cinsiyet *</span>
                <select className="roomio-select" value={form.gender} onChange={(e) => setField('gender', e.target.value as EgmIdentityForm['gender'])}>
                  <option value="">—</option>
                  {Object.entries(EGM_GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="roomio-field"><span>Baba adı *</span><input className="roomio-input" value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} /></label>
              <label className="roomio-field roomio-field--full"><span>Anne adı *</span><input className="roomio-input" value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} /></label>
            </div>
          </section>

          {record?.egmRef ? (
            <section className="roomio-egm-section roomio-egm-section--muted">
              <h3>EGM yanıtı</h3>
              <dl className="roomio-dl">
                <dt>Referans</dt><dd>{record.egmRef}</dd>
                <dt>Gönderim</dt><dd>{record.sentAt ?? '—'}</dd>
              </dl>
            </section>
          ) : null}
        </div>

        <footer className="roomio-egm-drawer__foot">
          <Button variant="secondary" onClick={onClose}>Kapat</Button>
          <PermissionGate permission="identity.notify">
            <Button variant="secondary" onClick={() => void save()} disabled={busy}>Kaydet</Button>
            {record?.status !== 'sent' ? (
              <Button onClick={() => void sendEgm()} disabled={busy || (Boolean(record) && missing.length > 0)}>
                EGM&apos;ye gönder
              </Button>
            ) : null}
          </PermissionGate>
        </footer>
      </aside>
    </div>
  );
}
