import type { Client, SessionLog, TechnicalParams } from '../types/studio';

export type SessionSmartCategory = 'KRITIK_UYARI' | 'OZEL_ISTEK' | 'STANDART';
export type SessionSmartFilter = 'ALL' | SessionSmartCategory;

export interface AutoTagItem {
  id: string;
  label: string;
  category: 'KRITIK_UYARI' | 'OZEL_ISTEK';
  reason: string;
}

export interface SessionClassification {
  primaryCategory: SessionSmartCategory;
  hasCriticalWarning: boolean;
  hasSpecialRequest: boolean;
  tags: AutoTagItem[];
}

export interface ClassifiedSessionRecord {
  session: SessionLog;
  client: Client;
  classification: SessionClassification;
}

interface RuleDef {
  id: string;
  label: string;
  category: 'KRITIK_UYARI' | 'OZEL_ISTEK';
  patterns: readonly RegExp[];
  allowNegationCheck?: boolean;
  reasonPrefix: string;
}

const NEGATION_SUFFIX =
  /(?:\s+ve\s+[a-zçğıöşü]+)?\s+(?:yok|yoktu|olmadı|oluşmadı|görülmedi|yaşanmadı|mevcut değil|bulunmuyor)/i;

function hasNegatedMatch(text: string, matchIndex: number, matchLength: number): boolean {
  const after = text.slice(matchIndex + matchLength, matchIndex + matchLength + 42);
  return NEGATION_SUFFIX.test(after);
}

const CRITICAL_RULES: readonly RuleDef[] = [
  {
    id: 'explicit-critical',
    label: 'Kritik Uyarı',
    category: 'KRITIK_UYARI',
    patterns: [/\[kritik\s*uyarı\]/i, /\bkritik\s*uyarı\b/i, /\bdikkat\s*:/i, /\bönemli\s*uyarı\b/i],
    reasonPrefix: 'Uzman işareti',
  },
  {
    id: 'contraindication',
    label: 'Kontrendikasyon / Sağlık',
    category: 'KRITIK_UYARI',
    patterns: [
      /\bhamile(?:lik)?\b/i,
      /\bgebe(?:lik)?\b/i,
      /\bemzir(?:me|iyor)\b/i,
      /\broaccutane\b/i,
      /\bizotretinoin\b/i,
      /\bantibiyotik\b/i,
      /\bkan\s+sulandırıcı\b/i,
      /\baçık\s+yara\b/i,
      /\benfeksiyon\b/i,
      /\buçuk\b/i,
      /\bmantar\b/i,
      /\begzama\b/i,
      /\bsedef\b/i,
      /\bsolaryum\b/i,
      /\bgüneş\s+yanığı\b/i,
    ],
    allowNegationCheck: true,
    reasonPrefix: 'Güvenlik taraması',
  },
  {
    id: 'allergy-protocol',
    label: 'Alerji / Özel Protokol',
    category: 'KRITIK_UYARI',
    patterns: [
      /\balerji(?:k|si)?\b/i,
      /\bhema[\s-]*free\b/i,
      /\bakrilik\s+toz[aı]?\s+hassasiyet/i,
      /\basitlere\s+kızarıklık/i,
      /\breaksiyon\b/i,
      /\bürtiker\b/i,
    ],
    allowNegationCheck: true,
    reasonPrefix: 'Alerji / içerik uyarısı',
  },
  {
    id: 'skin-reaction',
    label: 'Cilt Hassasiyeti / Tepki',
    category: 'KRITIK_UYARI',
    patterns: [
      /\bkızarıklık\b/i,
      /\btahriş\b/i,
      /\bkaşıntı\b/i,
      /\bşişlik\b/i,
      /\bödem\b/i,
      /\bkabuklanma\b/i,
      /\bmorarma\b/i,
      /\bkanama\b/i,
      /\byanık\b/i,
      /\byanma\s+hissi\b/i,
      /\bhassas\s+cilt\b/i,
      /\bhassasiyet\b/i,
    ],
    allowNegationCheck: true,
    reasonPrefix: 'Cilt gözlemi',
  },
];

