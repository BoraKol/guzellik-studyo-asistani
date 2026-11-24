import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileEdit, Sparkles } from 'lucide-react';
import { toIsoDate } from '../../../domain/engines/dateUtils';
import {
  classifySessionNote,
  toggleTagMarker,
  type ClassifiedSessionRecord,
} from '../../../domain/engines/sessionTagEngine';
import type {
  NicheCategory,
  SaveSessionPayload,
  SaveSessionResult,
  StudioData,
} from '../../../domain/types/studio';
import { parseTechnicianNoteWithAI } from '../../../infrastructure/api/aiAssistantClient';
import { AutoTagSummaryBox } from '../common/AutoTagSummaryBox';
import { AlertBanner } from '../ui/AlertBanner';
import { PRIMARY_BUTTON_CLASS } from '../ui/formStyles';
import { SessionFormCard, type SessionFormState } from './SessionFormCard';
import { SmartSessionFeed } from './SmartSessionFeed';

interface QuickSessionLogViewProps {
  data: StudioData;
  onSaveSession: (payload: SaveSessionPayload) => Promise<SaveSessionResult>;
  onOpenClient: (clientId: string) => void;
}

const EXAMPLE_NOTES = [
  {
    label: 'Lazer / Cilt Örneği',
    text: 'Elif Demir 6. seans buz lazer tüm bacak ve koltuk altı 14 joule, cilt tipi 3, kızarıklık ve hassasiyet yok, 5 hafta sonra kontrol.',
  },
  {
    label: 'Tırnak / Özel İstek Örneği',
    text: 'Selin Kaya protez tırnak yenileme, orta badem form, kod #104 süt beyazı, ince kat istendi, HEMA-free builder gel kullanıldı, 21 gün sonra hatırlat.',
  },
  {
    label: 'Kritik Uyarı Örneği',
    text: 'Ayşe Yılmaz 4. seans diode lazer bacak 18 joule, işlem sonrası hafif kızarıklık ve hassasiyet oluştu, yoğun pantenol jel uygulandı, 5 hafta sonra kontrol.',
  },
] as const;

function createEmptyFormState(category: NicheCategory = 'LAZER_CILT'): SessionFormState {
  return {
    clientName: '',
    phone: '',
    date: toIsoDate(new Date()),
    category,
    serviceName: '',
    sessionNumber: '',
    device: '',
    energyJoule: '',
    bodyArea: '',
    skinType: '',
    productOrSerum: '',
    nailShape: '',
    colorOrPigmentCode: '',
    curlOrShield: '',
    notes: '',
    nextRecallDays: category === 'TIRNAK_KAS_KIRPIK' ? 21 : 35,
    decrementPackage: true,
  };
}

