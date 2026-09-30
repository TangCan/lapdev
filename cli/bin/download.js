import http from 'node:http';
import { createHash } from 'node:crypto';
import { open, rm } from 'node:fs/promises';

class DownloadError extends Error {
  constructor(message, retryable = false) { super(message); this.retryable = retryable; }
}

export function configureProxy(env = process.env) {
  if (!['https_proxy', 'HTTPS_PROXY', 'http_proxy', 'HTTP_PROXY'].some((key) => env[key])) return () => {};
  if (typeof http.setGlobalProxyFromEnv !== 'function') {
    throw new DownloadError('a proxy is configured; automatic proxy downloads require Node.js 24.14+ (or use a local --runtime-dir)');
  }
  try { return http.setGlobalProxyFromEnv(env); }
  catch { throw new DownloadError('proxy configuration is invalid; check HTTP_PROXY/HTTPS_PROXY without disabling TLS validation'); }
}

function allowedUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new DownloadError('runtime download URL must use an allowed GitHub HTTPS source'); }
  const hosts = new Set(['github.com', 'api.github.com', 'objects.githubusercontent.com', 'raw.githubusercontent.com', 'release-assets.githubusercontent.com']);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || (url.port && url.port !== '443')) {
    throw new DownloadError('runtime download URL must use an allowed GitHub HTTPS source');
  }
  return url;
}

async function responseFor(raw, signal, fetchImpl) {
  let url = allowedUrl(raw);
  for (let hop = 0; hop <= 5; hop++) {
    const response = await fetchImpl(url, { redirect: 'manual', signal });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.ok) {
        await response.body?.cancel();
        throw new DownloadError(`HTTP ${response.status}`, [408, 429, 500, 502, 503, 504].includes(response.status));
      }
      return response;
    }
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw new DownloadError('runtime redirect is missing its destination');
    try { url = allowedUrl(new URL(location, url)); }
    catch { throw new DownloadError('runtime redirect must use an allowed GitHub HTTPS source'); }
  }
  throw new DownloadError('runtime download exceeded the redirect limit');
}

async function attempts(action, { label, timeoutMs, onRetry = () => {}, retryDelayMs = 1000 }) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const signal = AbortSignal.timeout(timeoutMs);
    try { return await action(signal, attempt); }
    catch (cause) {
      const error = cause instanceof DownloadError ? cause
        : signal.aborted ? new DownloadError(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`, true)
          : cause instanceof TypeError || ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(cause.code || cause.cause?.code)
            ? new DownloadError(`${label} network transfer failed`, true) : cause;
      if (!error.retryable || attempt === 3) throw error;
      onRetry({ attempt: attempt + 1, message: error.message });
      await new Promise((done) => setTimeout(done, retryDelayMs * attempt));
    }
  }
}

export async function fetchManifest(url, options = {}) {
  return attempts(async (signal) => {
    const response = await responseFor(url, signal, options.fetchImpl || fetch);
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > 1048576) throw new DownloadError('runtime manifest exceeds the size limit');
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new DownloadError('runtime manifest is not valid JSON'); }
  }, { label: 'manifest', timeoutMs: 30000, ...options });
}

export async function downloadAsset(url, destination, expected, options = {}) {
  const total = Number(expected.size);
  if (!Number.isSafeInteger(total) || total <= 0 || !/^[a-f0-9]{64}$/i.test(expected.sha256)) throw new DownloadError('runtime asset integrity metadata is invalid');
  try {
    await attempts(async (signal, attempt) => {
      const response = await responseFor(url, signal, options.fetchImpl || fetch);
      const file = await open(destination, 'w');
      const hash = createHash('sha256');
      let bytes = 0;
      const started = Date.now();
      options.onProgress?.({ bytes, total, attempt, elapsedMs: 0 });
      try {
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > total) throw new DownloadError('runtime asset exceeds its declared size');
          hash.update(chunk);
          await file.writeFile(chunk);
          options.onProgress?.({ bytes, total, attempt, elapsedMs: Date.now() - started });
        }
      } finally { await file.close(); }
      if (bytes !== total || hash.digest('hex') !== expected.sha256.toLowerCase()) throw new DownloadError('runtime asset integrity mismatch');
    }, { label: 'runtime download', timeoutMs: 300000, ...options });
  } catch (error) {
    await rm(destination, { force: true });
    throw error;
  }
}
