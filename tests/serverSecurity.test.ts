import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HttpError,
  parseRequestBody,
  sanitizeStringList,
  sanitizeText,
  toPublicErrorResponse,
} from '../server/http/parseBody.ts';
import { createRateLimiter } from '../server/http/rateLimiter.ts';
import { applySecurityHeaders } from '../server/http/securityHeaders.ts';

test('parseRequestBody safely handles objects, JSON strings, arrays, and invalid JSON', () => {
  assert.deepEqual(parseRequestBody({ a: 1 }), { a: 1 });
  assert.deepEqual(parseRequestBody('{"noteText":"test"}'), { noteText: 'test' });
  assert.deepEqual(parseRequestBody('[1,2,3]'), {});
  assert.deepEqual(parseRequestBody('{bad json'), {});
  assert.deepEqual(parseRequestBody(null), {});
});

test('sanitizeText strips control characters and enforces length limits', () => {
  assert.equal(sanitizeText('  Merhaba\x00\x07 Dünya  ', 50), 'Merhaba Dünya');
  assert.equal(sanitizeText('abcdefghij', 5), 'abcde');
  assert.equal(sanitizeText(12345, 10), '');
});

test('sanitizeStringList caps array length and filters invalid entries', () => {
  const result = sanitizeStringList(['  Lazer  ', 42, '', 'Cilt', 'Tırnak'], 2, 20);
  assert.deepEqual(result, ['Lazer', 'Cilt']);
});

test('toPublicErrorResponse exposes HttpError messages but hides internal errors', () => {
  const httpRes = toPublicErrorResponse(new HttpError(400, 'Eksik alan'), 'Genel hata');
  assert.equal(httpRes.statusCode, 400);
  assert.equal(httpRes.body.error, 'Eksik alan');

  const rawRes = toPublicErrorResponse(new Error('INTERNAL_SDK_SECRET_STACK'), 'Genel hata');
  assert.equal(rawRes.statusCode, 500);
  assert.equal(rawRes.body.error, 'Genel hata');
});

test('createRateLimiter enforces sliding window and bounds memory usage', () => {
  const check = createRateLimiter({ windowMs: 1000, maxRequests: 2, maxTrackedKeys: 2 });
  assert.equal(check('ip-1', 100).allowed, true);
  assert.equal(check('ip-1', 200).allowed, true);
  const blocked = check('ip-1', 300);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);

  // After window expires, requests are allowed again
  assert.equal(check('ip-1', 1250).allowed, true);

  // Memory bound accepts new keys without throwing
  assert.equal(check('ip-2', 1260).allowed, true);
  assert.equal(check('ip-3', 1270).allowed, true);
});

test('applySecurityHeaders sets baseline security headers and optional no-store', () => {
  const headers = new Map<string, string>();
  applySecurityHeaders({ setHeader: (k, v) => headers.set(k, v) }, { noStore: true });

  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headers.get('X-Frame-Options'), 'DENY');
  assert.equal(headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(headers.get('Cache-Control'), 'no-store, max-age=0');
});
