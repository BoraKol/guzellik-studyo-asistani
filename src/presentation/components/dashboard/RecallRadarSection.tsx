import { Check, Copy, ExternalLink, Sparkles, UserCheck } from 'lucide-react';
import { buildWhatsAppLink } from '../../../domain/engines/formatters';
import type { RecallRadarItem } from '../../../domain/types/studio';

interface RecallRadarSectionProps {
  dueNow: RecallRadarItem[];
  upcomingWeek: RecallRadarItem[];
  aiDrafts: Record<string, string>;
  aiLoadingId: string | null;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onPolishWithAI: (item: RecallRadarItem) => void;
  onMarkReminded: (clientId: string) => void;
  onOpenClient: (clientId: string) => void;
}

export function RecallRadarSection({
  dueNow,
  upcomingWeek,
  aiDrafts,
  aiLoadingId,
  copiedKey,
  onCopy,
  onPolishWithAI,
  onMarkReminded,
  onOpenClient,
}: RecallRadarSectionProps) {
  function renderRow(item: RecallRadarItem) {
    const activeMessage = aiDrafts[item.client.id] ?? item.suggestedMessage;
    const whatsappHref = buildWhatsAppLink(item.client.phone, activeMessage);
    const isOverdue = item.daysUntilRecall < 0;
    const isToday = item.daysUntilRecall === 0;
    const copyId = `recall-${item.client.id}`;

    return (
      <div
        key={item.client.id}
        className="py-4 border-t border-[#E7E5E4] first:border-t-0 flex flex-col gap-3"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpenClient(item.client.id)}
              className="text-sm font-semibold text-[#1C1917] hover:text-[#2F5D50] transition-colors text-left truncate"
            >
              {item.client.name}
            </button>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
                item.wasRemindedRecently
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : isOverdue
                    ? 'bg-[#FEF2F2] text-[#B91C1C]'
                    : isToday
                      ? 'bg-[#FFFBEB] text-[#B45309]'
                      : 'bg-[#F5F2EE] text-[#57534E]'
              }`}
            >
              {item.wasRemindedRecently
                ? 'Hatırlatıldı'
                : isOverdue
                  ? `${Math.abs(item.daysUntilRecall)} gün gecikti`
                  : isToday
                    ? 'Bugün zamanı geldi'
                    : `${item.daysUntilRecall} gün kaldı`}
            </span>
          </div>

          <p className="text-xs text-[#57534E] tabular-nums">
            {item.client.lastServiceName}
            <span aria-hidden="true"> · </span>
            Son ziyaret {item.daysSinceLastVisit} gün önce
            <span aria-hidden="true"> · </span>
            Döngü {item.client.recallCycleDays} gün
          </p>
        </div>

        <p className="text-xs text-[#57534E] bg-[#FAF9F7] border border-[#E7E5E4]/80 rounded-lg px-3.5 py-2.5 leading-relaxed">
          “{activeMessage}”
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] transition-colors whitespace-nowrap shrink-0"
          >
            WhatsApp&apos;tan Hatırlat
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => onCopy(copyId, activeMessage)}
            aria-label={`${item.client.name} için hatırlatma mesajını kopyala`}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#E7E5E4] bg-white text-[#1C1917] text-xs font-medium hover:bg-[#FAF9F7] transition-colors whitespace-nowrap shrink-0"
          >
            {copiedKey === copyId ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#047857]" aria-hidden="true" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#57534E]" aria-hidden="true" />
                Kopyala
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onPolishWithAI(item)}
            disabled={aiLoadingId === item.client.id}
            aria-label={`${item.client.name} için AI mesaj taslağı oluştur`}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#E7E5E4] bg-white text-[#57534E] text-xs font-medium hover:text-[#1C1917] hover:bg-[#FAF9F7] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A87664]" aria-hidden="true" />
            {aiLoadingId === item.client.id ? 'Yazılıyor...' : 'AI İfade'}
          </button>

          <button
            type="button"
            onClick={() => onMarkReminded(item.client.id)}
            aria-label={`${item.client.name} hatırlatıldı olarak işaretle`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              item.wasRemindedRecently
                ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                : 'border border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#FAF9F7]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {item.wasRemindedRecently ? 'Hatırlatıldı' : 'Hatırlatıldı İşaretle'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="xl:col-span-7 bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
            Geri Çağırma Radarı
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            21 gün tırnak · 30 gün cilt bakımı · 35–42 gün lazer · 45 gün kirpik döngüsüne göre
            otomatik taranır.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-[#57534E] shrink-0">
          {dueNow.length + upcomingWeek.length} kişi
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold text-[#B91C1C] mb-1">
          Zamanı Geldi — Bugün / Gecikmiş ({dueNow.length})
        </h3>
        {dueNow.length === 0 ? (
          <p className="text-sm text-[#57534E] py-4">
            Şu an gecikmiş veya bugün zamanı gelen geri çağırma bulunmuyor.
          </p>
        ) : (
          <div>{dueNow.map(renderRow)}</div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-[#E7E5E4]">
        <h3 className="text-xs font-semibold text-[#B45309] mb-1">
          Bu Hafta Yaklaşanlar ({upcomingWeek.length})
        </h3>
        {upcomingWeek.length === 0 ? (
          <p className="text-sm text-[#57534E] py-4">
            Önümüzdeki 7 gün içinde döngüsü dolacak başka müşteri görünmüyor.
          </p>
        ) : (
          <div>{upcomingWeek.map(renderRow)}</div>
        )}
      </div>
    </section>
  );
}
