import fs from 'node:fs/promises';
import path from 'node:path';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  backupsStagingRoot,
  ensureWritableBackupDir,
  resolveExternalBackupDir,
} from '@/lib/server/cloud-backup/paths';
import type { CloudBackupConfig, CloudBackupProviderId } from '@/lib/server/cloud-backup/types';

/**
 * Gateway sözleşmesi (ROOMIO_CLOUD_BACKUP_GATEWAY_URL / ROOMIO_S3_BACKUP_GATEWAY_URL):
 * Upload: POST { provider, fileName, mimeType, contentBase64, folderId? | bucket?, prefix? }
 *         → 2xx { ok?: true, remotePath?: string, fileId?: string, message?: string }
 * Prune:  POST { action: 'prune', provider, retainDays, olderThan, items: [{ remotePath, fileName, runId }] }
 *         → 2xx { ok?: true, removed?: number, message?: string }
 */

export type CloudUploadInput = {
  localPath: string;
  remoteName: string;
  mimeType?: string;
};

export type CloudUploadResult = {
  ok: boolean;
  message: string;
  remotePath?: string;
  /** Yedek dosyasının nihai konumu (harici disk dahil) */
  storedPath?: string;
  simulated?: boolean;
};

export type CloudPruneInput = {
  retainDays: number;
  olderThan: string;
  items: { runId: string; remotePath: string; startedAt: string; fileName: string }[];
};

export type CloudPruneResult = {
  ok: boolean;
  removed: number;
  message: string;
  simulated?: boolean;
};

export type CloudBackupProvider = {
  id: CloudBackupProviderId;
  test(config: CloudBackupConfig): Promise<CloudUploadResult>;
  upload(config: CloudBackupConfig, input: CloudUploadInput): Promise<CloudUploadResult>;
  pruneRemote?(config: CloudBackupConfig, input: CloudPruneInput): Promise<CloudPruneResult>;
};

function shouldSimulate(config: CloudBackupConfig): boolean {
  return !isIntegrationLiveMode() || config.simulateWhenOffline;
}

async function gatewayPrune(
  gatewayUrl: string,
  config: CloudBackupConfig,
  input: CloudPruneInput,
): Promise<CloudPruneResult> {
  if (shouldSimulate(config)) {
    return {
      ok: true,
      removed: input.items.length,
      simulated: true,
      message: `Simülasyon — ${input.items.length} uzak yedek silindi`,
    };
  }
  try {
    const res = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'prune',
        provider: config.provider,
        retainDays: input.retainDays,
        olderThan: input.olderThan,
        items: input.items,
        folderId: config.googleDrive.folderId,
        bucket: config.s3.bucket,
        prefix: config.s3.prefix,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      return { ok: false, removed: 0, message: `Gateway prune HTTP ${res.status}` };
    }
    const json = (await res.json().catch(() => ({}))) as { removed?: number; message?: string };
    return {
      ok: true,
      removed: json.removed ?? input.items.length,
      message: json.message ?? 'Uzak yedek temizlendi',
    };
  } catch (err) {
    return { ok: false, removed: 0, message: err instanceof Error ? err.message : 'Prune başarısız' };
  }
}

const localProvider: CloudBackupProvider = {
  id: 'local',
  async test(config) {
    const external = resolveExternalBackupDir(config);
    if (external) {
      const check = await ensureWritableBackupDir(external);
      if (!check.ok) return { ok: false, simulated: false, message: check.message };
      return { ok: true, simulated: false, message: `Harici disk hazır: ${external}` };
    }
    const staging = backupsStagingRoot();
    await fs.mkdir(staging, { recursive: true });
    return { ok: true, simulated: true, message: `Yerel yedek klasörü hazır (${staging})` };
  },
  async upload(config, input) {
    const external = resolveExternalBackupDir(config);
    if (!external) {
      return {
        ok: true,
        simulated: true,
        storedPath: input.localPath,
        remotePath: input.localPath,
        message: `Yerel arşiv: ${input.localPath}`,
      };
    }

    const check = await ensureWritableBackupDir(external);
    if (!check.ok) {
      return { ok: false, simulated: false, message: check.message };
    }

    const dest = path.join(external, input.remoteName);
    try {
      await fs.copyFile(input.localPath, dest);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Harici diske kopyalanamadı';
      return { ok: false, simulated: false, message: msg };
    }

    return {
      ok: true,
      simulated: false,
      storedPath: dest,
      remotePath: dest,
      message: `Harici diske yedeklendi: ${dest}`,
    };
  },
};

