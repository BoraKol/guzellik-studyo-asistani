import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Filter,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { formatShortDateTr } from '../../../domain/engines/dateUtils';
import {
  buildClassifiedSessionFeed,
  filterClassifiedSessions,
  type ClassifiedSessionRecord,
  type SessionSmartFilter,
} from '../../../domain/engines/sessionTagEngine';
import type { Client } from '../../../domain/types/studio';

interface SmartSessionFeedProps {
  clients: Client[];
  onOpenClient: (clientId: string) => void;
  onPrefillFromRecord: (record: ClassifiedSessionRecord) => void;
}

export function SmartSessionFeed({
  clients,
  onOpenClient,
  onPrefillFromRecord,
}: SmartSessionFeedProps) {
  const [smartFilter, setSmartFilter] = useState<SessionSmartFilter>('ALL');
  const [smartSearch, setSmartSearch] = useState('');

  const classifiedFeed = useMemo(() => buildClassifiedSessionFeed(clients), [clients]);

  const smartCounts = useMemo(
    () => ({
      ALL: classifiedFeed.length,
      KRITIK_UYARI: classifiedFeed.filter((r) => r.classification.hasCriticalWarning).length,
      OZEL_ISTEK: classifiedFeed.filter((r) => r.classification.hasSpecialRequest).length,
      STANDART: classifiedFeed.filter((r) => r.classification.primaryCategory === 'STANDART')
        .length,
    }),
    [classifiedFeed]
  );

  const filteredFeed = useMemo(
    () => filterClassifiedSessions(classifiedFeed, smartFilter, smartSearch),
    [classifiedFeed, smartFilter, smartSearch]
  );

  const filterTabs = [
    {
      id: 'ALL' as const,
      label: 'Tüm Kayıtlar',
      count: smartCounts.ALL,
      activeBg: 'bg-[#1C1917] text-white border-[#1C1917]',
    },
    {
      id: 'KRITIK_UYARI' as const,
      label: 'Kritik Uyarı',
      count: smartCounts.KRITIK_UYARI,
      activeBg: 'bg-[#B91C1C] text-white border-[#B91C1C]',
    },
    {
      id: 'OZEL_ISTEK' as const,
      label: 'Özel İstek',
      count: smartCounts.OZEL_ISTEK,
      activeBg: 'bg-[#A87664] text-white border-[#A87664]',
    },
    {
      id: 'STANDART' as const,
      label: 'Standart',
      count: smartCounts.STANDART,
      activeBg: 'bg-[#2F5D50] text-white border-[#2F5D50]',
    },
  ];

  return (
    <section
      aria-label="Akıllı Etiketli İşlem Kayıtları"
      data-testid="smart-session-filter-panel"
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#E7E5E4]">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#2F5D50] shrink-0" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#1C1917]">
              Akıllı Kayıt Filtresi — Kritik Uyarılar &amp; Özel İstekler
            </h2>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Tüm işlem notları, alerji kayıtları ve teknik parametreler otomatik taranarak
            kategorize edilir.
          </p>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search
            className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={smartSearch}
            onChange={(e) => setSmartSearch(e.target.value)}
            placeholder="Müşteri, cihaz, pigment veya etiket ara..."
            aria-label="İşlem kayıtlarında ara"
            className="w-full pl-8 pr-8 py-2 text-base sm:text-xs border border-[#E7E5E4] rounded-lg bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50]"
          />
          {smartSearch && (
            <button
              type="button"
              onClick={() => setSmartSearch('')}
              aria-label="Aramayı temizle"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] p-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap"
        role="tablist"
        aria-label="Akıllı kategori filtresi"
      >
        {filterTabs.map((tab) => {
          const isActive = smartFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`smart-filter-${tab.id.toLowerCase()}`}
              onClick={() => setSmartFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? tab.activeBg
                  : 'bg-[#FAF9F7] border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              {tab.id === 'KRITIK_UYARI' && (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              {tab.id === 'OZEL_ISTEK' && (
                <Bookmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{tab.label}</span>
              <span
                className={`font-mono tabular-nums text-[11px] ${
                  isActive ? 'opacity-90' : 'text-[#78716C]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredFeed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF9F7]/60 px-4 py-8 text-center space-y-2">
          <p className="text-sm text-[#57534E]">Seçili filtreye uyan işlem kaydı bulunamadı.</p>
          {(smartFilter !== 'ALL' || smartSearch.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setSmartFilter('ALL');
                setSmartSearch('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF9F7]"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredFeed.slice(0, 12).map((record) => {
            const { client, session, classification } = record;
            const tp = session.technicalParams;
            const techSummary = [
              tp.device,
              tp.energyJoule,
              tp.skinType,
              tp.nailShape,
              tp.colorOrPigmentCode,
              tp.curlOrShield,
              tp.productOrSerum,
            ].filter(Boolean);

            return (
              <article
                key={`${client.id}-${session.id}`}
                className={`rounded-xl border border-[#E7E5E4] border-l-[3px] p-3.5 sm:p-4 space-y-2.5 bg-[#FAF9F7]/50 ${
                  classification.hasCriticalWarning
                    ? 'border-l-[#B91C1C]'
                    : classification.hasSpecialRequest
                      ? 'border-l-[#A87664]'
                      : 'border-l-[#2F5D50]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenClient(client.id)}
                        className="text-sm font-semibold text-[#1C1917] hover:text-[#2F5D50] transition-colors text-left"
                      >
                        {client.name}
                      </button>
                      <span className="text-xs text-[#57534E]">· {session.serviceName}</span>
                      {session.sessionNumber && (
                        <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                          ({session.sessionNumber}. seans)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono tabular-nums text-[#78716C]">
                      {formatShortDateTr(session.date)}
                      {techSummary.length > 0 ? ` · ${techSummary.slice(0, 3).join(' · ')}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {classification.hasCriticalWarning && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF2F2] text-[#B91C1C] text-[11px] font-semibold">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        Kritik Uyarı
                      </span>
                    )}
                    {classification.hasSpecialRequest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#92400E] text-[11px] font-semibold">
                        <Bookmark className="w-3 h-3" aria-hidden="true" />
                        Özel İstek
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onPrefillFromRecord(record)}
                      className="px-2.5 py-1.5 sm:py-1 rounded-md border border-[#E7E5E4] bg-white text-[11px] font-medium text-[#1C1917] hover:border-[#2F5D50] hover:text-[#2F5D50] transition-colors whitespace-nowrap"
                    >
                      Formu Doldur
                    </button>
                  </div>
                </div>

                {session.notes && (
                  <p className="text-xs text-[#44403C] leading-relaxed">{session.notes}</p>
                )}

                {classification.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {classification.tags.slice(0, 4).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSmartSearch(tag.label)}
                        title={`${tag.reason} — bu etikete göre filtrele`}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                          tag.category === 'KRITIK_UYARI'
                            ? 'bg-white border-[#FECACA] text-[#991B1B] hover:bg-[#FEF2F2]'
                            : 'bg-white border-[#E7D3C5] text-[#8C5B4A] hover:bg-[#FFFBEB]'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
