'use client';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { appendAudit, maskEmail, maskPhone } from '@/lib/kvkk';

export default function PrivacyPage() {
  function requestExport() {
    appendAudit({ user: 'Yakup K.', action: 'export_data', resource: 'guest_data', success: true });
    alert('KVKK veri talebi kaydedildi. 30 gün içinde yanıt (demo).');
  }

  function requestDelete() {
    appendAudit({ user: 'Yakup K.', action: 'delete_request', resource: 'guest_data', success: true });
    alert('Silme/anonymize talebi kaydedildi (demo).');
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Gizlilik"
      title="Gizlilik & Veri Talepleri"
      description="KVKK md. 11 — ilgili kişi hakları"
      actions={<Button variant="secondary" href="/settings">← Ayarlar</Button>}
    >
      <div className="roomio-card">
        <h2 className="roomio-card-title">PII Maskeleme Örneği</h2>
        <dl className="roomio-dl">
          <dt>E-posta</dt><dd>{maskEmail('ayse.yilmaz@email.com')}</dd>
          <dt>Telefon</dt><dd>{maskPhone('+90 532 111 2233')}</dd>
        </dl>
      </div>

      <div className="roomio-form-actions" style={{ marginTop: 20 }}>
        <Button onClick={requestExport}>Verilerimi İndir (talep)</Button>
        <Button variant="secondary" onClick={requestDelete}>Verilerimi Sil (talep)</Button>
      </div>
    </PageHeader>
  );
}