const googleDriveProvider: CloudBackupProvider = {
  id: 'google-drive',
  async test(config) {
    if (shouldSimulate(config)) {
      return {
        ok: true,
        simulated: true,
        message: `Simülasyon — Google Drive (${config.googleDrive.folderId || 'varsayılan klasör'})`,
      };
    }
    const probe = await probeLiveGateway('ROOMIO_CLOUD_BACKUP_GATEWAY_URL', 'Cloud Backup');
    if (!probe.ok) return { ok: false, simulated: false, message: probe.message };
    return { ok: true, simulated: false, message: 'Google Drive gateway erişilebilir' };
  },
  async upload(config, input) {
    if (shouldSimulate(config)) {
      return {
        ok: true,
        simulated: true,
        remotePath: `gdrive://${config.googleDrive.folderId || 'roomio-backups'}/${input.remoteName}`,
        message: `Simülasyon — Google Drive'a yüklendi: ${input.remoteName}`,
      };
    }
    const gateway = process.env.ROOMIO_CLOUD_BACKUP_GATEWAY_URL?.trim();
    if (!gateway) {
      return { ok: false, simulated: false, message: 'ROOMIO_CLOUD_BACKUP_GATEWAY_URL tanımlı değil' };
    }
    const body = await fs.readFile(input.localPath);
    const res = await fetch(gateway, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        provider: 'google-drive',
        folderId: config.googleDrive.folderId,
        fileName: input.remoteName,
        mimeType: input.mimeType ?? 'application/gzip',
        contentBase64: body.toString('base64'),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      return { ok: false, simulated: false, message: `Google Drive gateway HTTP ${res.status}` };
    }
    const json = (await res.json().catch(() => ({}))) as { fileId?: string; path?: string };
    return {
      ok: true,
      simulated: false,
      remotePath: json.path ?? `gdrive://${json.fileId ?? input.remoteName}`,
      message: 'Google Drive yükleme tamamlandı',
    };
  },
  async pruneRemote(config, input) {
    const gateway = process.env.ROOMIO_CLOUD_BACKUP_GATEWAY_URL?.trim();
    if (!gateway) {
      return { ok: false, removed: 0, message: 'ROOMIO_CLOUD_BACKUP_GATEWAY_URL tanımlı değil' };
    }
    return gatewayPrune(gateway, config, input);
  },
};

const s3Provider: CloudBackupProvider = {
  id: 's3',
  async test(config) {
    if (shouldSimulate(config)) {
      return {
        ok: true,
        simulated: true,
        message: `Simülasyon — S3 ${config.s3.bucket || 'bucket'}`,
      };
    }
    const probe = await probeLiveGateway('ROOMIO_S3_BACKUP_GATEWAY_URL', 'S3 Backup');
    if (!probe.ok) return { ok: false, simulated: false, message: probe.message };
    return { ok: true, simulated: false, message: 'S3 gateway erişilebilir' };
  },
  async upload(config, input) {
    const key = `${config.s3.prefix.replace(/\/?$/, '/')}${input.remoteName}`;
    if (shouldSimulate(config)) {
      return {
        ok: true,
        simulated: true,
        remotePath: `s3://${config.s3.bucket}/${key}`,
        message: `Simülasyon — S3 yüklendi: ${key}`,
      };
    }
    const gateway = process.env.ROOMIO_S3_BACKUP_GATEWAY_URL?.trim() ?? process.env.ROOMIO_CLOUD_BACKUP_GATEWAY_URL?.trim();
    if (!gateway) {
      return { ok: false, simulated: false, message: 'S3 backup gateway URL tanımlı değil' };
    }
    const body = await fs.readFile(input.localPath);
    const res = await fetch(gateway, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 's3',
        bucket: config.s3.bucket,
        region: config.s3.region,
        endpoint: config.s3.endpoint,
        key,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
        contentBase64: body.toString('base64'),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      return { ok: false, simulated: false, message: `S3 gateway HTTP ${res.status}` };
    }
    return { ok: true, simulated: false, remotePath: `s3://${config.s3.bucket}/${key}`, message: 'S3 yükleme tamamlandı' };
  },
  async pruneRemote(config, input) {
    const gateway = process.env.ROOMIO_S3_BACKUP_GATEWAY_URL?.trim() ?? process.env.ROOMIO_CLOUD_BACKUP_GATEWAY_URL?.trim();
    if (!gateway) {
      return { ok: false, removed: 0, message: 'S3 backup gateway URL tanımlı değil' };
    }
    return gatewayPrune(gateway, config, input);
  },
};

