import { Check, Clock, Copy, ExternalLink, MapPin } from 'lucide-react';
import {
  BIO_SERVICE_TABS,
  BIO_TIME_WINDOWS,
} from '../../../domain/constants/studioLabels';
import { formatDurationTr, formatTL } from '../../../domain/engines/formatters';
import type {
  BioServiceGroup,
  ServiceItem,
  StudioSettings,
} from '../../../domain/types/studio';
import { FIELD_LABEL_CLASS, INPUT_SURFACE_CLASS } from '../ui/formStyles';

interface BioMobilePreviewCardProps {
  settings: StudioSettings;
  activeGroup: BioServiceGroup;
  groupServices: ServiceItem[];
  selectedIds: string[];
  selectedCount: number;
  totalMinutes: number;
  priceDisplay: string;
  guestName: string;
  preferredWindow: string;
  guestNote: string;
  whatsappUrl: string;
  copied: boolean;
  onChangeGroup: (group: BioServiceGroup) => void;
  onToggleService: (serviceId: string) => void;
  onChangeGuestName: (val: string) => void;
  onChangePreferredWindow: (val: string) => void;
  onChangeGuestNote: (val: string) => void;
  onCopyMessage: () => void;
}

export function BioMobilePreviewCard({
  settings,
  activeGroup,
  groupServices,
  selectedIds,
  selectedCount,
  totalMinutes,
  priceDisplay,
  guestName,
  preferredWindow,
  guestNote,
  whatsappUrl,
  copied,
  onChangeGroup,
  onToggleService,
  onChangeGuestName,
  onChangePreferredWindow,
  onChangeGuestNote,
  onCopyMessage,
}: BioMobilePreviewCardProps) {
  return (
    <div className="bg-[#FAF9F7] border border-[#D6D3D1] rounded-[28px] overflow-hidden shadow-sm max-w-[400px] mx-auto w-full flex flex-col">
      <div className="bg-white px-5 pt-6 pb-5 border-b border-[#E7E5E4] text-center">
        <p className="text-xs font-medium text-[#A87664]">{settings.instagramHandle}</p>
        <h2 className="text-xl font-semibold text-[#1C1917] mt-1">{settings.studioName}</h2>
        <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">{settings.bioSubtitle}</p>
        <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-[#57534E] flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#2F5D50]" aria-hidden="true" />
            {settings.workingHours}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#2F5D50]" aria-hidden="true" />
            {settings.addressShort}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          className="grid grid-cols-2 gap-1.5"
          role="tablist"
          aria-label="Hizmet kategorileri"
        >
          {BIO_SERVICE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeGroup === tab.id}
              onClick={() => onChangeGroup(tab.id)}
              className={`px-3 py-2.5 sm:py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap truncate ${
                activeGroup === tab.id
                  ? 'bg-[#2F5D50] text-white'
                  : 'bg-white border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2.5 flex-1">
        {groupServices.length === 0 ? (
          <p className="text-xs text-[#57534E] text-center py-6">
            Bu kategoride Bio linkinde gösterilen hizmet bulunmuyor.
          </p>
        ) : (
          groupServices.map((srv) => {
            const checked = selectedIds.includes(srv.id);
            return (
              <button
                key={srv.id}
                type="button"
                aria-pressed={checked}
                onClick={() => onToggleService(srv.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                  checked
                    ? 'bg-[#ECFDF5]/60 border-[#2F5D50]'
                    : 'bg-white border-[#E7E5E4] hover:border-[#A87664]/60'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1C1917] leading-snug">{srv.name}</p>
                  {srv.description && (
                    <p className="text-xs text-[#57534E] mt-1 leading-snug">{srv.description}</p>
                  )}
                  <p className="text-xs tabular-nums text-[#57534E] mt-1.5">
                    ~{srv.durationMinutes} dk
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <span className="text-xs font-semibold tabular-nums text-[#1C1917] whitespace-nowrap">
                    {srv.priceMax && srv.priceMax > srv.price
                      ? `${formatTL(srv.price)}–${formatTL(srv.priceMax)}`
                      : formatTL(srv.price)}
                  </span>
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                      checked
                        ? 'bg-[#2F5D50] border-[#2F5D50] text-white'
                        : 'border-[#D6D3D1] bg-white text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="bg-white border-t border-[#E7E5E4] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E5E4]">
          <div>
            <p className="text-[11px] text-[#57534E]">
              Seçili İşlem ({selectedCount}) · Tahmini Süre
            </p>
            <p
              data-testid="bio-estimated-duration"
              className="text-sm tabular-nums font-semibold text-[#1C1917] mt-0.5"
            >
              {selectedCount > 0 ? `~${formatDurationTr(totalMinutes)}` : 'Henüz seçim yok'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#57534E]">Tahmini Toplam</p>
            <p
              data-testid="bio-estimated-price"
              className="text-base tabular-nums font-semibold text-[#2F5D50] mt-0.5 whitespace-nowrap"
            >
              {priceDisplay}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <label htmlFor="bio-guest-name" className={FIELD_LABEL_CLASS}>
              Adınız Soyadınız
            </label>
            <input
              id="bio-guest-name"
              type="text"
              value={guestName}
              onChange={(e) => onChangeGuestName(e.target.value)}
              placeholder="Örn. Seda Kara"
              className={INPUT_SURFACE_CLASS}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-[#57534E] mb-1.5">Tercih Ettiğiniz Zaman</p>
            <div className="grid grid-cols-3 gap-1.5">
              {BIO_TIME_WINDOWS.map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() => onChangePreferredWindow(win)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                    preferredWindow === win
                      ? 'bg-[#2F5D50] text-white border-[#2F5D50]'
                      : 'bg-[#FAF9F7] text-[#57534E] border-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bio-guest-note" className={FIELD_LABEL_CLASS}>
              Ek Not (Opsiyonel)
            </label>
            <input
              id="bio-guest-note"
              type="text"
              value={guestNote}
              onChange={(e) => onChangeGuestNote(e.target.value)}
              placeholder="Örn. Süt beyazı badem model istiyorum"
              className={INPUT_SURFACE_CLASS}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={selectedCount === 0}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCount === 0
                ? 'bg-[#D6D3D1] text-white pointer-events-none'
                : 'bg-[#2F5D50] text-white hover:bg-[#244A40]'
            }`}
          >
            WhatsApp ile Randevu İste
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onCopyMessage}
            disabled={selectedCount === 0}
            aria-label="Randevu mesajını kopyala"
            className="px-3.5 py-3 rounded-xl border border-[#E7E5E4] bg-white text-[#1C1917] text-xs font-medium hover:bg-[#FAF9F7] disabled:opacity-45 shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-[#047857]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
