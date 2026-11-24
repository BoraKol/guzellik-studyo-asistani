import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatShortDateTr } from '../../../domain/engines/dateUtils';
import { buildWhatsAppLink } from '../../../domain/engines/formatters';
import { buildRecallMessage } from '../../../domain/engines/messageBuilder';
import type {
  BeforeAfterUploadInput,
  Client,
  ClientPackage,
  PaymentStatus,
  StudioSettings,
} from '../../../domain/types/studio';
import { BeforeAfterArchiveSection } from './BeforeAfterArchiveSection';
import { ClientPackageSection } from './ClientPackageSection';

interface ClientDetailPanelProps {
  client: Client | null;
  settings: StudioSettings;
  todayIso: string;
  onBackToList: () => void;
  onDecrementPackageSession: (clientId: string) => void;
  onUpdatePackagePayment: (clientId: string, status: PaymentStatus) => void;
  onAddOrReplacePackage: (clientId: string, pkg: ClientPackage) => void;
  onUploadBeforeAfter: (client: Client, input: BeforeAfterUploadInput) => Promise<void>;
}

export function ClientDetailPanel({
  client,
  settings,
  todayIso,
  onBackToList,
  onDecrementPackageSession,
  onUpdatePackagePayment,
  onAddOrReplacePackage,
  onUploadBeforeAfter,
}: ClientDetailPanelProps) {
  if (!client) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-[#57534E]">
          Detaylarını görmek için bir müşteri seçin veya yeni müşteri ekleyin.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden pb-2">
        <button
          type="button"
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2F5D50] py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Müşteri listesine dön
        </button>
      </div>

      {/* Client Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 pb-5 border-b border-[#E7E5E4]">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#1C1917]">{client.name}</h2>
          <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
            {client.phone ? (
              <>
                <span className="font-mono tabular-nums">{client.phone}</span>
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            {client.primaryCategory === 'LAZER_CILT'
              ? 'Lazer Epilasyon & Cilt Bakımı'
              : 'Protez Tırnak & Kaş / Kirpik'}
            <span aria-hidden="true"> · </span>
            Sonraki hatırlatma:{' '}
            <span className="font-mono tabular-nums">
              {formatShortDateTr(client.nextRecallDate)}
            </span>
          </p>
        </div>

        <a
          href={buildWhatsAppLink(
            client.phone,
            buildRecallMessage(client, settings, client.recallCycleDays)
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          WhatsApp Mesaj Gönder
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>

      {client.allergyNote && (
        <div
          role="note"
          className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 flex items-start gap-2.5 text-[#B91C1C]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold">Alerji / Hassasiyet Uyarısı: </span>
            <span>{client.allergyNote}</span>
          </div>
        </div>
      )}

      <ClientPackageSection
        client={client}
        todayIso={todayIso}
        onDecrementSession={onDecrementPackageSession}
        onUpdatePayment={onUpdatePackagePayment}
        onUpsertPackage={onAddOrReplacePackage}
      />

      {/* Technical Formula & Session History */}
      <div className="pt-5 border-t border-[#E7E5E4] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1C1917]">
            Teknik Formül &amp; İşlem Geçmişi
          </h3>
          <span className="text-xs font-mono tabular-nums text-[#57534E]">
            {client.sessions.length} kayıt
          </span>
        </div>

        {client.sessions.length === 0 ? (
          <p className="text-xs text-[#57534E] py-3">
            Henüz kaydedilmiş teknik işlem kaydı bulunmuyor.
          </p>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {client.sessions.map((ses) => {
              const p = ses.technicalParams;
              const techItems = [
                p.device ? `Cihaz: ${p.device}` : null,
                p.energyJoule ? `Enerji: ${p.energyJoule}` : null,
                p.bodyArea ? `Bölge: ${p.bodyArea}` : null,
                p.skinType ? `Cilt: ${p.skinType}` : null,
                p.nailShape ? `Form: ${p.nailShape}` : null,
                p.colorOrPigmentCode ? `Renk/Pigment: ${p.colorOrPigmentCode}` : null,
                p.curlOrShield ? `Kıvrım/Ped: ${p.curlOrShield}` : null,
                p.productOrSerum ? `Ürün: ${p.productOrSerum}` : null,
              ].filter((v): v is string => Boolean(v));

              return (
                <article key={ses.id} className="py-4 first:pt-2 space-y-2">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1C1917]">
                      {ses.serviceName}
                      {ses.sessionNumber ? (
                        <span className="ml-2 text-xs font-mono tabular-nums text-[#2F5D50]">
                          ({ses.sessionNumber}. Seans)
                        </span>
                      ) : null}
                    </p>
                    <span className="text-xs font-mono tabular-nums text-[#57534E] shrink-0">
                      {formatShortDateTr(ses.date)}
                    </span>
                  </div>

                  {techItems.length > 0 && (
                    <p className="text-xs font-mono tabular-nums text-[#1C1917] bg-[#FAF9F7] px-3 py-2 rounded-lg leading-relaxed break-words">
                      {techItems.join('  ·  ')}
                    </p>
                  )}

                  {ses.notes && (
                    <p className="text-xs text-[#57534E] leading-relaxed">{ses.notes}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <BeforeAfterArchiveSection client={client} onUpload={onUploadBeforeAfter} />
    </>
  );
}
