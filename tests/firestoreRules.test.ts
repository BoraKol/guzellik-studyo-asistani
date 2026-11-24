import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
const schemaPath = path.resolve(process.cwd(), 'docs/firestore-schema.json');

const rulesText = fs.readFileSync(rulesPath, 'utf8');
const storageRulesText = fs.readFileSync(storageRulesPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as {
  firestore: Record<string, unknown>;
};

test('firestore.rules enforces default-deny catch-all and rules_version 2', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('match /{document=**} {\n      allow read, write: if false;'));
});

test('firestore.rules enforces verified email auth and strict studio owner isolation', () => {
  assert.ok(rulesText.includes('request.auth != null && request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('request.auth.uid == studioId'));
  assert.ok(!rulesText.includes('allow read: if isSignedIn();'));
  assert.ok(!rulesText.includes('allow list: if isSignedIn();'));
});

test('firestore.rules covers every collection declared in docs/firestore-schema.json', () => {
  const paths = Object.keys(schema.firestore);
  assert.equal(paths.length, 4);
  assert.ok(rulesText.includes('match /studios/{studioId}'));
  assert.ok(rulesText.includes('match /services/{serviceId}'));
  assert.ok(rulesText.includes('match /clients/{clientId}'));
  assert.ok(rulesText.includes('match /appointments/{appointmentId}'));
});

test('firestore.rules enforces Master Gate, immutable fields, server timestamps, and shadow-field rejection', () => {
  assert.ok(rulesText.includes('studioExistsAndOwned(studioId)'));
  assert.ok(rulesText.includes('incoming().ownerId == existing().ownerId'));
  assert.ok(rulesText.includes('incoming().createdAt == existing().createdAt'));
  assert.ok(rulesText.includes('incoming().createdAt == request.time'));
  assert.ok(rulesText.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesText.includes('affectedKeys().hasOnly('));
  assert.ok(rulesText.includes('data.keys().hasOnly('));
  assert.ok(rulesText.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
});

test('storage.rules isolates uploads per verified studio owner and enforces image size/mime limits', () => {
  assert.ok(storageRulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(storageRulesText.includes('request.auth.uid == studioId'));
  assert.ok(storageRulesText.includes('5 * 1024 * 1024'));
  assert.ok(storageRulesText.includes("contentType.matches('image/.*')"));
});
