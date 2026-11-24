import type {
  AppointmentStatus,
  BioServiceGroup,
  PaymentStatus,
  ServiceFocusFilter,
} from '../types/studio';

export const SERVICE_FOCUS_LABELS: Record<ServiceFocusFilter, string> = {
  ALL: 'Tüm Hizmetler',
  LAZER_EPILASYON: 'Lazer',
  CILT_BAKIMI: 'Cilt Bakımı',
  PROTEZ_TIRNAK_OJE: 'Tırnak',
  KAS_KIRPIK: 'Kaş/Kirpik',
};

export const BIO_GROUP_LABELS: Record<BioServiceGroup, string> = {
  LAZER_EPILASYON: 'Lazer Epilasyon',
  CILT_BAKIMI: 'Cilt Bakımı',
  PROTEZ_TIRNAK_OJE: 'Protez Tırnak & Oje',
  KAS_KIRPIK: 'Kaş & Kirpik',
};

export const BIO_SERVICE_TABS: ReadonlyArray<{ id: BioServiceGroup; label: string }> = [
  { id: 'LAZER_EPILASYON', label: BIO_GROUP_LABELS.LAZER_EPILASYON },
  { id: 'CILT_BAKIMI', label: BIO_GROUP_LABELS.CILT_BAKIMI },
  { id: 'PROTEZ_TIRNAK_OJE', label: BIO_GROUP_LABELS.PROTEZ_TIRNAK_OJE },
  { id: 'KAS_KIRPIK', label: BIO_GROUP_LABELS.KAS_KIRPIK },
];

export const MOBILE_FOCUS_TABS: ReadonlyArray<{ id: ServiceFocusFilter; label: string }> = [
  { id: 'ALL', label: 'Tümü' },
  { id: 'LAZER_EPILASYON', label: 'Lazer' },
  { id: 'CILT_BAKIMI', label: 'Cilt Bakımı' },
  { id: 'PROTEZ_TIRNAK_OJE', label: 'Tırnak' },
  { id: 'KAS_KIRPIK', label: 'Kaş/Kirpik' },
];

export const DEFAULT_RECALL_DAYS_BY_GROUP: Record<BioServiceGroup, number> = {
  LAZER_EPILASYON: 35,
  CILT_BAKIMI: 30,
  PROTEZ_TIRNAK_OJE: 21,
  KAS_KIRPIK: 45,
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  ODENDI: 'Ödendi',
  KISMI: 'Kısmi Ödeme',
  SEANS_BASI: 'Seans Başı',
};

export const BIO_TIME_WINDOWS: readonly string[] = [
  'Hafta içi gündüz',
  'Hafta içi akşam',
  'Hafta sonu',
];

export const QUICK_EDIT_TIMES: readonly string[] = [
  '10:00',
  '11:30',
  '13:00',
  '14:30',
  '16:00',
  '17:30',
];

export interface AppointmentStatusStyle {
  label: string;
  shortLabel: string;
  dot: string;
  text: string;
  bg: string;
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, AppointmentStatusStyle> = {
  TEYIT_BEKLIYOR: {
    label: 'Teyit Bekliyor',
    shortLabel: 'Bekliyor',
    dot: 'bg-[#B45309]',
    text: 'text-[#B45309]',
    bg: 'bg-[#FFFBEB]',
  },
  ONAYLANDI: {
    label: 'Onaylandı',
    shortLabel: 'Onaylı',
    dot: 'bg-[#047857]',
    text: 'text-[#047857]',
    bg: 'bg-[#ECFDF5]',
  },
  IPTAL_ERTELENDI: {
    label: 'İptal / Ertelendi',
    shortLabel: 'İptal',
    dot: 'bg-[#B91C1C]',
    text: 'text-[#B91C1C]',
    bg: 'bg-[#FEF2F2]',
  },
};

export const APPOINTMENT_STATUS_ORDER: readonly AppointmentStatus[] = [
  'TEYIT_BEKLIYOR',
  'ONAYLANDI',
  'IPTAL_ERTELENDI',
];

export const SERVICE_GROUP_ACCENT_STYLES: Record<
  BioServiceGroup,
  { border: string; badgeBg: string; badgeText: string; label: string }
> = {
  LAZER_EPILASYON: {
    border: 'border-l-[#2F5D50]',
    badgeBg: 'bg-[#2F5D50]/10',
    badgeText: 'text-[#2F5D50]',
    label: 'Lazer',
  },
  CILT_BAKIMI: {
    border: 'border-l-[#3E7A69]',
    badgeBg: 'bg-[#3E7A69]/10',
    badgeText: 'text-[#2C6253]',
    label: 'Cilt Bakımı',
  },
  PROTEZ_TIRNAK_OJE: {
    border: 'border-l-[#A87664]',
    badgeBg: 'bg-[#A87664]/12',
    badgeText: 'text-[#8C5B4A]',
    label: 'Tırnak',
  },
  KAS_KIRPIK: {
    border: 'border-l-[#8B6455]',
    badgeBg: 'bg-[#8B6455]/12',
    badgeText: 'text-[#734E40]',
    label: 'Kaş/Kirpik',
  },
};
