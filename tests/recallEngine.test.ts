import assert from 'node:assert/strict';
import test from 'node:test';
import { AFTERCARE_CARDS } from '../src/domain/constants/deterministicTemplates.ts';
import { createDemoStudioData } from '../src/domain/data/demoStudioData.ts';
import {
  addDaysIso,
  buildAftercareWhatsAppMessage,
  buildBioAppointmentRequestMessage,
  buildDailyTimelineSlots,
  buildWeeklyTimelineDays,
  buildWhatsAppLink,
  computeDroppedAppointmentSlot,
  computeRecallRadar,
  diffDaysIso,
  estimateBioSelection,
  formatDurationTr,
  formatMinutesToTime,
  getRemainingSessions,
  incrementPackageSession,
  isClientRecallDue,
  isSafeImageUrl,
  matchesServiceFocus,
  normalizeTurkishPhone,
  parseTimeToMinutes,
  resolveServiceDuration,
  resolveServiceGroup,
} from '../src/domain/engines/recallEngine.ts';

test('normalizeTurkishPhone handles 05xx, +90, 5xx, and spaces', () => {
  assert.equal(normalizeTurkishPhone('0500 000 00 01'), '905000000001');
  assert.equal(normalizeTurkishPhone('+90 (500) 000-00-02'), '905000000002');
  assert.equal(normalizeTurkishPhone('5000000003'), '905000000003');
  assert.equal(normalizeTurkishPhone(''), '');
});

test('buildWhatsAppLink creates properly encoded wa.me URL with or without phone', () => {
  const withPhone = buildWhatsAppLink('0500 000 00 00', 'Merhaba Ayşe Hanım, randevunuz hazır.');
  assert.ok(withPhone.startsWith('https://wa.me/905000000000?text='));
  assert.ok(withPhone.includes(encodeURIComponent('Merhaba Ayşe Hanım, randevunuz hazır.')));

  const withoutPhone = buildWhatsAppLink('', 'Merhaba, randevu talebim var.');
  assert.equal(
    withoutPhone,
    `https://wa.me/?text=${encodeURIComponent('Merhaba, randevu talebim var.')}`
  );

  const demo = createDemoStudioData();
  assert.equal(demo.settings.whatsappPhone, '');
  assert.ok(demo.clients.every((c) => c.phone === ''));
  assert.ok(demo.appointments.every((a) => a.phone === ''));
});

test('isSafeImageUrl allows HTTPS and local /images/ paths while rejecting unsafe schemes', () => {
  assert.equal(isSafeImageUrl('/images/demo/before-nail.jpg'), true);
  assert.equal(isSafeImageUrl('https://firebasestorage.googleapis.com/v0/b/app/o/img.jpg'), true);
  assert.equal(isSafeImageUrl('javascript:alert(1)'), false);
  assert.equal(isSafeImageUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeImageUrl('http://insecure.example.com/a.jpg'), false);
  assert.equal(isSafeImageUrl('/images/../secret.txt'), false);
});

test('date math addDaysIso and diffDaysIso work deterministically across month boundaries', () => {
  assert.equal(addDaysIso('2026-11-24', 21), '2026-12-15');
  assert.equal(diffDaysIso('2026-11-24', '2026-11-21'), -3);
  assert.equal(diffDaysIso('2026-11-24', '2026-11-24'), 0);
  assert.equal(diffDaysIso('2026-11-24', '2026-11-28'), 4);
});

test('computeRecallRadar and isClientRecallDue separate dueNow and upcomingWeek accurately', () => {
  const refDate = new Date('2026-11-24T12:00:00Z');
  const demo = createDemoStudioData(refDate);
  const radar = computeRecallRadar(demo.clients, demo.settings, '2026-11-24');

  assert.equal(radar.dueNow.length, 3);
  assert.equal(radar.dueNow[0].client.name, 'Selin Kaya');
  assert.equal(radar.dueNow[0].urgency, 'OVERDUE');
  assert.equal(radar.dueNow[2].urgency, 'DUE_TODAY');

  assert.equal(radar.upcomingWeek.length, 3);
  assert.ok(radar.upcomingWeek.every((item) => item.urgency === 'UPCOMING_WEEK'));

  const dueCountFast = demo.clients.filter((c) => isClientRecallDue(c, '2026-11-24')).length;
  assert.equal(dueCountFast, radar.dueNow.length + radar.upcomingWeek.length);

  const denizRecall = radar.upcomingWeek.find((item) => item.client.name === 'Deniz Aydın');
  assert.ok(denizRecall);
  assert.equal(denizRecall.suggestedMessage.includes('bakımı bakımınızın'), false);
  assert.ok(denizRecall.suggestedMessage.includes('işleminizin üzerinden'));
});

test('incrementPackageSession increments completedSessions safely without exceeding total', () => {
  const pkg = {
    id: 'p1',
    name: '8 Seans Buz Lazer',
    category: 'LAZER_CILT' as const,
    totalSessions: 8,
    completedSessions: 7,
    paymentStatus: 'ODENDI' as const,
    startDate: '2026-01-01',
  };
  const updated = incrementPackageSession(pkg);
  assert.equal(updated?.completedSessions, 8);
  assert.equal(getRemainingSessions(updated), 0);

  const capped = incrementPackageSession(updated);
  assert.equal(capped?.completedSessions, 8);
});