const SPECIAL_REQUEST_RULES: readonly RuleDef[] = [
  {
    id: 'explicit-request',
    label: 'Özel İstek',
    category: 'OZEL_ISTEK',
    patterns: [/\[özel\s*istek\]/i, /\bözel\s*istek\b/i, /\bözel\s+talep\b/i],
    reasonPrefix: 'Uzman işareti',
  },
  {
    id: 'client-preference',
    label: 'Müşteri Tercihi',
    category: 'OZEL_ISTEK',
    patterns: [
      /\bistendi\b/i,
      /\bistiyor\b/i,
      /\btercih\b/i,
      /\brica\b/i,
      /\bdoğal\s+bırak/i,
      /\bince\s+kat\b/i,
      /\bnazik\s+(?:törpü|vakum|uygulama)/i,
      /\bdüşük\s+(?:enerji|derece|vakum)/i,
      /\bağrı\s+eşiği\b/i,
      /\bacı\s+eşiği\b/i,
      /\bparlak\s+top\s+coat\b/i,
      /\bmat\s+(?:bitiş|top\s+coat)\b/i,
      /\bfrench\b/i,
      /\bfransız\b/i,
      /\bombre\b/i,
      /\bnail\s*art\b/i,
    ],
    reasonPrefix: 'Not tercihi',
  },
];

/**
 * Toggles an explicit inline marker (`[Kritik Uyarı]` or `[Özel İstek]`) on technician note text.
 */
