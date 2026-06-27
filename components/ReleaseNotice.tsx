'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ReleaseManifest = {
  version: string;
  builtAt: string;
  launchId: string;
  label: string;
  gitSha?: string | null;
  gitBranch?: string | null;
};

export function ReleaseNotice() {
  const searchParams = useSearchParams();
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const launchId = searchParams.get('launch');
    void (async () => {
      try {
        const res = await fetch('/release-manifest.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ReleaseManifest;
        setManifest(data);

        const seenKey = 'roomio-release-seen';
        const seen = sessionStorage.getItem(seenKey);
        const shouldShow = launchId ? launchId === data.launchId : seen !== data.launchId;
        if (shouldShow) {
          setVisible(true);
          sessionStorage.setItem(seenKey, data.launchId);
        }
      } catch {
        // ignore
      }
    })();
  }, [searchParams]);

  if (!visible || !manifest) return null;

  return (
    <div className="roomio-release-notice" role="status">
      <div>
        <strong>Son güncelleme</strong>
        <span>{manifest.label}</span>
        {manifest.gitSha ? (
          <span className="roomio-release-notice__meta">
            {manifest.gitBranch ? `${manifest.gitBranch} · ` : ''}{manifest.gitSha}
          </span>
        ) : null}
      </div>
      <button type="button" className="roomio-link-btn" onClick={() => setVisible(false)} aria-label="Kapat">
        Kapat
      </button>
    </div>
  );
}
