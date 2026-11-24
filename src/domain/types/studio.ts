export type NicheCategory = 'LAZER_CILT' | 'TIRNAK_KAS_KIRPIK';

export type BioServiceGroup =
  | 'LAZER_EPILASYON'
  | 'CILT_BAKIMI'
  | 'PROTEZ_TIRNAK_OJE'
  | 'KAS_KIRPIK';

export type ServiceFocusFilter = 'ALL' | BioServiceGroup;

export type PaymentStatus = 'ODENDI' | 'KISMI' | 'SEANS_BASI';

export type AppointmentStatus = 'TEYIT_BEKLIYOR' | 'ONAYLANDI' | 'IPTAL_ERTELENDI';

export type StudioTone = 'SAMIMI' | 'KURUMSAL';

export type NavTab =
  | 'dashboard'
  | 'quick-log'
  | 'clients'
  | 'bio-link'
  | 'aftercare'
  | 'settings';

export type WhatsAppPurpose = 'RECALL' | 'NO_SHOW_CONFIRM';

export interface TechnicalParams {
  // Lazer & Cilt Bakımı
  device?: string;
  energyJoule?: string;
  bodyArea?: string;
  skinType?: string;
  productOrSerum?: string;
  // Protez Tırnak & Kaş / Kirpik
  nailShape?: string;
  colorOrPigmentCode?: string;
  curlOrShield?: string;
}

export interface SessionLog {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  category: NicheCategory;
  serviceId?: string;
  serviceName: string;
  sessionNumber?: number;
  technicalParams: TechnicalParams;
  notes: string;
  nextRecallDays: number;
  pricePaid?: number;
}

export interface ClientPackage {
  id: string;
  name: string;
  category: NicheCategory;
  totalSessions: number;
  completedSessions: number;
  paymentStatus: PaymentStatus;
  startDate: string; // YYYY-MM-DD
  totalPrice?: number;
}

export interface BeforeAfterPair {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: NicheCategory;
  beforeUrl: string;
  afterUrl: string;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  primaryCategory: NicheCategory;
  allergyNote?: string;
  createdAt: string; // YYYY-MM-DD
  lastVisitDate: string; // YYYY-MM-DD
  lastServiceName: string;
  nextRecallDate: string; // YYYY-MM-DD
  recallCycleDays: number;
  lastRemindedAt?: string; // YYYY-MM-DD
  activePackage?: ClientPackage;
  sessions: SessionLog[];
  beforeAfterPhotos: BeforeAfterPair[];
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  serviceName: string;
  category: NicheCategory;
  status: AppointmentStatus;
  notes?: string;
}

export interface AppointmentUpdatePatch {
  date?: string;
  time?: string;
  serviceName?: string;
  category?: NicheCategory;
  status?: AppointmentStatus;
  notes?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: NicheCategory;
  bioGroup: BioServiceGroup;
  price: number;
  priceMax?: number;
  durationMinutes: number;
  defaultRecallDays: number;
  showInBio: boolean;
  description?: string;
}

export interface DefaultRecallDays {
  lazer: number;
  cilt: number;
  tirnak: number;
  kasKirpik: number;
}

export interface StudioSettings {
  studioName: string;
  instagramHandle: string;
  whatsappPhone: string;
  workingHours: string;
  addressShort: string;
  bioSubtitle: string;
  messageTone: StudioTone;
  defaultRecallDays: DefaultRecallDays;
}

export interface StudioData {
  version: number;
  settings: StudioSettings;
  services: ServiceItem[];
  clients: Client[];
  appointments: Appointment[];
}

export interface ParsedSessionDraft {
  clientName: string;
  category: NicheCategory;
  serviceName: string;
  sessionNumber: number | null;
  technicalParams: TechnicalParams;
  notes: string;
  nextRecallDays: number;
}

export interface SaveSessionPayload {
  clientName: string;
  phone?: string;
  date: string;
  category: NicheCategory;
  serviceName: string;
  sessionNumber?: number;
  technicalParams: TechnicalParams;
  notes: string;
  nextRecallDays: number;
  decrementPackage: boolean;
}

export interface SaveSessionResult {
  clientId: string;
  clientName: string;
  packageUpdated: boolean;
}

export interface CreateClientPayload {
  name: string;
  phone: string;
  primaryCategory: NicheCategory;
  allergyNote?: string;
  recallCycleDays: number;
}

export interface BeforeAfterUploadInput {
  title: string;
  note?: string;
  beforeBlob: Blob;
  afterBlob: Blob;
}

export type RecallUrgency = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING_WEEK' | 'OK';

export interface RecallRadarItem {
  client: Client;
  daysSinceLastVisit: number;
  daysUntilRecall: number; // negative means overdue
  urgency: RecallUrgency;
  wasRemindedRecently: boolean;
  suggestedMessage: string;
  whatsappUrl: string;
}

export interface ParseSessionApiResult {
  draft: ParsedSessionDraft;
  model: string;
}

export interface PolishWhatsAppApiResult {
  message: string;
  model: string;
}
