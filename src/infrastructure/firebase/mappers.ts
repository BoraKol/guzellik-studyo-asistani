import { serverTimestamp } from 'firebase/firestore';
import type {
  Appointment,
  BeforeAfterPair,
  BioServiceGroup,
  Client,
  ClientPackage,
  ServiceItem,
  SessionLog,
  StudioData,
  StudioSettings,
} from '../../domain/types/studio';
import { addDaysIso, toIsoDate } from '../../domain/engines/dateUtils';
import { isSafeImageUrl } from '../../domain/engines/formatters';

const SAFE_DOC_ID_RX = /^[a-zA-Z0-9_-]{1,128}$/;

const VALID_BIO_GROUPS = new Set<BioServiceGroup>([
  'LAZER_EPILASYON',
  'CILT_BAKIMI',
  'PROTEZ_TIRNAK_OJE',
  'KAS_KIRPIK',
]);

export function isSafeDocumentId(id: string): boolean {
  return SAFE_DOC_ID_RX.test(id);
}

export function createDocumentId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${randomPart}`;
}

export function clampStr(val: string | undefined, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}

export function clampNum(
  val: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : fallback;
  return Math.min(max, Math.max(min, n));
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function normalizeBioGroup(val: unknown): BioServiceGroup {
  return typeof val === 'string' && VALID_BIO_GROUPS.has(val as BioServiceGroup)
    ? (val as BioServiceGroup)
    : 'LAZER_EPILASYON';
}

export function sanitizePackage(
  pkg: ClientPackage | undefined
): Record<string, unknown> | undefined {
  if (!pkg) return undefined;
  const totalSessions = clampNum(pkg.totalSessions, 1, 50, 6);
  const completedSessions = clampNum(pkg.completedSessions, 0, totalSessions, 0);
  const clean: Record<string, unknown> = {
    id: clampStr(pkg.id || createDocumentId('pkg'), 128),
    name: clampStr(pkg.name, 140) || 'Seans Paketi',
    category: pkg.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    totalSessions,
    completedSessions,
    paymentStatus:
      pkg.paymentStatus === 'KISMI' || pkg.paymentStatus === 'SEANS_BASI'
        ? pkg.paymentStatus
        : 'ODENDI',
    startDate: clampStr(pkg.startDate || toIsoDate(new Date()), 16),
  };
  if (typeof pkg.totalPrice === 'number' && Number.isFinite(pkg.totalPrice) && pkg.totalPrice >= 0) {
    clean.totalPrice = clampNum(pkg.totalPrice, 0, 1_000_000, 0);
  }
  return clean;
}

export function sanitizeSession(ses: SessionLog): Record<string, unknown> {
  const tp = ses.technicalParams ?? {};
  const tech = stripUndefined({
    device: tp.device ? clampStr(tp.device, 120) : undefined,
    energyJoule: tp.energyJoule ? clampStr(tp.energyJoule, 40) : undefined,
    bodyArea: tp.bodyArea ? clampStr(tp.bodyArea, 140) : undefined,
    skinType: tp.skinType ? clampStr(tp.skinType, 60) : undefined,
    productOrSerum: tp.productOrSerum ? clampStr(tp.productOrSerum, 160) : undefined,
    nailShape: tp.nailShape ? clampStr(tp.nailShape, 80) : undefined,
    colorOrPigmentCode: tp.colorOrPigmentCode ? clampStr(tp.colorOrPigmentCode, 100) : undefined,
    curlOrShield: tp.curlOrShield ? clampStr(tp.curlOrShield, 80) : undefined,
  });

  return stripUndefined({
    id: clampStr(ses.id, 128),
    clientId: clampStr(ses.clientId, 128),
    date: clampStr(ses.date, 16),
    category: ses.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    serviceId: ses.serviceId ? clampStr(ses.serviceId, 128) : undefined,
    serviceName: clampStr(ses.serviceName, 140),
    sessionNumber:
      typeof ses.sessionNumber === 'number' && ses.sessionNumber > 0
        ? Math.round(ses.sessionNumber)
        : undefined,
    technicalParams: tech,
    notes: clampStr(ses.notes, 500),
    nextRecallDays: clampNum(ses.nextRecallDays, 7, 180, 28),
    pricePaid:
      typeof ses.pricePaid === 'number' && Number.isFinite(ses.pricePaid)
        ? clampNum(ses.pricePaid, 0, 500_000, 0)
        : undefined,
  });
}

export function sanitizeBeforeAfter(pair: BeforeAfterPair): Record<string, unknown> | null {
  if (!isSafeImageUrl(pair.beforeUrl) || !isSafeImageUrl(pair.afterUrl)) {
    return null;
  }
  return stripUndefined({
    id: clampStr(pair.id, 128),
    date: clampStr(pair.date, 16),
    title: clampStr(pair.title, 140),
    category: pair.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    beforeUrl: clampStr(pair.beforeUrl, 2048),
    afterUrl: clampStr(pair.afterUrl, 2048),
    note: pair.note ? clampStr(pair.note, 240) : undefined,
  });
}

export function buildStudioUpdatePayload(settings: StudioSettings) {
  return {
    studioName: clampStr(settings.studioName, 120) || 'Güzellik Merkezim',
    instagramHandle: clampStr(settings.instagramHandle, 80),
    whatsappPhone: clampStr(settings.whatsappPhone, 32),
    workingHours: clampStr(settings.workingHours, 120),
    addressShort: clampStr(settings.addressShort, 120),
    bioSubtitle: clampStr(settings.bioSubtitle, 200),
    messageTone: settings.messageTone === 'KURUMSAL' ? 'KURUMSAL' : 'SAMIMI',
    defaultRecallDays: {
      lazer: clampNum(settings.defaultRecallDays?.lazer, 7, 120, 35),
      cilt: clampNum(settings.defaultRecallDays?.cilt, 7, 120, 30),
      tirnak: clampNum(settings.defaultRecallDays?.tirnak, 7, 120, 21),
      kasKirpik: clampNum(settings.defaultRecallDays?.kasKirpik, 7, 120, 45),
    },
    updatedAt: serverTimestamp(),
  };
}

export function buildStudioCreatePayload(uid: string, settings: StudioSettings) {
  return {
    ownerId: uid,
    ...buildStudioUpdatePayload(settings),
    createdAt: serverTimestamp(),
  };
}

export function buildServiceCreatePayload(uid: string, srv: Omit<ServiceItem, 'id'>) {
  const payload: Record<string, unknown> = {
    ownerId: uid,
    name: clampStr(srv.name, 140) || 'Hizmet',
    category: srv.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    bioGroup: normalizeBioGroup(srv.bioGroup),
    price: clampNum(srv.price, 1, 500_000, 500),
    durationMinutes: clampNum(srv.durationMinutes, 5, 600, 45),
    defaultRecallDays: clampNum(srv.defaultRecallDays, 7, 180, 28),
    showInBio: Boolean(srv.showInBio),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (typeof srv.priceMax === 'number' && srv.priceMax > 0) {
    payload.priceMax = clampNum(srv.priceMax, 0, 500_000, srv.price);
  }
  if (srv.description?.trim()) {
    payload.description = clampStr(srv.description, 240);
  }
  return payload;
}

export function buildClientCreatePayload(uid: string, client: Client) {
  const todayIso = toIsoDate(new Date());
  const safePhotos = (client.beforeAfterPhotos ?? [])
    .slice(0, 20)
    .map(sanitizeBeforeAfter)
    .filter((item): item is Record<string, unknown> => item !== null);

  const payload: Record<string, unknown> = {
    ownerId: uid,
    name: clampStr(client.name, 120) || 'Danışan',
    phone: clampStr(client.phone, 32),
    primaryCategory:
      client.primaryCategory === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    createdDate: clampStr(client.createdAt || todayIso, 16),
    lastVisitDate: clampStr(client.lastVisitDate || todayIso, 16),
    lastServiceName: clampStr(client.lastServiceName || 'Yeni Kayıt', 140),
    nextRecallDate: clampStr(client.nextRecallDate || addDaysIso(todayIso, 28), 16),
    recallCycleDays: clampNum(client.recallCycleDays, 7, 180, 28),
    sessions: (client.sessions ?? []).slice(0, 50).map(sanitizeSession),
    beforeAfterPhotos: safePhotos,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (client.allergyNote?.trim()) {
    payload.allergyNote = clampStr(client.allergyNote, 300);
  }
  if (client.lastRemindedAt?.trim()) {
    payload.lastRemindedAt = clampStr(client.lastRemindedAt, 16);
  }
  const cleanPkg = sanitizePackage(client.activePackage);
  if (cleanPkg) {
    payload.activePackage = cleanPkg;
  }
  return payload;
}

export function buildAppointmentCreatePayload(uid: string, apt: Omit<Appointment, 'id'>) {
  const payload: Record<string, unknown> = {
    ownerId: uid,
    clientName: clampStr(apt.clientName, 120) || 'Danışan',
    phone: clampStr(apt.phone, 32),
    date: clampStr(apt.date, 16),
    time: clampStr(apt.time, 8),
    serviceName: clampStr(apt.serviceName, 140) || 'İşlem',
    category: apt.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    status:
      apt.status === 'ONAYLANDI' || apt.status === 'IPTAL_ERTELENDI'
        ? apt.status
        : 'TEYIT_BEKLIYOR',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (apt.clientId?.trim()) {
    payload.clientId = clampStr(apt.clientId, 128);
  }
  if (apt.notes?.trim()) {
    payload.notes = clampStr(apt.notes, 300);
  }
  return payload;
}

export function mapStudioDoc(d: Record<string, unknown>): StudioSettings {
  const rd = (d.defaultRecallDays as Record<string, unknown> | undefined) ?? {};
  return {
    studioName: String(d.studioName ?? 'Güzellik Merkezim'),
    instagramHandle: String(d.instagramHandle ?? ''),
    whatsappPhone: String(d.whatsappPhone ?? ''),
    workingHours: String(d.workingHours ?? ''),
    addressShort: String(d.addressShort ?? ''),
    bioSubtitle: String(d.bioSubtitle ?? ''),
    messageTone: d.messageTone === 'KURUMSAL' ? 'KURUMSAL' : 'SAMIMI',
    defaultRecallDays: {
      lazer: Number(rd.lazer ?? 35),
      cilt: Number(rd.cilt ?? 30),
      tirnak: Number(rd.tirnak ?? 21),
      kasKirpik: Number(rd.kasKirpik ?? 45),
    },
  };
}

export function mapServiceDoc(id: string, d: Record<string, unknown>): ServiceItem {
  return {
    id,
    name: String(d.name ?? ''),
    category: d.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    bioGroup: normalizeBioGroup(d.bioGroup),
    price: Number(d.price ?? 0),
    priceMax: typeof d.priceMax === 'number' ? d.priceMax : undefined,
    durationMinutes: Number(d.durationMinutes ?? 45),
    defaultRecallDays: Number(d.defaultRecallDays ?? 28),
    showInBio: Boolean(d.showInBio),
    description: typeof d.description === 'string' ? d.description : undefined,
  };
}

export function mapClientDoc(id: string, d: Record<string, unknown>): Client {
  const fallbackDate = toIsoDate(new Date());
  const rawPhotos = Array.isArray(d.beforeAfterPhotos)
    ? (d.beforeAfterPhotos as BeforeAfterPair[])
    : [];

  return {
    id,
    name: String(d.name ?? ''),
    phone: String(d.phone ?? ''),
    primaryCategory:
      d.primaryCategory === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    allergyNote: typeof d.allergyNote === 'string' ? d.allergyNote : undefined,
    createdAt: String(d.createdDate ?? fallbackDate),
    lastVisitDate: String(d.lastVisitDate ?? fallbackDate),
    lastServiceName: String(d.lastServiceName ?? ''),
    nextRecallDate: String(d.nextRecallDate ?? fallbackDate),
    recallCycleDays: Number(d.recallCycleDays ?? 28),
    lastRemindedAt: typeof d.lastRemindedAt === 'string' ? d.lastRemindedAt : undefined,
    activePackage: d.activePackage as ClientPackage | undefined,
    sessions: Array.isArray(d.sessions) ? (d.sessions as SessionLog[]) : [],
    beforeAfterPhotos: rawPhotos.filter(
      (p) => isSafeImageUrl(p.beforeUrl) && isSafeImageUrl(p.afterUrl)
    ),
  };
}

export function mapAppointmentDoc(id: string, d: Record<string, unknown>): Appointment {
  return {
    id,
    clientId: typeof d.clientId === 'string' ? d.clientId : undefined,
    clientName: String(d.clientName ?? ''),
    phone: String(d.phone ?? ''),
    date: String(d.date ?? ''),
    time: String(d.time ?? ''),
    serviceName: String(d.serviceName ?? ''),
    category: d.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT',
    status:
      d.status === 'ONAYLANDI' || d.status === 'IPTAL_ERTELENDI'
        ? d.status
        : 'TEYIT_BEKLIYOR',
    notes: typeof d.notes === 'string' ? d.notes : undefined,
  };
}

export function isValidStudioData(input: unknown): input is StudioData {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Partial<StudioData>;
  return (
    typeof candidate.settings === 'object' &&
    candidate.settings !== null &&
    typeof candidate.settings.studioName === 'string' &&
    Array.isArray(candidate.services) &&
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.appointments)
  );
}
