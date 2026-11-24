import { memo, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  title: string;
  dateLabel: string;
  note?: string;
}

export const BeforeAfterSlider = memo(function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  title,
  dateLabel,
  note,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [beforeErr, setBeforeErr] = useState(false);
  const [afterErr, setAfterErr] = useState(false);

  return (
    <div className="border border-[#E7E5E4] rounded-xl bg-white overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-[#F5F2EE] select-none overflow-hidden touch-pan-y">
        {/* After image (full background) */}
        {afterErr ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F3EFEA] text-[#57534E] p-4 text-center">
            <ImageOff className="w-6 h-6 mb-2 text-[#A87664]" aria-hidden="true" />
            <span className="text-xs font-medium">Sonrası görseli yüklenemedi</span>
          </div>
        ) : (
          <img
            src={afterUrl}
            alt={`${title} — Sonrası`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setAfterErr(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Before image clipped by slider position */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {beforeErr ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#ECE8E2] text-[#57534E] p-4 text-center">
              <ImageOff className="w-6 h-6 mb-2 text-[#A87664]" aria-hidden="true" />
              <span className="text-xs font-medium">Öncesi görseli yüklenemedi</span>
            </div>
          ) : (
            <img
              src={beforeUrl}
              alt={`${title} — Öncesi`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBeforeErr(true)}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Measured scrim labels */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[#1C1917]/75 text-white text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-md backdrop-blur-xs">
          Öncesi
        </div>
        <div className="pointer-events-none absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-[#2F5D50]/85 text-white text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-md backdrop-blur-xs">
          Sonrası
        </div>

        {/* Divider line & touch-friendly handle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-[#D6D3D1] shadow-md flex items-center justify-center text-[#1C1917] text-xs font-semibold">
            ↔
          </div>
        </div>

        {/* Full-surface accessible range input for pointer, touch & keyboard dragging */}
        <input
          type="range"
          min={5}
          max={95}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label={`${title} öncesi ve sonrası karşılaştırma kaydırıcısı`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize touch-pan-y"
        />
      </div>

      <div className="p-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1C1917] truncate">{title}</p>
          {note && <p className="text-xs text-[#57534E] mt-0.5 leading-snug">{note}</p>}
        </div>
        <span className="text-xs font-mono tabular-nums text-[#57534E] shrink-0">
          {dateLabel}
        </span>
      </div>
    </div>
  );
});
