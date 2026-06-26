'use client';

import { X } from 'lucide-react';
import { ReservationFormWizard } from '@/components/forms/ReservationFormWizard';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function ReservationListWizardModal({ open, onClose, onCreated }: Props) {
  if (!open) return null;

  return (
    <div className="roomio-rez-design-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="roomio-rez-list-wizard-modal"
        role="dialog"
        aria-labelledby="rez-list-wizard-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="roomio-rez-list-wizard-modal__head">
          <div>
            <p className="roomio-rez-design-wizard__eyebrow">Rezervasyon Sihirbazı</p>
            <h2 id="rez-list-wizard-title">Yeni Rezervasyon</h2>
            <p className="roomio-rez-design-wizard__sub">
              Listeyi kapatmadan kayıt oluşturun — kayıt sonrası liste otomatik yenilenir.
            </p>
          </div>
          <button type="button" className="roomio-rez-design-wizard__close" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>
        <div className="roomio-rez-list-wizard-modal__body">
          <ReservationFormWizard
            embedded
            onCancel={onClose}
            onComplete={() => {
              onCreated?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