test('estimateBioSelection sums prices, ranges, and durations accurately', () => {
  const demo = createDemoStudioData();
  const selected = [
    demo.services.find((s) => s.id === 'srv-lazer-koltuk')!,
    demo.services.find((s) => s.id === 'srv-tirnak-protez-yeni')!,
  ];
  const est = estimateBioSelection(selected);
  assert.equal(est.minPrice, 1900);
  assert.equal(est.maxPrice, 2100);
  assert.equal(est.totalMinutes, 105);
  assert.equal(formatDurationTr(est.totalMinutes), '1 saat 45 dk');

  const msg = buildBioAppointmentRequestMessage({
    clientName: 'Seda Kara',
    preferredWindow: 'Hafta içi akşam',
    selectedServices: selected,
    studioName: demo.settings.studioName,
  });
  assert.ok(msg.includes('Seda Kara'));
  assert.ok(msg.includes('Hafta içi akşam'));
  assert.ok(msg.includes('1 saat 45 dk'));
});

test('deterministic aftercare templates build valid WhatsApp message', () => {
  const msg = buildAftercareWhatsAppMessage(
    AFTERCARE_CARDS[0],
    'Vera Botanik Güzellik',
    'Elif Demir'
  );
  assert.ok(msg.includes('Merhaba Elif Hanım'));
  assert.ok(msg.includes('SPF 50+'));
  assert.ok(msg.includes('Vera Botanik Güzellik'));
});

test('service-focused navigation helpers classify all 4 beauty service tracks accurately', () => {
  const demo = createDemoStudioData();
  const lazerClients = demo.clients.filter((c) =>
    matchesServiceFocus(c.lastServiceName, c.primaryCategory, 'LAZER_EPILASYON', demo.services)
  );
  const ciltClients = demo.clients.filter((c) =>
    matchesServiceFocus(c.lastServiceName, c.primaryCategory, 'CILT_BAKIMI', demo.services)
  );
  const tirnakClients = demo.clients.filter((c) =>
    matchesServiceFocus(c.lastServiceName, c.primaryCategory, 'PROTEZ_TIRNAK_OJE', demo.services)
  );
  const kasKirpikClients = demo.clients.filter((c) =>
    matchesServiceFocus(c.lastServiceName, c.primaryCategory, 'KAS_KIRPIK', demo.services)
  );

  assert.equal(lazerClients.length, 2);
  assert.equal(ciltClients.length, 2);
  assert.equal(tirnakClients.length, 2);
  assert.equal(kasKirpikClients.length, 2);
  assert.equal(
    resolveServiceGroup('Tüm Vücut Buz Lazer', 'LAZER_CILT', demo.services),
    'LAZER_EPILASYON'
  );
  assert.equal(
    resolveServiceGroup('Kaş Laminasyon', 'TIRNAK_KAS_KIRPIK', demo.services),
    'KAS_KIRPIK'
  );
});

test('daily and weekly timeline builders group appointments with durations accurately', () => {
  assert.equal(parseTimeToMinutes('14:30'), 870);
  assert.equal(formatMinutesToTime(870 + 45), '15:15');

  const refDate = new Date('2026-11-24T12:00:00Z');
  const demo = createDemoStudioData(refDate);
  const todayIso = '2026-11-24';

  const duration = resolveServiceDuration('Hydrafacial Medikal Cilt Bakımı', demo.services);
  assert.equal(duration, 60);

  const slots = buildDailyTimelineSlots(demo.appointments, demo.services, todayIso, 9, 19);
  assert.equal(slots.length, 11);
  const totalInDaily = slots.reduce((sum, s) => sum + s.items.length, 0);
  const expectedToday = demo.appointments.filter((a) => a.date === todayIso).length;
  assert.equal(totalInDaily, expectedToday);
  assert.ok(expectedToday >= 3);

  const expanded = buildDailyTimelineSlots(
    [
      ...demo.appointments,
      {
        id: 'early-1',
        clientName: 'Erken Misafir',
        phone: '',
        date: todayIso,
        time: '08:15',
        serviceName: 'Kaş Laminasyon',
        category: 'TIRNAK_KAS_KIRPIK',
        status: 'ONAYLANDI',
      },
    ],
    demo.services,
    todayIso,
    9,
    19
  );
  assert.equal(expanded[0].hour, 8);
  assert.equal(expanded[0].items[0].endTime, '09:00');

  const weekDays = buildWeeklyTimelineDays(demo.appointments, demo.services, todayIso, todayIso);
  assert.equal(weekDays.length, 7);
  assert.equal(weekDays[0].isToday, true);
  assert.equal(weekDays[0].weekdayShort, 'Sal');
  assert.equal(weekDays[0].monthShort, 'Kas');
  assert.equal(weekDays[1].isTomorrow, true);
  assert.equal(weekDays[0].items.length, expectedToday);
});

test('computeDroppedAppointmentSlot preserves time on weekly drop and snaps hour on daily drop', () => {
  const movedDay = computeDroppedAppointmentSlot('2026-11-27', null, '14:30');
  assert.deepEqual(movedDay, { date: '2026-11-27', time: '14:30' });

  const movedHour = computeDroppedAppointmentSlot('2026-11-24', 16, '11:45');
  assert.deepEqual(movedHour, { date: '2026-11-24', time: '16:00' });

  const clampedHour = computeDroppedAppointmentSlot('2026-11-24', 25, '09:00');
  assert.deepEqual(clampedHour, { date: '2026-11-24', time: '23:00' });
});
