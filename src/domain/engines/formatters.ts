// Single cached Intl.NumberFormat instance to avoid repeated allocations across renders
const TR_NUMBER_FORMATTER = new Intl.NumberFormat('tr-TR');

/**
 * Normalizes Turkish phone numbers into WhatsApp wa.me format (e.g., 905321234567).
 */
export function normalizeTurkishPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('90') && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `9${digits}`;
  }
  if (digits.startsWith('5') && digits.length === 10) {
    return `90${digits}`;
  }
  return digits;
}

/**
 * Builds a native Zero-API WhatsApp deep link.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeTurkishPhone(phone);
  const encoded = encodeURIComponent(message);
  if (!normalized) {
    return `https://wa.me/?text=${encoded}`;
  }
  return `https://wa.me/${normalized}?text=${encoded}`;
}

/**
 * Formats Turkish Lira currency cleanly using a cached formatter.
 */
export function formatTL(amount: number): string {
  return `${TR_NUMBER_FORMATTER.format(Math.round(amount))} ₺`;
}

/**
 * Formats minutes into natural Turkish duration string (e.g., "1 saat 45 dk", "45 dk").
 */
export function formatDurationTr(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 dk';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} dk`;
  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dk`;
}

/**
 * Extracts first name with polite Turkish address ("Zeynep Hanım").
 */
export function getPoliteFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || 'Değerli Misafirimiz';
  return `${first} Hanım`;
}

/**
 * Validates that an image URL uses a safe scheme (https:// or local root-relative /images/).
 * Prevents javascript: or untrusted URI injection via imported JSON backups.
 */
export function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (trimmed.startsWith('/images/')) return !trimmed.includes('..');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
