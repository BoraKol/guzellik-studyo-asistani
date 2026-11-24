import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import type { StudioData } from '../../../domain/types/studio';
import { isValidStudioData } from '../../../infrastructure/firebase/mappers';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../ui/formStyles';

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB safety limit

interface DataPortabilitySectionProps {
  data: StudioData;
  onImportData: (nextData: StudioData) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onClearToEmpty: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function DataPortabilitySection({
  data,
  onImportData,
  onResetDemoData,
  onClearToEmpty,
  onNotify,
}: DataPortabilitySectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyoasistan-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Deferred revoke ensures iOS Safari finishes triggering the download
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('Tüm stüdyo verileri JSON yedeği olarak indirildi.');
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    setImportError(null);

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setImportError('Yedek dosyası 5 MB sınırını aşıyor.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidStudioData(parsed)) {
        setImportError('Seçilen dosya geçerli bir StüdyoAsistan yedeği değil.');
        return;
      }
      setCloudBusy(true);
      await onImportData(parsed);
      onNotify('Yedek dosyanız hesabınıza başarıyla aktarıldı.');
    } catch {
      setImportError('Yedek dosyası okunamadı. Lütfen geçerli bir yedek dosyası seçin.');
    } finally {
      setCloudBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <section className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-4">
      <div className="pb-4 border-b border-[#E7E5E4]">
        <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
          Veri Güvenliği &amp; Yedekleme
        </h2>
        <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
          Tüm danışan kartlarınız, paket sayaçlarınız ve fotoğraflarınız yalnızca sizin hesabınıza
          özel olarak güvenle saklanır; telefon, tablet veya bilgisayarınızdan anında
          erişebilirsiniz. İsterseniz verilerinizi tek tıkla dışa aktarabilirsiniz.
        </p>
      </div>

      {importError && (
        <p
          role="alert"
          className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2"
        >
          {importError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          disabled={cloudBusy}
          onClick={handleExportJson}
          className={PRIMARY_BUTTON_CLASS}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Verileri Dışa Aktar
        </button>

        <button
          type="button"
          disabled={cloudBusy}
          onClick={() => fileInputRef.current?.click()}
          className={SECONDARY_BUTTON_CLASS}
        >
          <Upload className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
          {cloudBusy ? 'Aktarılıyor...' : 'Yedekten Geri Yükle'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={(e) => {
            handleImportFile(e.target.files?.[0]).catch(() => {});
          }}
          className="hidden"
        />

        <button
          type="button"
          disabled={cloudBusy}
          onClick={async () => {
            setCloudBusy(true);
            try {
              await onResetDemoData();
              onNotify('Örnek danışan, aktif paket ve randevu kayıtları hesabınıza yüklendi.');
            } finally {
              setCloudBusy(false);
            }
          }}
          className={SECONDARY_BUTTON_CLASS}
        >
          <RotateCcw className="w-4 h-4 text-[#A87664]" aria-hidden="true" />
          Örnek Merkez Verisi Yükle
        </button>

        {!confirmClear ? (
          <button
            type="button"
            disabled={cloudBusy}
            onClick={() => setConfirmClear(true)}
            className="px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50 whitespace-nowrap"
          >
            Danışanları Temizle (Boş Başla)
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 rounded-lg flex-wrap">
            <span className="text-xs text-[#B91C1C]">Emin misiniz?</span>
            <button
              type="button"
              disabled={cloudBusy}
              onClick={async () => {
                setCloudBusy(true);
                try {
                  await onClearToEmpty();
                  setConfirmClear(false);
                  onNotify(
                    'Danışan ve randevu kayıtları temizlendi. Kendi merkezinizle başlayabilirsiniz.'
                  );
                } finally {
                  setCloudBusy(false);
                }
              }}
              className="text-xs font-semibold text-[#B91C1C] underline disabled:opacity-50"
            >
              Evet, Temizle
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="text-xs text-[#57534E]"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
