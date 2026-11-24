import { useTransientNotice } from '../../../application/hooks/useTransientNotice';
import type {
  ServiceItem,
  StudioData,
  StudioSettings,
  StudioTone,
} from '../../../domain/types/studio';
import { AlertBanner } from '../ui/AlertBanner';
import {
  FIELD_LABEL_CLASS,
  INPUT_SURFACE_CLASS,
  MONO_INPUT_SURFACE_CLASS,
} from '../ui/formStyles';
import { DataPortabilitySection } from './DataPortabilitySection';
import { ServiceCatalogSection } from './ServiceCatalogSection';

interface SettingsCatalogViewProps {
  data: StudioData;
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  onAddService: (service: Omit<ServiceItem, 'id'>) => void;
  onDeleteService: (serviceId: string) => void;
  onImportData: (nextData: StudioData) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onClearToEmpty: () => Promise<void>;
}

const RECALL_CYCLE_FIELDS = [
  ['lazer', 'Lazer Döngüsü (Gün)'],
  ['cilt', 'Cilt Bakımı (Gün)'],
  ['tirnak', 'Protez Tırnak (Gün)'],
  ['kasKirpik', 'Kaş / Kirpik (Gün)'],
] as const;

export function SettingsCatalogView({
  data,
  onUpdateSettings,
  onAddService,
  onDeleteService,
  onImportData,
  onResetDemoData,
  onClearToEmpty,
}: SettingsCatalogViewProps) {
  const { notice, showNotice, clearNotice } = useTransientNotice(4000);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      <div>
        <p className="text-xs font-medium text-[#A87664]">
          Hizmet Kataloğu · Geri Çağırma Döngüleri · Hesap &amp; Yedekleme
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
          Hizmetler, Paketler &amp; Merkez Ayarları
        </h1>
      </div>

      {notice && <AlertBanner variant="success" message={notice} onDismiss={clearNotice} />}

      <section className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-5">
        <div className="pb-4 border-b border-[#E7E5E4]">
          <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
            Stüdyo Bilgileri &amp; Varsayılan Döngüler
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            WhatsApp imzaları, Instagram Bio başlığı ve otomatik geri çağırma süreleri buradan
            yönetilir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <div>
            <label htmlFor="set-name" className={FIELD_LABEL_CLASS}>
              Stüdyo Adı
            </label>
            <input
              id="set-name"
              type="text"
              value={data.settings.studioName}
              onChange={(e) => onUpdateSettings({ studioName: e.target.value })}
              className={INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <label htmlFor="set-phone" className={FIELD_LABEL_CLASS}>
              WhatsApp Telefonu
            </label>
            <input
              id="set-phone"
              type="tel"
              value={data.settings.whatsappPhone}
              onChange={(e) => onUpdateSettings({ whatsappPhone: e.target.value })}
              placeholder="Numaranızı istediğiniz zaman ekleyin"
              className={MONO_INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <label htmlFor="set-ig" className={FIELD_LABEL_CLASS}>
              Instagram Hesabı
            </label>
            <input
              id="set-ig"
              type="text"
              value={data.settings.instagramHandle}
              onChange={(e) => onUpdateSettings({ instagramHandle: e.target.value })}
              className={INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <label htmlFor="set-hours" className={FIELD_LABEL_CLASS}>
              Çalışma Saatleri
            </label>
            <input
              id="set-hours"
              type="text"
              value={data.settings.workingHours}
              onChange={(e) => onUpdateSettings({ workingHours: e.target.value })}
              className={INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <label htmlFor="set-address" className={FIELD_LABEL_CLASS}>
              Semt / Şehir
            </label>
            <input
              id="set-address"
              type="text"
              value={data.settings.addressShort}
              onChange={(e) => onUpdateSettings({ addressShort: e.target.value })}
              className={INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <label htmlFor="set-tone" className={FIELD_LABEL_CLASS}>
              WhatsApp Mesaj Üslubu
            </label>
            <select
              id="set-tone"
              value={data.settings.messageTone}
              onChange={(e) => onUpdateSettings({ messageTone: e.target.value as StudioTone })}
              className={INPUT_SURFACE_CLASS}
            >
              <option value="SAMIMI">Samimi &amp; Butik</option>
              <option value="KURUMSAL">Kurumsal &amp; Resmi</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E7E5E4] grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {RECALL_CYCLE_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`cycle-${key}`} className={FIELD_LABEL_CLASS}>
                {label}
              </label>
              <input
                id={`cycle-${key}`}
                type="number"
                min={7}
                max={90}
                value={data.settings.defaultRecallDays[key]}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultRecallDays: {
                      ...data.settings.defaultRecallDays,
                      [key]: Math.max(7, Number(e.target.value) || 21),
                    },
                  })
                }
                className={MONO_INPUT_SURFACE_CLASS}
              />
            </div>
          ))}
        </div>
      </section>

      <ServiceCatalogSection
        services={data.services}
        onAddService={onAddService}
        onDeleteService={onDeleteService}
        onNotify={showNotice}
      />

      <DataPortabilitySection
        data={data}
        onImportData={onImportData}
        onResetDemoData={onResetDemoData}
        onClearToEmpty={onClearToEmpty}
        onNotify={showNotice}
      />
    </div>
  );
}