export function toggleTagMarker(
  text: string,
  marker: '[Kritik Uyarı]' | '[Özel İstek]'
): string {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`\\s*${escaped}\\s*`, 'gi');
  if (rx.test(text)) {
    return text.replace(rx, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  const trimmed = text.trim();
  return trimmed ? `${marker} ${trimmed}` : `${marker} `;
}

/**
 * Extracts numeric Joule energy value from text like "18 J", "16.5 joule", "14J".
 */
export function extractEnergyJouleValue(input?: string): number | null {
  if (!input || !input.trim()) return null;
  const match = input.match(/(\d+(?:[.,]\d+)?)\s*(?:j\b|joule)/i);
  if (match) {
    const num = Number(match[1].replace(',', '.'));
    return Number.isFinite(num) ? num : null;
  }
  const pureNum = input.trim().match(/^(\d+(?:[.,]\d+)?)$/);
  if (pureNum) {
    const num = Number(pureNum[1].replace(',', '.'));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function runRuleSet(rules: readonly RuleDef[], lowerText: string): AutoTagItem[] {
  const results: AutoTagItem[] = [];

  for (const rule of rules) {
    let matchedSnippet: string | null = null;
    for (const pattern of rule.patterns) {
      const m = lowerText.match(pattern);
      if (!m || m.index === undefined) continue;
      if (rule.allowNegationCheck && hasNegatedMatch(lowerText, m.index, m[0].length)) {
        continue;
      }
      matchedSnippet = m[0].trim();
      break;
    }

    if (matchedSnippet) {
      results.push({
        id: rule.id,
        label: rule.label,
        category: rule.category,
        reason: `${rule.reasonPrefix}: "${matchedSnippet}"`,
      });
    }
  }
  return results;
}

/**
 * Deterministically analyzes session notes, technical parameters, and client allergy notes
 * to automatically tag and categorize into 'Kritik Uyarı', 'Özel İstek', or 'Standart'.
 */
export function classifySessionNote(input: {
  notes?: string;
  rawNote?: string;
  technicalParams?: TechnicalParams;
  allergyNote?: string;
}): SessionClassification {
  const tp = input.technicalParams ?? {};
  const combinedLower = [
    input.rawNote ?? '',
    input.notes ?? '',
    input.allergyNote ?? '',
    tp.skinType ?? '',
    tp.productOrSerum ?? '',
    tp.bodyArea ?? '',
    tp.device ?? '',
  ]
    .filter(Boolean)
    .join(' · ')
    .toLocaleLowerCase('tr-TR');

  const tags: AutoTagItem[] = [];
  const seenIds = new Set<string>();

  const pushTag = (tag: AutoTagItem) => {
    if (seenIds.has(tag.id)) return;
    seenIds.add(tag.id);
    tags.push(tag);
  };

  for (const t of runRuleSet(CRITICAL_RULES, combinedLower)) {
    pushTag(t);
  }

  const jouleFromParam = extractEnergyJouleValue(tp.energyJoule);
  const jouleFromText =
    jouleFromParam === null
      ? extractEnergyJouleValue(`${input.rawNote ?? ''} ${input.notes ?? ''}`)
      : null;
  const detectedJoule = jouleFromParam ?? jouleFromText;

  if (detectedJoule !== null && detectedJoule >= 16) {
    pushTag({
      id: 'high-energy-joule',
      label: `Yüksek Enerji (${detectedJoule} J)`,
      category: 'KRITIK_UYARI',
      reason: `Teknik parametre: ${detectedJoule} J (≥ 16 J soğutma/cilt kontrolü)`,
    });
  }

  for (const t of runRuleSet(SPECIAL_REQUEST_RULES, combinedLower)) {
    pushTag(t);
  }

  if (tp.colorOrPigmentCode?.trim()) {
    pushTag({
      id: 'custom-color-pigment',
      label: 'Özel Renk / Pigment',
      category: 'OZEL_ISTEK',
      reason: `Teknik formül: ${tp.colorOrPigmentCode.trim()}`,
    });
  }

  if (tp.nailShape?.trim()) {
    pushTag({
      id: 'custom-nail-shape',
      label: `Özel Form (${tp.nailShape.trim()})`,
      category: 'OZEL_ISTEK',
      reason: `Tırnak formu: ${tp.nailShape.trim()}`,
    });
  }

  if (tp.curlOrShield?.trim()) {
    pushTag({
      id: 'custom-curl-shield',
      label: 'Özel Kıvrım / Ped',
      category: 'OZEL_ISTEK',
      reason: `Kıvrım tercihi: ${tp.curlOrShield.trim()}`,
    });
  }

  const hasCriticalWarning = tags.some((t) => t.category === 'KRITIK_UYARI');
  const hasSpecialRequest = tags.some((t) => t.category === 'OZEL_ISTEK');

  const primaryCategory: SessionSmartCategory = hasCriticalWarning
    ? 'KRITIK_UYARI'
    : hasSpecialRequest
      ? 'OZEL_ISTEK'
      : 'STANDART';

  return {
    primaryCategory,
    hasCriticalWarning,
    hasSpecialRequest,
    tags,
  };
}

/**
 * Flattens all clients' session logs, classifies each record, and sorts newest first.
 */
export function buildClassifiedSessionFeed(clients: Client[]): ClassifiedSessionRecord[] {
  const records: ClassifiedSessionRecord[] = [];
  for (const client of clients) {
    for (const session of client.sessions) {
      records.push({
        client,
        session,
        classification: classifySessionNote({
          notes: session.notes,
          technicalParams: session.technicalParams,
          allergyNote: client.allergyNote,
        }),
      });
    }
  }
  return records.sort((a, b) => b.session.date.localeCompare(a.session.date));
}

/**
 * Smart filter for classified session logs by category and free-text query.
 */
export function filterClassifiedSessions(
  records: ClassifiedSessionRecord[],
  filter: SessionSmartFilter,
  query: string
): ClassifiedSessionRecord[] {
  const normalizedQuery = query.toLocaleLowerCase('tr-TR').trim();

  return records.filter((rec) => {
    if (filter === 'KRITIK_UYARI' && !rec.classification.hasCriticalWarning) return false;
    if (filter === 'OZEL_ISTEK' && !rec.classification.hasSpecialRequest) return false;
    if (filter === 'STANDART' && rec.classification.primaryCategory !== 'STANDART') return false;

    if (!normalizedQuery) return true;

    const tp = rec.session.technicalParams;
    const haystack = [
      rec.client.name,
      rec.session.serviceName,
      rec.session.notes,
      rec.client.allergyNote ?? '',
      tp.device ?? '',
      tp.energyJoule ?? '',
      tp.bodyArea ?? '',
      tp.skinType ?? '',
      tp.productOrSerum ?? '',
      tp.nailShape ?? '',
      tp.colorOrPigmentCode ?? '',
      tp.curlOrShield ?? '',
      ...rec.classification.tags.map((t) => `${t.label} ${t.reason}`),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR');

    return haystack.includes(normalizedQuery);
  });
}