export function QuickSessionLogView({
  data,
  onSaveSession,
  onOpenClient,
}: QuickSessionLogViewProps) {
  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');
  const [rawNote, setRawNote] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedReady, setParsedReady] = useState(false);

  const [form, setForm] = useState<SessionFormState>(() => createEmptyFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<SaveSessionResult | null>(null);

  const parseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      parseAbortRef.current?.abort();
    };
  }, []);

  const matchedClient = useMemo(
    () =>
      data.clients.find(
        (c) => c.name.trim().toLowerCase() === form.clientName.trim().toLowerCase()
      ),
    [data.clients, form.clientName]
  );

  const liveClassification = useMemo(
    () =>
      classifySessionNote({
        rawNote: mode === 'AI' && !parsedReady ? rawNote : '',
        notes: form.notes,
        allergyNote: matchedClient?.allergyNote,
        technicalParams: {
          device: form.device.trim() || undefined,
          energyJoule: form.energyJoule.trim() || undefined,
          bodyArea: form.bodyArea.trim() || undefined,
          skinType: form.skinType.trim() || undefined,
          productOrSerum: form.productOrSerum.trim() || undefined,
          nailShape: form.nailShape.trim() || undefined,
          colorOrPigmentCode: form.colorOrPigmentCode.trim() || undefined,
          curlOrShield: form.curlOrShield.trim() || undefined,
        },
      }),
    [mode, parsedReady, rawNote, form, matchedClient?.allergyNote]
  );

  function patchForm(patch: Partial<SessionFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handlePrefillFromRecord(record: ClassifiedSessionRecord) {
    const { client, session } = record;
    setMode('MANUAL');
    setParsedReady(true);
    setParseError(null);
    setFormError(null);
    setSavedBanner(null);
    setForm({
      clientName: client.name,
      phone: client.phone,
      date: toIsoDate(new Date()),
      category: session.category,
      serviceName: session.serviceName,
      sessionNumber: session.sessionNumber ? String(session.sessionNumber + 1) : '',
      device: session.technicalParams.device ?? '',
      energyJoule: session.technicalParams.energyJoule ?? '',
      bodyArea: session.technicalParams.bodyArea ?? '',
      skinType: session.technicalParams.skinType ?? '',
      productOrSerum: session.technicalParams.productOrSerum ?? '',
      nailShape: session.technicalParams.nailShape ?? '',
      colorOrPigmentCode: session.technicalParams.colorOrPigmentCode ?? '',
      curlOrShield: session.technicalParams.curlOrShield ?? '',
      notes: session.notes,
      nextRecallDays: session.nextRecallDays,
      decrementPackage: true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleParseWithAI() {
    if (!rawNote.trim()) {
      setParseError('Lütfen ayrıştırmak istediğiniz işlem notunu yazın.');
      return;
    }

    parseAbortRef.current?.abort();
    const controller = new AbortController();
    parseAbortRef.current = controller;

    setParseError(null);
    setSavedBanner(null);
    setIsParsing(true);
    try {
      const res = await parseTechnicianNoteWithAI(
        rawNote,
        data.services.map((s) => s.name),
        data.clients.map((c) => c.name),
        controller.signal
      );
      const d = res.draft;
      setForm((prev) => ({
        ...prev,
        clientName: d.clientName,
        category: d.category,
        serviceName: d.serviceName,
        sessionNumber: d.sessionNumber ? String(d.sessionNumber) : '',
        device: d.technicalParams.device ?? '',
        energyJoule: d.technicalParams.energyJoule ?? '',
        bodyArea: d.technicalParams.bodyArea ?? '',
        skinType: d.technicalParams.skinType ?? '',
        productOrSerum: d.technicalParams.productOrSerum ?? '',
        nailShape: d.technicalParams.nailShape ?? '',
        colorOrPigmentCode: d.technicalParams.colorOrPigmentCode ?? '',
        curlOrShield: d.technicalParams.curlOrShield ?? '',
        notes: d.notes,
        nextRecallDays: d.nextRecallDays,
      }));
      setParsedReady(true);
    } catch (err) {
      if (controller.signal.aborted) return;
      setParseError(
        err instanceof Error
          ? err.message
          : 'AI ayrıştırma yapılamadı. Manuel form ile hızlıca devam edebilirsiniz.'
      );
    } finally {
      if (parseAbortRef.current === controller) {
        setIsParsing(false);
      }
    }
  }

  function handleSwitchToManual() {
    setMode('MANUAL');
    setParseError(null);
    setParsedReady(true);
    if (!form.notes && rawNote.trim()) {
      patchForm({ notes: rawNote.trim() });
    }
  }

  function resetForm() {
    setRawNote('');
    setForm(createEmptyFormState(form.category));
    setParsedReady(false);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) {
      setFormError('Lütfen müşteri adını girin.');
      return;
    }
    if (!form.serviceName.trim()) {
      setFormError('Lütfen yapılan işlem adını girin.');
      return;
    }
    setFormError(null);
    setIsSaving(true);

    try {
      const parsedNum = form.sessionNumber.trim() ? Number(form.sessionNumber) : undefined;
      const result = await onSaveSession({
        clientName: form.clientName.trim(),
        phone: form.phone.trim() || undefined,
        date: form.date,
        category: form.category,
        serviceName: form.serviceName.trim(),
        sessionNumber: parsedNum && !Number.isNaN(parsedNum) ? parsedNum : undefined,
        technicalParams: {
          device: form.device.trim() || undefined,
          energyJoule: form.energyJoule.trim() || undefined,
          bodyArea: form.bodyArea.trim() || undefined,
          skinType: form.skinType.trim() || undefined,
          productOrSerum: form.productOrSerum.trim() || undefined,
          nailShape: form.nailShape.trim() || undefined,
          colorOrPigmentCode: form.colorOrPigmentCode.trim() || undefined,
          curlOrShield: form.curlOrShield.trim() || undefined,
        },
        notes: form.notes.trim(),
        nextRecallDays: Math.max(7, Number(form.nextRecallDays) || 28),
        decrementPackage: form.decrementPackage,
      });

      setSavedBanner(result);
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'İşlem kaydı kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const showStructuredForm = mode === 'MANUAL' || parsedReady;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-[#A87664]">
            Doğal Türkçe Not · Kontrollü Onay Adımı
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Hızlı İşlem Kaydı
          </h1>
        </div>

        <div
          className="inline-flex items-center p-1 bg-white border border-[#E7E5E4] rounded-lg shrink-0 self-start sm:self-auto"
          role="tablist"
          aria-label="Kayıt yöntemi"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'AI'}
            onClick={() => setMode('AI')}
            className={`px-3.5 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'AI'
                ? 'bg-[#2F5D50] text-white'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            AI Not Ayrıştırıcı
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'MANUAL'}
            onClick={handleSwitchToManual}
            className={`px-3.5 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'MANUAL'
                ? 'bg-[#2F5D50] text-white'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Manuel Form
          </button>
        </div>
      </div>

      {savedBanner && (
        <div
          role="status"
          className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-[#047857]">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold">{savedBanner.clientName} için işlem kaydı eklendi.</p>
              <p className="text-xs mt-0.5 text-[#065F46]">
                {savedBanner.packageUpdated
                  ? 'Aktif paketten 1 seans otomatik düşüldü ve yeni geri çağırma tarihi güncellendi.'
                  : 'Müşteri kartı ve sonraki geri çağırma tarihi güncellendi.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenClient(savedBanner.clientId)}
            className="px-3.5 py-2 rounded-lg bg-[#047857] text-white text-xs font-medium hover:bg-[#065F46] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Müşteri Kartını Aç
          </button>
        </div>
      )}

      {mode === 'AI' && (
        <section className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#1C1917]">
              Uzman Notunu Serbest Türkçe ile Yazın
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Yazdığınız kısa not otomatik olarak işlem alanlarına ayrılır; kaydetmeden önce tüm
              bilgileri kendiniz kontrol edip düzenleyebilirsiniz.
            </p>
          </div>

          <div>
            <label htmlFor="ai-session-note" className="sr-only">
              Uzman işlem notu
            </label>
            <textarea
              id="ai-session-note"
              rows={4}
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              placeholder='Örn: "Ayşe Yılmaz 4. seans buz lazer koltuk altı ve bacak 14 joule, kızarıklık yok, 5 hafta sonra tekrar gelsin"'
              className="w-full px-3.5 py-3 text-base sm:text-sm border border-[#E7E5E4] rounded-xl bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50] resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#57534E]">Örnek doldur:</span>
            {EXAMPLE_NOTES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setRawNote(ex.text);
                  setParseError(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-[#FAF9F7] text-xs font-medium text-[#1C1917] hover:border-[#A87664] transition-colors whitespace-nowrap"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {!parsedReady && (rawNote.trim().length > 0 || liveClassification.tags.length > 0) && (
            <AutoTagSummaryBox
              classification={liveClassification}
              heading="Otomatik Etiketleme:"
              emptyLabel="Standart İşlem Kaydı"
              testId="live-auto-tag-preview"
              onToggleCritical={() =>
                setRawNote((prev) => toggleTagMarker(prev, '[Kritik Uyarı]'))
              }
              onToggleSpecial={() => setRawNote((prev) => toggleTagMarker(prev, '[Özel İstek]'))}
            />
          )}

          {parseError && (
            <AlertBanner
              variant="warning"
              message={parseError}
              actionLabel="Manuel Form ile Devam Et"
              onAction={handleSwitchToManual}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleSwitchToManual}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] self-start sm:self-auto"
            >
              <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
              AI kullanmadan manuel doldur
            </button>

            <button
              type="button"
              onClick={handleParseWithAI}
              disabled={isParsing}
              className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {isParsing ? 'Alanlara Ayrıştırılıyor...' : 'Notu Alanlara Ayrıştır'}
            </button>
          </div>
        </section>
      )}

      {showStructuredForm && (
        <SessionFormCard
          mode={mode}
          form={form}
          clients={data.clients}
          services={data.services}
          settings={data.settings}
          matchedClient={matchedClient}
          liveClassification={liveClassification}
          formError={formError}
          isSaving={isSaving}
          onPatchForm={patchForm}
          onReset={resetForm}
          onSubmit={handleSave}
        />
      )}

      <SmartSessionFeed
        clients={data.clients}
        onOpenClient={onOpenClient}
        onPrefillFromRecord={handlePrefillFromRecord}
      />
    </div>
  );
}
