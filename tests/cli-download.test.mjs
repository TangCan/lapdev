import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { configureProxy, downloadAsset, fetchManifest } from '../cli/bin/download.js';

const url = 'https://github.com/TangCan/lapdev/releases/download/v1/runtime.tar.gz';
const bytes = Buffer.from('verified archive bytes');
const expected = { size: String(bytes.length), sha256: createHash('sha256').update(bytes).digest('hex') };
async function inTemp(action) {
  const temp = await mkdtemp(join(tmpdir(), 'lapdev-transfer-test-'));
  try { await action(join(temp, 'runtime.tar.gz')); } finally { await rm(temp, { recursive: true, force: true }); }
}
test('streamed download reports progress and writes matching bytes', () => inTemp(async path => {
  const progress = [];
  await downloadAsset(url, path, expected, { fetchImpl: async () => new Response(bytes), onProgress: e => progress.push(e.bytes) });
  assert.deepEqual(await readFile(path), bytes);
  assert.equal(progress[0], 0); assert.equal(progress.at(-1), bytes.length);
}));
test('partial network failure retries from zero without appending corrupt bytes', () => inTemp(async path => {
  let calls = 0;
  await downloadAsset(url, path, expected, { retryDelayMs: 0, fetchImpl: async () => {
    if (++calls > 1) return new Response(bytes);
    return new Response(new ReadableStream({ start(c) { c.enqueue(bytes.subarray(0, 4)); setTimeout(() => c.error(new TypeError('network interrupted')), 10); } }));
  } });
  assert.equal(calls, 2); assert.deepEqual(await readFile(path), bytes);
}));
test('checksum mismatch is not retried and removes temporary download', () => inTemp(async path => {
  let calls = 0;
  await assert.rejects(downloadAsset(url, path, { ...expected, sha256: '0'.repeat(64) }, { fetchImpl: async () => { calls++; return new Response(bytes); } }), /integrity mismatch/);
  assert.equal(calls, 1); await assert.rejects(access(path));
}));
test('oversized response fails before installing and is not retried', () => inTemp(async path => {
  let calls = 0;
  await assert.rejects(downloadAsset(url, path, { ...expected, size: '1' }, { fetchImpl: async () => { calls++; return new Response(bytes); } }), /exceeds its declared size/);
  assert.equal(calls, 1); await assert.rejects(access(path));
}));
test('timeout applies to response body and stops after three attempts', () => inTemp(async path => {
  let calls = 0;
  const retries = [];
  await assert.rejects(downloadAsset(url, path, expected, { timeoutMs: 15, retryDelayMs: 0, onRetry: e => retries.push(e.attempt), fetchImpl: async (_url, { signal }) => {
    calls++;
    return new Response(new ReadableStream({ start(c) {
      const timer = setTimeout(() => c.enqueue(bytes), 1000);
      signal.addEventListener('abort', () => { clearTimeout(timer); c.error(signal.reason); }, { once: true });
    } }));
  } }), /timed out/);
  assert.equal(calls, 3); assert.deepEqual(retries, [2, 3]); await assert.rejects(access(path));
}));
test('transient HTTP failure retries but 404 does not', async () => {
  let calls = 0;
  assert.deepEqual(await fetchManifest(url, { retryDelayMs: 0, fetchImpl: async () => ++calls === 1 ? new Response('', { status: 503 }) : new Response('{"ok":true}') }), { ok: true });
  assert.equal(calls, 2); calls = 0;
  await assert.rejects(fetchManifest(url, { fetchImpl: async () => { calls++; return new Response('', { status: 404 }); } }), /HTTP 404/);
  assert.equal(calls, 1);
});
test('redirect to untrusted host is rejected before fetching destination', async () => {
  let calls = 0;
  await assert.rejects(fetchManifest(url, { fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://evil.example/private?token=secret' } }); } }), /allowed GitHub HTTPS/);
  assert.equal(calls, 1);
});
test('approved redirect works and redirect loop is bounded', async () => {
  let calls = 0;
  assert.deepEqual(await fetchManifest(url, { fetchImpl: async () => ++calls === 1 ? new Response(null, { status: 302, headers: { location: 'https://release-assets.githubusercontent.com/asset' } }) : new Response('{"ok":true}') }), { ok: true });
  calls = 0;
  await assert.rejects(fetchManifest(url, { fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { location: url } }); } }), /redirect limit/);
  assert.equal(calls, 6);
});
test('malformed manifest is not retried', async () => {
  let calls = 0;
  await assert.rejects(fetchManifest(url, { fetchImpl: async () => { calls++; return new Response('invalid'); } }), /not valid JSON/);
  assert.equal(calls, 1);
});
test('configured lowercase proxy is passed to native support and restored', t => {
  if (typeof http.setGlobalProxyFromEnv !== 'function') return t.skip('native proxy API unavailable in this Node version');
  let restored = false;
  const env = { https_proxy: 'http://127.0.0.1:1234', no_proxy: 'localhost' };
  t.mock.method(http, 'setGlobalProxyFromEnv', actual => { assert.equal(actual, env); return () => { restored = true; }; });
  configureProxy(env)(); assert.equal(restored, true);
});
