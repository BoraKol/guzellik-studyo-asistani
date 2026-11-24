import { useMemo, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useCopyFeedback } from '../../../application/hooks/useCopyFeedback';
import { BIO_TIME_WINDOWS } from '../../../domain/constants/studioLabels';
import { buildWhatsAppLink, formatTL } from '../../../domain/engines/formatters';
import {
  buildBioAppointmentRequestMessage,
  estimateBioSelection,
} from '../../../domain/engines/messageBuilder';
import type {
  BioServiceGroup,
  StudioData,
  StudioSettings,
} from '../../../domain/types/studio';
import {
  FIELD_LABEL_CLASS,
  INPUT_SURFACE_CLASS,
  MONO_INPUT_SURFACE_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '../ui/formStyles';
import { BioMobilePreviewCard } from './BioMobilePreviewCard';

interface BioLinkViewProps {
  data: StudioData;
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  onToggleServiceInBio: (serviceId: string) => void;
}

export function BioLinkView({
  data,
  onUpdateSettings,
  onToggleServiceInBio,
}: BioLinkViewProps) {
  const [viewMode, setViewMode] = useState<'SPLIT' | 'FULLSCREEN_CLIENT'>('SPLIT');
  const [activeGroup, setActiveGroup] = useState<BioServiceGroup>('LAZER_EPILASYON');
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'srv-lazer-koltuk',
    'srv-tirnak-yenileme',
  ]);
  const [guestName, setGuestName] = useState('');
  const [preferredWindow, setPreferredWindow] = useState(BIO_TIME_WINDOWS[0]);
  const [guestNote, setGuestNote] = useState('');
  const { copiedKey, copyText } = useCopyFeedback();

  const visibleServices = useMemo(
    () => data.services.filter((s) => s.showInBio),
    [data.services]
  );

  const groupServices = useMemo(
    () => visibleServices.filter((s) => s.bioGroup === activeGroup),
    [visibleServices, activeGroup]
  );

  const selectedServices = useMemo(
    () => visibleServices.filter((s) => selectedIds.includes(s.id)),
    [visibleServices, selectedIds]
  );

  const estimation = useMemo(() => estimateBioSelection(selectedServices), [selectedServices]);

  const priceDisplay =
    estimation.maxPrice > estimation.minPrice
      ? `${formatTL(estimation.minPrice)} – ${formatTL(estimation.maxPrice)}`
      : formatTL(estimation.minPrice);

  const whatsappMessage = useMemo(
    () =>
      buildBioAppointmentRequestMessage({
        clientName: guestName,
        preferredWindow,
        selectedServices,
        studioName: data.settings.studioName,
        note: guestNote,
      }),
    [guestName, preferredWindow, selectedServices, data.settings.studioName, guestNote]
  );

  const whatsappUrl = buildWhatsAppLink(data.settings.whatsappPhone, whatsappMessage);

  function toggleSelectService(serviceId: string) {
    setSelectedIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  const previewCard = (
    <BioMobilePreviewCard
      settings={data.settings}
      activeGroup={activeGroup}
      groupServices={groupServices}
      selectedIds={selectedIds}
      selectedCount={selectedServices.length}
      totalMinutes={estimation.totalMinutes}
      priceDisplay={priceDisplay}
      guestName={guestName}
      preferredWindow={preferredWindow}
      guestNote={guestNote}
      whatsappUrl={whatsappUrl}
      copied={copiedKey === 'bio-msg'}
      onChangeGroup={setActiveGroup}
      onToggleService={toggleSelectService}
      onChangeGuestName={setGuestName}
      onChangePreferredWindow={setPreferredWindow}
      onChangeGuestNote={setGuestNote}
      onCopyMessage={() => copyText('bio-msg', whatsappMessage)}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-[#A87664]">
            DM&apos;de “Fiyat Nedir?” Sorularını Randevuya Dönüştürün
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            Instagram Bio Fiyat &amp; Randevu Linki
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === 'SPLIT' ? 'FULLSCREEN_CLIENT' : 'SPLIT'))}
          className={`${SECONDARY_BUTTON_CLASS} self-start sm:self-auto`}
        >
          {viewMode === 'SPLIT' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-[#2F5D50]" aria-hidden="true" />
              Tam Ekran Müşteri Modu
            </>
          ) : (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-[#2F5D50]" aria-hidden="true" />
              Düzenleme Ekranına Dön
            </>
          )}
        </button>
      </div>

      {viewMode === 'FULLSCREEN_CLIENT' ? (
        <div className="py-2 sm:py-4">{previewCard}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section className="xl:col-span-7 bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-6">
            <div className="pb-4 border-b border-[#E7E5E4]">
              <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
                Bio Linkini Düzenle
              </h2>
              <p className="text-xs text-[#57534E] mt-0.5">
                Yaptığınız her değişiklik sağdaki mobil müşteri önizlemesine anında yansır.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label htmlFor="bio-studio-name" className={FIELD_LABEL_CLASS}>
                  Stüdyo Adı
                </label>
                <input
                  id="bio-studio-name"
                  type="text"
                  value={data.settings.studioName}
                  onChange={(e) => onUpdateSettings({ studioName: e.target.value })}
                  className={INPUT_SURFACE_CLASS}
                />
              </div>

              <div>
                <label htmlFor="bio-ig" className={FIELD_LABEL_CLASS}>
                  Instagram Kullanıcı Adı
                </label>
                <input
                  id="bio-ig"
                  type="text"
                  value={data.settings.instagramHandle}
                  onChange={(e) => onUpdateSettings({ instagramHandle: e.target.value })}
                  className={INPUT_SURFACE_CLASS}
                />
              </div>

              <div>
                <label htmlFor="bio-hours" className={FIELD_LABEL_CLASS}>
                  Çalışma Saatleri
                </label>
                <input
                  id="bio-hours"
                  type="text"
                  value={data.settings.workingHours}
                  onChange={(e) => onUpdateSettings({ workingHours: e.target.value })}
                  className={INPUT_SURFACE_CLASS}
                />
              </div>

              <div>
                <label htmlFor="bio-wa" className={FIELD_LABEL_CLASS}>
                  Randevu WhatsApp Numarası
                </label>
                <input
                  id="bio-wa"
                  type="tel"
                  value={data.settings.whatsappPhone}
                  onChange={(e) => onUpdateSettings({ whatsappPhone: e.target.value })}
                  placeholder="Numaranızı istediğiniz zaman ekleyin"
                  className={MONO_INPUT_SURFACE_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bio-sub" className={FIELD_LABEL_CLASS}>
                  Kısa Uzmanlık Tanıtımı
                </label>
                <input
                  id="bio-sub"
                  type="text"
                  value={data.settings.bioSubtitle}
                  onChange={(e) => onUpdateSettings({ bioSubtitle: e.target.value })}
                  className={INPUT_SURFACE_CLASS}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E5E4] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1C1917]">
                  Bio Linkinde Gösterilen Hizmetler
                </h3>
                <span className="text-xs font-mono tabular-nums text-[#57534E]">
                  {visibleServices.length} / {data.services.length} aktif
                </span>
              </div>

              <div className="divide-y divide-[#E7E5E4]">
                {data.services.map((srv) => (
                  <label
                    key={srv.id}
                    className="py-3 sm:py-2.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1C1917] truncate">{srv.name}</p>
                      <p className="text-xs font-mono tabular-nums text-[#57534E]">
                        {formatTL(srv.price)} · {srv.durationMinutes} dk
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={srv.showInBio}
                      onChange={() => onToggleServiceInBio(srv.id)}
                      className="w-4 h-4 accent-[#2F5D50] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E5E4] space-y-2">
              <p className="text-xs font-semibold text-[#57534E]">
                Oluşan WhatsApp Randevu Mesajı Önizlemesi
              </p>
              <pre className="text-xs text-[#1C1917] bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl p-3.5 whitespace-pre-wrap font-sans leading-relaxed">
                {whatsappMessage}
              </pre>
            </div>
          </section>

          <section className="xl:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-[#1C1917]">
                Müşteri Gözüyle Önizle (Mobil Simülasyon)
              </h2>
              <span className="text-xs text-[#57534E]">Canlı interaktif</span>
            </div>
            {previewCard}
          </section>
        </div>
      )}
    </div>
  );
}
