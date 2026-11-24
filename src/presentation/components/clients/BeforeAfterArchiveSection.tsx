import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { formatShortDateTr } from '../../../domain/engines/dateUtils';
import type {
  BeforeAfterUploadInput,
  Client,
} from '../../../domain/types/studio';
import { compressImageFileToBlob } from '../../../infrastructure/media/imageCompressor';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { FIELD_LABEL_CLASS, INPUT_WHITE_CLASS } from '../ui/formStyles';

interface BeforeAfterArchiveSectionProps {
  client: Client;
  onUpload: (client: Client, input: BeforeAfterUploadInput) => Promise<void>;
}

export function BeforeAfterArchiveSection({
  client,
  onUpload,
}: BeforeAfterArchiveSectionProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [beforeBlob, setBeforeBlob] = useState<Blob | null>(null);
  const [afterBlob, setAfterBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setShowUploadForm(false);
    setBeforeBlob(null);
    setAfterBlob(null);
    setError(null);
  }, [client.id]);

  async function handleFileSelect(side: 'before' | 'after', file: File | undefined) {
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressImageFileToBlob(file, 960, 0.8);
      if (side === 'before') setBeforeBlob(compressed);
      else setAfterBlob(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fotoğraf sıkıştırılamadı.');
    } finally {
      setCompressing(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lütfen karşılaştırma başlığı girin (ör. 3. Seans Hydrafacial).');
      return;
    }
    if (!beforeBlob || !afterBlob) {
      setError('Lütfen hem Öncesi hem Sonrası fotoğrafını seçin.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await onUpload(client, {
        title: title.trim(),
        note: note.trim() || undefined,
        beforeBlob,
        afterBlob,
      });
      setTitle('');
      setNote('');
      setBeforeBlob(null);
      setAfterBlob(null);
      setShowUploadForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Fotoğraflar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pt-5 border-t border-[#E7E5E4] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-semibold text-[#1C1917]">
            Öncesi / Sonrası Karşılaştırma Arşivi
          </h3>
          <p className="text-xs text-[#57534E] mt-0.5">
            Öncesi ve sonrası fotoğraflarınız otomatik optimize edilerek yalnızca sizin hesabınıza
            özel güvenle saklanır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadForm((v) => !v)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF9F7] whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <ImagePlus className="w-3.5 h-3.5 text-[#2F5D50]" aria-hidden="true" />
          Fotoğraf Ekle
        </button>
      </div>

      {showUploadForm && (
        <form
          onSubmit={handleSave}
          className="p-4 border border-[#E7E5E4] rounded-xl bg-[#FAF9F7] space-y-3"
        >
          {error && (
            <p className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ba-title" className={FIELD_LABEL_CLASS}>
                Başlık *
              </label>
              <input
                id="ba-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Badem Protez — #104 Süt Beyazı"
                className={INPUT_WHITE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ba-note" className={FIELD_LABEL_CLASS}>
                Kısa Not
              </label>
              <input
                id="ba-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn. 21 gün sonrası yenileme"
                className={INPUT_WHITE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ba-before" className={FIELD_LABEL_CLASS}>
                Öncesi Fotoğrafı *
              </label>
              <input
                id="ba-before"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect('before', e.target.files?.[0])}
                className="w-full text-xs text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#E7E5E4] file:bg-white file:text-xs file:font-medium"
              />
              {beforeBlob && (
                <p className="text-xs text-[#047857] mt-1">
                  Öncesi fotoğrafı yüklemeye hazır ({Math.round(beforeBlob.size / 1024)} KB).
                </p>
              )}
            </div>
            <div>
              <label htmlFor="ba-after" className={FIELD_LABEL_CLASS}>
                Sonrası Fotoğrafı *
              </label>
              <input
                id="ba-after"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect('after', e.target.files?.[0])}
                className="w-full text-xs text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#E7E5E4] file:bg-white file:text-xs file:font-medium"
              />
              {afterBlob && (
                <p className="text-xs text-[#047857] mt-1">
                  Sonrası fotoğrafı yüklemeye hazır ({Math.round(afterBlob.size / 1024)} KB).
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-3 py-2 text-xs text-[#57534E]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={compressing || uploading}
              className="px-4 py-2 rounded-lg bg-[#2F5D50] text-white text-xs font-medium disabled:opacity-50"
            >
              {uploading
                ? 'Fotoğraflar Yükleniyor...'
                : compressing
                  ? 'Hazırlanıyor...'
                  : 'Fotoğrafları Kaydet'}
            </button>
          </div>
        </form>
      )}

      {client.beforeAfterPhotos.length === 0 ? (
        <p className="text-xs text-[#57534E]">
          Bu müşteri için henüz Öncesi/Sonrası görseli yüklenmedi.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.beforeAfterPhotos.map((pair) => (
            <BeforeAfterSlider
              key={pair.id}
              beforeUrl={pair.beforeUrl}
              afterUrl={pair.afterUrl}
              title={pair.title}
              dateLabel={formatShortDateTr(pair.date)}
              note={pair.note}
            />
          ))}
        </div>
      )}
    </div>
  );
}
