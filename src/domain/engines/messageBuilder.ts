import type { AftercareCardTemplate } from '../constants/deterministicTemplates';
import type {
  Appointment,
  Client,
  ServiceItem,
  StudioSettings,
} from '../types/studio';
import { formatDurationTr, formatTL, getPoliteFirstName } from './formatters';

/**
 * Pure deterministic estimation for Bio Link multi-service selection.
 */
export function estimateBioSelection(selectedServices: ServiceItem[]): {
  minPrice: number;
  maxPrice: number;
  totalMinutes: number;
} {
  return selectedServices.reduce(
    (acc, service) => ({
      minPrice: acc.minPrice + service.price,
      maxPrice: acc.maxPrice + (service.priceMax ?? service.price),
      totalMinutes: acc.totalMinutes + service.durationMinutes,
    }),
    { minPrice: 0, maxPrice: 0, totalMinutes: 0 }
  );
}

/**
 * Builds a deterministic, warm Turkish recall reminder message.
 */
export function buildRecallMessage(
  client: Client,
  settings: StudioSettings,
  daysSinceLastVisit: number
): string {
  const politeName = getPoliteFirstName(client.name);
  const weeks = Math.max(1, Math.round(daysSinceLastVisit / 7));
  const timePhrase =
    daysSinceLastVisit >= 14 ? `${weeks} hafta` : `${daysSinceLastVisit} gün`;

  const serviceLower = client.lastServiceName.toLocaleLowerCase('tr-TR');
  const servicePhrase = serviceLower.includes('bakım')
    ? `${serviceLower} işleminizin`
    : `${serviceLower} bakımınızın`;

  if (settings.messageTone === 'KURUMSAL') {
    return `Merhaba ${politeName}, ${settings.studioName} olarak bilgilendirmek isteriz: "${client.lastServiceName}" işleminizin üzerinden ${timePhrase} geçti. Düzenli bakım döngünüzü aksatmamak adına size uygun gün ve saat için randevunuzu oluşturabiliriz.`;
  }

  return `Merhaba ${politeName}, ${servicePhrase} üzerinden ${timePhrase} geçti. Uygun bir gününüz için yer ayıralım mı? — ${settings.studioName}`;
}

/**
 * Builds a deterministic tomorrow appointment confirmation message (No-Show prevention).
 */
export function buildNoShowConfirmationMessage(
  appointment: Appointment,
  settings: StudioSettings
): string {
  const politeName = getPoliteFirstName(appointment.clientName);
  if (settings.messageTone === 'KURUMSAL') {
    return `Merhaba ${politeName}, yarın saat ${appointment.time} için "${appointment.serviceName}" randevunuzu hatırlatmak isteriz. Randevunuzu teyit etmek veya saat değişikliği talep etmek için bu mesaja dönüş yapabilirsiniz. — ${settings.studioName}`;
  }
  return `Merhaba ${politeName}, yarın saat ${appointment.time} için ${appointment.serviceName} randevunuzu teyit etmek istedik. Gelecek misiniz, yoksa başka bir güne kaydıralım mı? Sevgiler, ${settings.studioName}`;
}

/**
 * Builds a structured Bio Link WhatsApp appointment request message.
 */
export function buildBioAppointmentRequestMessage(params: {
  clientName: string;
  preferredWindow: string;
  selectedServices: ServiceItem[];
  studioName: string;
  note?: string;
}): string {
  const { clientName, preferredWindow, selectedServices, studioName, note } = params;
  const { minPrice, maxPrice, totalMinutes } = estimateBioSelection(selectedServices);
  const serviceLines = selectedServices
    .map((s) => `• ${s.name} (${formatTL(s.price)}, ${s.durationMinutes} dk)`)
    .join('\n');
  const priceLabel =
    maxPrice > minPrice ? `${formatTL(minPrice)} – ${formatTL(maxPrice)}` : formatTL(minPrice);

  const lines = [
    `Merhaba ${studioName}, Instagram fiyat linkinizden randevu talep ediyorum.`,
    '',
    `Ad Soyad: ${clientName.trim() || 'Belirtilmedi'}`,
    `Tercih Edilen Zaman: ${preferredWindow}`,
    '',
    'Seçtiğim İşlemler:',
    serviceLines,
    '',
    `Tahmini Tutar: ${priceLabel}`,
    `Tahmini Süre: ~${formatDurationTr(totalMinutes)}`,
  ];

  if (note && note.trim()) {
    lines.push(`Not: ${note.trim()}`);
  }
  lines.push('', 'Uygun saatlerinizi paylaşabilir misiniz?');
  return lines.join('\n');
}

/**
 * Builds a formatted WhatsApp message for deterministic aftercare cards.
 */
export function buildAftercareWhatsAppMessage(
  card: AftercareCardTemplate,
  studioName: string,
  clientName?: string
): string {
  const greeting = clientName?.trim()
    ? `Merhaba ${getPoliteFirstName(clientName)},`
    : 'Merhaba,';
  const doLines = card.doItems.map((item) => `• ${item}`).join('\n');
  const dontLines = card.dontItems.map((item) => `• ${item}`).join('\n');

  return [
    greeting,
    'Bugünkü işleminiz için bakım rehberinizi paylaşıyoruz:',
    '',
    `${card.title} (${card.validWindow})`,
    '',
    'Yapılması Önerilenler:',
    doLines,
    '',
    'Kaçınılması Gerekenler:',
    dontLines,
    '',
    `Sonraki Randevu Önerisi: ${card.recommendedNextVisit}`,
    `Herhangi bir sorunuzda bize yazabilirsiniz. — ${studioName}`,
  ].join('\n');
}
