import { AlertTriangle, Bookmark, Tag } from 'lucide-react';
import type { SessionClassification } from '../../../domain/engines/sessionTagEngine';

interface AutoTagSummaryBoxProps {
  classification: SessionClassification;
  heading: string;
  emptyLabel: string;
  testId?: string;
  showReasons?: boolean;
  onToggleCritical?: () => void;
  onToggleSpecial?: () => void;
}

/**
 * DRY live auto-tagging classification summary reused across AI note parser and manual review form.
 */
export function AutoTagSummaryBox({
  classification,
  heading,
  emptyLabel,
  testId,
  showReasons = false,
  onToggleCritical,
  onToggleSpecial,
}: AutoTagSummaryBoxProps) {
  const containerTone = classification.hasCriticalWarning
    ? 'bg-[#FEF2F2]/70 border-[#FECACA] border-l-[#B91C1C]'
    : classification.hasSpecialRequest
      ? 'bg-[#FFFBEB]/80 border-[#FDE68A] border-l-[#A87664]'
      : 'bg-[#FAF9F7] border-[#E7E5E4] border-l-[#2F5D50]';

  return (
    <div
      data-testid={testId}
      className={`rounded-xl border border-l-[3px] p-3.5 space-y-2.5 ${containerTone}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-[#57534E] shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#1C1917]">{heading}</span>
          {classification.hasCriticalWarning && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              Kritik Uyarı
            </span>
          )}
          {classification.hasSpecialRequest && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11px] font-semibold">
              <Bookmark className="w-3 h-3" aria-hidden="true" />
              Özel İstek
            </span>
          )}
          {!classification.hasCriticalWarning && !classification.hasSpecialRequest && (
            <span className="text-xs font-medium text-[#2F5D50]">{emptyLabel}</span>
          )}
        </div>

        {onToggleCritical && onToggleSpecial ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onToggleCritical}
              className="px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white text-[11px] font-medium text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
            >
              + Kritik Uyarı
            </button>
            <button
              type="button"
              onClick={onToggleSpecial}
              className="px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white text-[11px] font-medium text-[#92400E] hover:bg-[#FFFBEB] transition-colors"
            >
              + Özel İstek
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
            {classification.tags.length} otomatik etiket
          </span>
        )}
      </div>

      {classification.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {classification.tags.map((tag) => (
            <span
              key={tag.id}
              title={tag.reason}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                tag.category === 'KRITIK_UYARI'
                  ? 'bg-white border-[#FECACA] text-[#991B1B]'
                  : 'bg-white border-[#E7D3C5] text-[#8C5B4A]'
              }`}
            >
              {tag.label}
              {showReasons && (
                <>
                  {' '}
                  · <span className="font-normal opacity-80">{tag.reason}</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
