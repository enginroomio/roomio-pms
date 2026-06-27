'use client';

import { MasterCodesPanel } from '@/components/kurulus/MasterCodesPanel';
import { LanguagesSettingsPanel } from '@/components/kurulus/LanguagesSettingsPanel';
import { LanguageTextsPanel } from '@/components/kurulus/LanguageTextsPanel';
import { DilTanimlariTabs } from '@/components/kurulus/DilTanimlariTabs';
import type { DilTanimlariSection } from '@/lib/navigation/dil-tanimlari';

type Props = {
  section: DilTanimlariSection;
};

export function DilTanimlariHub({ section }: Props) {
  return (
    <div className="roomio-dil-hub">
      <DilTanimlariTabs active={section} />
      <div style={{ marginTop: 12 }}>
        {section === 'language' ? <LanguagesSettingsPanel /> : null}
        {section === 'lang-forms' ? <LanguageTextsPanel view="forms" /> : null}
        {section === 'lang-menus' ? <LanguageTextsPanel view="menus" /> : null}
        {section === 'lang-reports' ? <LanguageTextsPanel view="reports" /> : null}
        {section === 'nationalities' ? (
          <MasterCodesPanel kind="nationality" titleKey="nav.kurulus.nationalities" />
        ) : null}
      </div>
    </div>
  );
}
