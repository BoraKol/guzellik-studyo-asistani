import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useCopyFeedback } from '../../../application/hooks/useCopyFeedback';
import {
  AFTERCARE_CARDS,
  CONTRAINDICATION_PROTOCOL_WARNING,
  PRE_SESSION_SAFETY_CHECKLIST,
} from '../../../domain/constants/deterministicTemplates';
import { buildWhatsAppLink } from '../../../domain/engines/formatters';
import { buildAftercareWhatsAppMessage } from '../../../domain/engines/messageBuilder';
import type { StudioData } from '../../../domain/types/studio';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../ui/formStyles';

interface AftercareSafetyViewProps {
  data: StudioData;
}

export function AftercareSafetyView({ data }: AftercareSafetyViewProps) {
  const [selectedCardId, setSelectedCardId] = useState(AFTERCARE_CARDS[0].id);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [checkedRisks, setCheckedRisks] = useState<string[]>([]);
  const { copiedKey, copyText } = useCopyFeedback();

  const activeCard =
    AFTERCARE_CARDS.find((c) => c.id === selectedCardId) ?? AFTERCARE_CARDS[0];
  const selectedClient = data.clients.find((c) => c.id === selectedClientId);

  const formattedMessage = useMemo(
    () =>
      buildAftercareWhatsAppMessage(activeCard, data.settings.studioName, selectedClient?.name),
    [activeCard, data.settings.studioName, selectedClient?.name]
  );

  const waLink = buildWhatsAppLink(selectedClient?.phone ?? '', formattedMessage);

  function toggleRisk(id: string) {
    setCheckedRisks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const hasRisk = checkedRisks.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="no-print">
        <p className="text-xs font-medium text-[#A87664]">
          Statik Onaylı Şablonlar · Sıfır Tıbbi Halüsinasyon
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
          Bakım Kartları &amp; Güvenlik Kontrolü
        </h1>
      </div>

      {/* Section 1: İşlem Sonrası Bakım Kartları */}
      <section className="space-y-4">
        <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            className="flex items-center gap-1 p-1 bg-white border border-[#E7E5E4] rounded-lg overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="İşlem sonrası bakım kartları"
          >
            {AFTERCARE_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={card.id === activeCard.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  card.id === activeCard.id
                    ? 'bg-[#2F5D50] text-white'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {card.shortTitle}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="aftercare-client" className="sr-only">
              Müşteri seçin
            </label>
            <select
              id="aftercare-client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full lg:w-auto px-3 py-2.5 sm:py-2 text-base sm:text-xs border border-[#E7E5E4] rounded-lg bg-white text-[#1C1917]"
            >
              <option value="">Genel Gönderim (Müşteri seçmeden)</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` (${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <article className="print-card bg-white border border-[#E7E5E4] rounded-xl p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E7E5E4]">
            <div>
              <p className="text-xs font-medium text-[#A87664]">
                {data.settings.studioName} · {activeCard.nicheLabel} · {activeCard.validWindow}
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1C1917] mt-1">
                {activeCard.title}
              </h2>
              <p className="text-sm text-[#57534E] mt-2 max-w-2xl leading-relaxed">
                {activeCard.summary}
              </p>
            </div>

            <div className="no-print flex items-center gap-2 flex-wrap shrink-0">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={PRIMARY_BUTTON_CLASS}
              >
                WhatsApp&apos;tan Müşteriye Gönder
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => copyText('aftercare', formattedMessage)}
                className={SECONDARY_BUTTON_CLASS}
              >
                {copiedKey === 'aftercare' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#047857]" />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#57534E]" />
                    Metni Kopyala
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={SECONDARY_BUTTON_CLASS}
              >
                <Printer className="w-3.5 h-3.5 text-[#57534E]" />
                Yazdır / PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#047857]">Yapılması Önerilenler</h3>
              <ul className="space-y-2.5">
                {activeCard.doItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-[#1C1917] leading-relaxed pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#047857] before:font-bold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#B91C1C]">Kaçınılması Gerekenler</h3>
              <ul className="space-y-2.5">
                {activeCard.dontItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-[#1C1917] leading-relaxed pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#B91C1C] before:font-bold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#57534E]">
            <p className="font-medium text-[#1C1917]">{activeCard.recommendedNextVisit}</p>
            <p className="font-mono tabular-nums">
              {data.settings.studioName}
              {data.settings.whatsappPhone ? ` · ${data.settings.whatsappPhone}` : ''}
            </p>
          </div>
        </article>
      </section>

      {/* Section 2: İşlem Öncesi Güvenlik Kontrol Listesi */}
      <section className="no-print bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E7E5E4]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
              İşlem Öncesi Güvenlik Kontrol Listesi (Lazer &amp; Cilt)
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Seansa başlamadan önce danışana sorulacak sabit kontrendikasyon maddeleri.
            </p>
          </div>
          {hasRisk && (
            <button
              type="button"
              onClick={() => setCheckedRisks([])}
              className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] whitespace-nowrap self-start sm:self-auto"
            >
              Kontrolü Sıfırla
            </button>
          )}
        </div>

        {hasRisk ? (
          <div
            role="alert"
            data-testid="safety-warning-banner"
            className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-start gap-3 text-[#B91C1C]"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                İşlem öncesi uzman değerlendirmesi / erteleme gerekebilir.
              </p>
              <p className="text-xs leading-relaxed text-[#991B1B]">
                {CONTRAINDICATION_PROTOCOL_WARNING} ({checkedRisks.length} risk maddesi işaretlendi)
              </p>
            </div>
          </div>
        ) : (
          <div
            data-testid="safety-clear-banner"
            className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4 flex items-center gap-3 text-[#047857]"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium leading-relaxed">
              İşaretli kontrendikasyon riski yok. Standart stüdyo ön bilgilendirmesi ile seansa
              geçilebilir.
            </p>
          </div>
        )}

        <div className="divide-y divide-[#E7E5E4]">
          {PRE_SESSION_SAFETY_CHECKLIST.map((item) => {
            const isChecked = checkedRisks.includes(item.id);
            return (
              <label key={item.id} className="py-3.5 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleRisk(item.id)}
                  className="mt-0.5 w-4 h-4 accent-[#B91C1C] shrink-0"
                />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug ${
                      isChecked ? 'text-[#B91C1C]' : 'text-[#1C1917]'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
