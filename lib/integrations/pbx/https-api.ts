import crypto from 'node:crypto';

type ApiEnvelope = {
  response?: {
    status?: number | string;
    challenge?: string;
    cookie?: string;
    message?: string;
    [key: string]: unknown;
  };
};

function md5(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex');
}

export function pmsToken(username: string, password: string): string {
  return md5(`${username}${password}`);
}

export async function ucmApiPost(
  host: string,
  port: number,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ ok: boolean; data: ApiEnvelope; raw: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `https://${host}:${port}/api`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', Connection: 'close' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await res.text();
    let data: ApiEnvelope = {};
    try {
      data = JSON.parse(raw) as ApiEnvelope;
    } catch {
      return { ok: false, data: {}, raw };
    }
    const status = Number(data.response?.status ?? -1);
    return { ok: status === 0, data, raw };
  } finally {
    clearTimeout(timer);
  }
}

export async function ucmLogin(
  host: string,
  port: number,
  apiUsername: string,
  apiPassword: string,
  apiVersion: string,
  timeoutMs: number,
): Promise<{ ok: boolean; cookie?: string; message: string; raw?: string }> {
  const challengeRes = await ucmApiPost(
    host,
    port,
    { request: { action: 'challenge', user: apiUsername, version: apiVersion } },
    timeoutMs,
  );
  const challenge = challengeRes.data.response?.challenge;
  if (!challengeRes.ok || !challenge) {
    return {
      ok: false,
      message: challengeRes.data.response?.message?.toString() ?? 'UCM challenge başarısız',
      raw: challengeRes.raw,
    };
  }

  const loginToken = md5(`${challenge}${apiPassword}`);
  const loginRes = await ucmApiPost(
    host,
    port,
    {
      request: {
        action: 'login',
        user: apiUsername,
        token: loginToken,
      },
    },
    timeoutMs,
  );
  const cookie = loginRes.data.response?.cookie;
  if (!loginRes.ok || !cookie) {
    return {
      ok: false,
      message: loginRes.data.response?.message?.toString() ?? 'UCM login başarısız',
      raw: loginRes.raw,
    };
  }
  return { ok: true, cookie, message: 'UCM API oturumu açıldı', raw: loginRes.raw };
}

export async function ucmPmsAction(
  host: string,
  port: number,
  cookie: string,
  pmsUser: string,
  pmsPass: string,
  data: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ ok: boolean; message: string; raw: string }> {
  const res = await ucmApiPost(
    host,
    port,
    {
      request: {
        action: 'pmsapi',
        cookie,
        token: pmsToken(pmsUser, pmsPass),
        format: 'json',
        data,
      },
    },
    timeoutMs,
  );
  return {
    ok: res.ok,
    message: res.ok
      ? 'PMS API işlemi başarılı'
      : res.data.response?.message?.toString() ?? 'PMS API hatası',
    raw: res.raw,
  };
}