const webhookProvider: CloudBackupProvider = {
  id: 'webhook',
  async test(config) {
    if (!config.webhook.url.trim()) {
      return { ok: false, simulated: true, message: 'Webhook URL boş' };
    }
    if (shouldSimulate(config)) {
      return { ok: true, simulated: true, message: `Simülasyon — webhook ${config.webhook.url}` };
    }
    try {
      const res = await fetch(config.webhook.url, {
        method: 'HEAD',
        headers: config.webhook.apiKey
          ? { [config.webhook.headerName]: config.webhook.apiKey }
          : undefined,
        signal: AbortSignal.timeout(10_000),
      });
      return { ok: res.ok || res.status === 405, simulated: false, message: `Webhook erişilebilir (HTTP ${res.status})` };
    } catch (err) {
      return { ok: false, simulated: false, message: err instanceof Error ? err.message : 'Webhook hatası' };
    }
  },
  async upload(config, input) {
    if (!config.webhook.url.trim()) {
      return { ok: false, simulated: true, message: 'Webhook URL boş' };
    }
    if (shouldSimulate(config)) {
      return {
        ok: true,
        simulated: true,
        remotePath: config.webhook.url,
        message: `Simülasyon — webhook gönderildi: ${input.remoteName}`,
      };
    }
    const body = await fs.readFile(input.localPath);
    const res = await fetch(config.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/gzip',
        ...(config.webhook.apiKey ? { [config.webhook.headerName]: config.webhook.apiKey } : {}),
        'X-Roomio-Backup-File': input.remoteName,
      },
      body,
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      return { ok: false, simulated: false, message: `Webhook HTTP ${res.status}` };
    }
    return { ok: true, simulated: false, remotePath: config.webhook.url, message: 'Webhook yedek gönderildi' };
  },
  async pruneRemote(config, input) {
    if (shouldSimulate(config)) {
      return {
        ok: true,
        removed: input.items.length,
        simulated: true,
        message: `Simülasyon — webhook ${input.items.length} kayıt temizlendi`,
      };
    }
    if (!config.webhook.url.trim()) {
      return { ok: false, removed: 0, message: 'Webhook URL boş' };
    }
    try {
      const res = await fetch(config.webhook.url.replace(/\/upload\/?$/, '/prune'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.webhook.apiKey ? { [config.webhook.headerName]: config.webhook.apiKey } : {}),
        },
        body: JSON.stringify({ action: 'prune', retainDays: input.retainDays, olderThan: input.olderThan, items: input.items }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        return { ok: false, removed: 0, message: `Webhook prune HTTP ${res.status}` };
      }
      const json = (await res.json().catch(() => ({}))) as { removed?: number };
      return { ok: true, removed: json.removed ?? input.items.length, message: 'Webhook prune tamamlandı' };
    } catch (err) {
      return { ok: false, removed: 0, message: err instanceof Error ? err.message : 'Webhook prune hatası' };
    }
  },
};

const PROVIDERS: Record<CloudBackupProviderId, CloudBackupProvider> = {
  local: localProvider,
  'google-drive': googleDriveProvider,
  s3: s3Provider,
  webhook: webhookProvider,
};

export function getCloudBackupProvider(id: CloudBackupProviderId): CloudBackupProvider {
  return PROVIDERS[id] ?? localProvider;
}

export function remoteBackupFileName(localPath: string): string {
  return path.basename(localPath);
}
