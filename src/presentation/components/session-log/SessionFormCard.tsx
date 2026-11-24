import { getRemainingSessions } from '../../../domain/engines/recallEngine';
import {
  toggleTagMarker,
  type SessionClassification,
} from '../../../domain/engines/sessionTagEngine';
import type {
  Client,
  NicheCategory,
  ServiceItem,
  StudioSettings,
} from '../../../domain/types/studio';
import { AutoTagSummaryBox } from '../common/AutoTagSummaryBox';
import {
  FIELD_LABEL_CLASS,
  INPUT_SURFACE_CLASS,
  MONO_INPUT_SURFACE_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../ui/formStyles';

export interface SessionFormState {
  clientName: string;
  phone: string;
  date: string;
  category: NicheCategory;
  serviceName: string;
  sessionNumber: string;
  device: string;
  energyJoule: string;
  bodyArea: string;
  skinType: string;
  productOrSerum: string;
  nailShape: string;
  colorOrPigmentCode: string;
  curlOrShield: string;
  notes: string;
  nextRecallDays: number;
  decrementPackage: boolean;
}

interface SessionFormCardProps {
  mode: 'AI' | 'MANUAL';
  form: SessionFormState;
  clients: Client[];
  services: ServiceItem[];
  settings: StudioSettings;
  matchedClient: Client | undefined;
  liveClassification: SessionClassification;
  formError: string | null;
  isSaving: boolean;
  onPatchForm: (patch: Partial<SessionFormState>) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SessionFormCard({
  mode,
  form,
  clients,
  services,
  settings,
  matchedClient,
  liveClassification,
  formError,
  isSaving,
  onPatchForm,
  onReset,
  onSubmit,
}: SessionFormCardProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-5"
    >
      <div className="pb-4 border-b border-[#E7E5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#1C1917]">
            {mode === 'AI' ? 'Kayıt Öncesi Kontrol & Düzenleme' : 'Manuel İşlem Kaydı'}
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Kaydettiğinizde müşteri geçmişine işlenir, geri çağırma tarihi hesaplanır.
          </p>
        </div>
        {matchedClient && (
          <span className="text-xs font-medium text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
            Kayıtlı müşteri eşleşti: {matchedClient.name}
          </span>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2"
        >
          {formError}
        </p>
      )}

      {/* Core Identity & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <div>
          <label htmlFor="log-client" className={FIELD_LABEL_CLASS}>
            Müşteri Adı Soyadı *
          </label>
          <input
            id="log-client"
            type="text"
            list="session-clients-datalist"
            value={form.clientName}
            onChange={(e) => onPatchForm({ clientName: e.target.value })}
            placeholder="Örn. Elif Demir"
            className={INPUT_SURFACE_CLASS}
          />
          <datalist id="session-clients-datalist">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        {!matchedClient && (
          <div>
            <label htmlFor="log-phone" className={FIELD_LABEL_CLASS}>
              Telefon (Yeni Müşteri İçin)
            </label>
            <input
              id="log-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => onPatchForm({ phone: e.target.value })}
              placeholder="Numara sonra eklenebilir"
              className={MONO_INPUT_SURFACE_CLASS}
            />
          </div>
        )}

        <div>
          <label htmlFor="log-date" className={FIELD_LABEL_CLASS}>
            İşlem Tarihi
          </label>
          <input
            id="log-date"
            type="date"
            value={form.date}
            onChange={(e) => onPatchForm({ date: e.target.value })}
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>

        <div>
          <label htmlFor="log-category" className={FIELD_LABEL_CLASS}>
            Uzmanlık Alanı
          </label>
          <select
            id="log-category"
            value={form.category}
            onChange={(e) => {
              const next = e.target.value as NicheCategory;
              onPatchForm({
                category: next,
                nextRecallDays:
                  next === 'TIRNAK_KAS_KIRPIK'
                    ? settings.defaultRecallDays.tirnak
                    : settings.defaultRecallDays.lazer,
              });
            }}
            className={INPUT_SURFACE_CLASS}
          >
            <option value="LAZER_CILT">Lazer Epilasyon &amp; Cilt Bakımı</option>
            <option value="TIRNAK_KAS_KIRPIK">Protez Tırnak &amp; Kaş / Kirpik</option>
          </select>
        </div>

        <div>
          <label htmlFor="log-service" className={FIELD_LABEL_CLASS}>
            Yapılan İşlem *
          </label>
          <input
            id="log-service"
            type="text"
            list="session-services-datalist"
            value={form.serviceName}
            onChange={(e) => onPatchForm({ serviceName: e.target.value })}
            placeholder="Örn. Tüm Vücut Buz Lazer"
            className={INPUT_SURFACE_CLASS}
          />
          <datalist id="session-services-datalist">
            {services.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="log-recall" className={FIELD_LABEL_CLASS}>
            Sonraki Hatırlatma (Gün)
          </label>
          <input
            id="log-recall"
            type="number"
            min={7}
            max={120}
            value={form.nextRecallDays}
            onChange={(e) => onPatchForm({ nextRecallDays: Number(e.target.value) })}
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>
      </div>

      {/* Niche-Specific Technical Parameters */}
      <div className="pt-4 border-t border-[#E7E5E4]">
        <h3 className="text-xs font-semibold text-[#57534E] mb-3">
          {form.category === 'LAZER_CILT'
            ? 'Teknik Parametreler (Lazer & Cilt Bakımı)'
            : 'Teknik Formül (Tırnak & Kaş / Kirpik)'}
        </h3>

        {form.category === 'LAZER_CILT' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <label htmlFor="log-session-num" className={FIELD_LABEL_CLASS}>
                Seans No
              </label>
              <input
                id="log-session-num"
                type="number"
                min={1}
                value={form.sessionNumber}
                onChange={(e) => onPatchForm({ sessionNumber: e.target.value })}
                placeholder="Örn. 6"
                className={MONO_INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-device" className={FIELD_LABEL_CLASS}>
                Cihaz / Başlık
              </label>
              <input
                id="log-device"
                type="text"
                value={form.device}
                onChange={(e) => onPatchForm({ device: e.target.value })}
                placeholder="Örn. Soprano Ice Buz Lazer"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-joule" className={FIELD_LABEL_CLASS}>
                Enerji (Joule)
              </label>
              <input
                id="log-joule"
                type="text"
                value={form.energyJoule}
                onChange={(e) => onPatchForm({ energyJoule: e.target.value })}
                placeholder="Örn. 14 J"
                className={MONO_INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-area" className={FIELD_LABEL_CLASS}>
                Bölge
              </label>
              <input
                id="log-area"
                type="text"
                value={form.bodyArea}
                onChange={(e) => onPatchForm({ bodyArea: e.target.value })}
                placeholder="Örn. Koltuk altı + Tüm bacak"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-skintype" className={FIELD_LABEL_CLASS}>
                Cilt Tipi
              </label>
              <input
                id="log-skintype"
                type="text"
                value={form.skinType}
                onChange={(e) => onPatchForm({ skinType: e.target.value })}
                placeholder="Örn. Tip 3 / Hassas"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-serum" className={FIELD_LABEL_CLASS}>
                Serum / Maske
              </label>
              <input
                id="log-serum"
                type="text"
                value={form.productOrSerum}
                onChange={(e) => onPatchForm({ productOrSerum: e.target.value })}
                placeholder="Örn. Pantenol Jel / Hyaluronik"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label htmlFor="log-shape" className={FIELD_LABEL_CLASS}>
                Tırnak Formu
              </label>
              <input
                id="log-shape"
                type="text"
                value={form.nailShape}
                onChange={(e) => onPatchForm({ nailShape: e.target.value })}
                placeholder="Örn. Orta Badem / Kısa Kare"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-color" className={FIELD_LABEL_CLASS}>
                Renk / Pigment Kodu
              </label>
              <input
                id="log-color"
                type="text"
                value={form.colorOrPigmentCode}
                onChange={(e) => onPatchForm({ colorOrPigmentCode: e.target.value })}
                placeholder="Örn. #104 Süt Beyazı / #3.1 Kahve"
                className={MONO_INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-curl" className={FIELD_LABEL_CLASS}>
                Kirpik Pedi / Kıvrım
              </label>
              <input
                id="log-curl"
                type="text"
                value={form.curlOrShield}
                onChange={(e) => onPatchForm({ curlOrShield: e.target.value })}
                placeholder="Örn. M1 Silikon Ped"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="log-product" className={FIELD_LABEL_CLASS}>
                Kullanılan Jel / Baz / Keratin
              </label>
              <input
                id="log-product"
                type="text"
                value={form.productOrSerum}
                onChange={(e) => onPatchForm({ productOrSerum: e.target.value })}
                placeholder="Örn. HEMA-Free Builder Gel"
                className={INPUT_SURFACE_CLASS}
              />
            </div>
          </div>
        )}
      </div>

      {/* Technician Notes */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <label htmlFor="log-notes" className="block text-xs font-medium text-[#57534E]">
            Uzman Gözlemi &amp; Notlar
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onPatchForm({ notes: toggleTagMarker(form.notes, '[Kritik Uyarı]') })
              }
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                /\[kritik\s*uyarı\]/i.test(form.notes)
                  ? 'bg-[#B91C1C] border-[#B91C1C] text-white'
                  : 'bg-white border-[#E7E5E4] text-[#B91C1C] hover:bg-[#FEF2F2]'
              }`}
            >
              Kritik Uyarı Etiketle
            </button>
            <button
              type="button"
              onClick={() => onPatchForm({ notes: toggleTagMarker(form.notes, '[Özel İstek]') })}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                /\[özel\s*istek\]/i.test(form.notes)
                  ? 'bg-[#A87664] border-[#A87664] text-white'
                  : 'bg-white border-[#E7E5E4] text-[#8C5B4A] hover:bg-[#FFFBEB]'
              }`}
            >
              Özel İstek Etiketle
            </button>
          </div>
        </div>
        <textarea
          id="log-notes"
          rows={2}
          value={form.notes}
          onChange={(e) => onPatchForm({ notes: e.target.value })}
          placeholder="Hassasiyet, cilt tepkisi, özel renk/form tercihi veya sonraki seans notu..."
          className={INPUT_SURFACE_CLASS}
        />
      </div>

      <AutoTagSummaryBox
        classification={liveClassification}
        heading="Otomatik Kategori:"
        emptyLabel="Standart Kayıt (kritik uyarı veya özel istek saptanmadı)"
        testId="form-auto-tag-summary"
        showReasons
      />

      {matchedClient?.activePackage && getRemainingSessions(matchedClient.activePackage) > 0 && (
        <label className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FAF9F7] border border-[#E7E5E4] cursor-pointer">
          <input
            type="checkbox"
            checked={form.decrementPackage}
            onChange={(e) => onPatchForm({ decrementPackage: e.target.checked })}
            className="mt-0.5 accent-[#2F5D50] w-4 h-4 shrink-0"
          />
          <span className="text-xs text-[#1C1917] leading-relaxed">
            <strong>Aktif paketten 1 seans düş:</strong> {matchedClient.activePackage.name} (
            <span className="font-mono tabular-nums">
              {matchedClient.activePackage.completedSessions}/
              {matchedClient.activePackage.totalSessions}
            </span>{' '}
            tamamlandı ·{' '}
            <span className="font-mono tabular-nums">
              {getRemainingSessions(matchedClient.activePackage)}
            </span>{' '}
            seans kaldı)
          </span>
        </label>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 rounded-lg border border-[#E7E5E4] text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F7]"
        >
          Temizle
        </button>
        <button type="submit" disabled={isSaving} className={PRIMARY_BUTTON_CLASS}>
          {isSaving ? 'Kaydediliyor...' : 'İşlem Kaydını Onayla ve Kaydet'}
        </button>
      </div>
    </form>
  );
}
