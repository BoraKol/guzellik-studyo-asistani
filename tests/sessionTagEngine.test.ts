import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoStudioData } from '../src/domain/data/demoStudioData.ts';
import {
  buildClassifiedSessionFeed,
  classifySessionNote,
  extractEnergyJouleValue,
  filterClassifiedSessions,
  toggleTagMarker,
} from '../src/domain/engines/sessionTagEngine.ts';

test('extractEnergyJouleValue parses Turkish joule expressions cleanly', () => {
  assert.equal(extractEnergyJouleValue('14 J'), 14);
  assert.equal(extractEnergyJouleValue('18 joule buz lazer'), 18);
  assert.equal(extractEnergyJouleValue('16,5J'), 16.5);
  assert.equal(extractEnergyJouleValue(''), null);
});

test('toggleTagMarker adds and removes inline markers idempotently', () => {
  const added = toggleTagMarker('Kısa not', '[Kritik Uyarı]');
  assert.equal(added, '[Kritik Uyarı] Kısa not');
  const removed = toggleTagMarker(added, '[Kritik Uyarı]');
  assert.equal(removed, 'Kısa not');
});

test('classifySessionNote respects Turkish negations and does not false-flag healthy sessions', () => {
  const clean = classifySessionNote({
    notes: 'Koltuk altında belirgin seyrelme var. Kızarıklık ve hassasiyet yok, 5 hafta sonra kontrol.',
    technicalParams: {
      device: 'Soprano Ice Buz Lazer',
      energyJoule: '13 J',
      skinType: 'Tip 3',
    },
  });

  assert.equal(clean.hasCriticalWarning, false);
  assert.equal(clean.primaryCategory, 'STANDART');
  assert.equal(clean.tags.length, 0);
});

test('classifySessionNote flags critical warnings for high joule, allergy, and contraindications', () => {
  const highEnergy = classifySessionNote({
    notes: 'Bacak bölgesinde hafif kızarıklık gözlendi, soğutma uzatıldı.',
    technicalParams: {
      device: 'Diode 810nm',
      energyJoule: '18 J',
    },
  });

  assert.equal(highEnergy.hasCriticalWarning, true);
  assert.equal(highEnergy.primaryCategory, 'KRITIK_UYARI');
  assert.ok(highEnergy.tags.some((t) => t.id === 'high-energy-joule'));
  assert.ok(highEnergy.tags.some((t) => t.id === 'skin-reaction'));

  const contraindication = classifySessionNote({
    notes: 'Müşteri son 1 ayda antibiyotik kullandığını belirtti, test atışı yapıldı.',
  });
  assert.equal(contraindication.hasCriticalWarning, true);
  assert.ok(contraindication.tags.some((t) => t.id === 'contraindication'));
});

test('classifySessionNote detects special requests from notes and technical formulas', () => {
  const nailRequest = classifySessionNote({
    notes: 'Süt beyazı ince kat istendi, parlak top coat ile bitirildi.',
    technicalParams: {
      nailShape: 'Orta Badem',
      colorOrPigmentCode: '#104 Süt Beyazı',
      productOrSerum: 'HEMA-Free Builder Gel',
    },
  });

  assert.equal(nailRequest.hasCriticalWarning, true);
  assert.equal(nailRequest.hasSpecialRequest, true);
  assert.equal(nailRequest.primaryCategory, 'KRITIK_UYARI');
  assert.ok(nailRequest.tags.some((t) => t.id === 'allergy-protocol'));
  assert.ok(nailRequest.tags.some((t) => t.id === 'custom-color-pigment'));
  assert.ok(nailRequest.tags.some((t) => t.id === 'custom-nail-shape'));

  const pureRequest = classifySessionNote({
    notes: 'Kaş uçları doğal bırakıldı, yumuşak geçiş tercih edildi.',
    technicalParams: {
      colorOrPigmentCode: '#3.1 Küllü Kahve',
    },
  });
  assert.equal(pureRequest.hasCriticalWarning, false);
  assert.equal(pureRequest.hasSpecialRequest, true);
  assert.equal(pureRequest.primaryCategory, 'OZEL_ISTEK');
});

test('buildClassifiedSessionFeed and filterClassifiedSessions filter demo records accurately', () => {
  const demo = createDemoStudioData(new Date('2026-11-24T12:00:00Z'));
  const feed = buildClassifiedSessionFeed(demo.clients);
  assert.ok(feed.length >= 8);

  const critical = filterClassifiedSessions(feed, 'KRITIK_UYARI', '');
  const requests = filterClassifiedSessions(feed, 'OZEL_ISTEK', '');
  const standard = filterClassifiedSessions(feed, 'STANDART', '');

  assert.ok(critical.length >= 3);
  assert.ok(requests.length >= 4);
  assert.ok(critical.every((r) => r.classification.hasCriticalWarning));
  assert.ok(requests.every((r) => r.classification.hasSpecialRequest));
  assert.ok(standard.every((r) => r.classification.primaryCategory === 'STANDART'));

  const searchBadem = filterClassifiedSessions(feed, 'OZEL_ISTEK', 'badem');
  assert.ok(searchBadem.length >= 1);
  assert.ok(searchBadem.every((r) => r.client.name === 'Selin Kaya'));
});
