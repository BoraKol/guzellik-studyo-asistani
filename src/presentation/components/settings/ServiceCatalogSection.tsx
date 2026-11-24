import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  BIO_GROUP_LABELS,
  DEFAULT_RECALL_DAYS_BY_GROUP,
} from '../../../domain/constants/studioLabels';
import { formatTL } from '../../../domain/engines/formatters';
import { deriveCategoryFromBioGroup } from '../../../domain/engines/serviceClassifier';
import type { BioServiceGroup, ServiceItem } from '../../../domain/types/studio';
import {
  FIELD_LABEL_CLASS,
  INPUT_WHITE_CLASS,
  MONO_INPUT_WHITE_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../ui/formStyles';

interface ServiceCatalogSectionProps {
  services: ServiceItem[];
  onAddService: (service: Omit<ServiceItem, 'id'>) => void;
  onDeleteService: (serviceId: string) => void;
  onNotify: (msg: string) => void;
}

export function ServiceCatalogSection({
  services,
  onAddService,
  onDeleteService,
  onNotify,
}: ServiceCatalogSectionProps) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<BioServiceGroup>('LAZER_EPILASYON');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('45');
  const [recall, setRecall] = useState('35');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen hizmet adını girin.');
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setError('Lütfen geçerli bir fiyat (₺) girin.');
      return;
    }
    setError(null);
    onAddService({
      name: name.trim(),
      bioGroup: group,
      category: deriveCategoryFromBioGroup(group),
      price: priceNum,
      durationMinutes: Math.max(10, Number(duration) || 45),
      defaultRecallDays: Math.max(7, Number(recall) || 28),
      showInBio: true,
      description: description.trim() || undefined,
    });
    setName('');
    setPrice('');
    setDescription('');
    onNotify('Yeni hizmet kataloğa ve Bio fiyat linkine eklendi.');
  }

  return (
    <section className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-5">
      <div className="pb-4 border-b border-[#E7E5E4] flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">Hizmet Kataloğu</h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Fiyat (₺), tahmini süre ve varsayılan geri çağırma periyodu.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-[#57534E] shrink-0">
          {services.length} hizmet
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-[#1C1917]">Yeni Hizmet Ekle</p>
        {error && (
          <p className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label htmlFor="srv-name" className={FIELD_LABEL_CLASS}>
              Hizmet Adı *
            </label>
            <input
              id="srv-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Medikal Ayak Bakımı + Kalıcı Oje"
              className={INPUT_WHITE_CLASS}
            />
          </div>
          <div>
            <label htmlFor="srv-group" className={FIELD_LABEL_CLASS}>
              Kategori
            </label>
            <select
              id="srv-group"
              value={group}
              onChange={(e) => {
                const next = e.target.value as BioServiceGroup;
                setGroup(next);
                setRecall(String(DEFAULT_RECALL_DAYS_BY_GROUP[next]));
              }}
              className={INPUT_WHITE_CLASS}
            >
              {(Object.keys(BIO_GROUP_LABELS) as BioServiceGroup[]).map((g) => (
                <option key={g} value={g}>
                  {BIO_GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="srv-price" className={FIELD_LABEL_CLASS}>
              Fiyat (₺) *
            </label>
            <input
              id="srv-price"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1200"
              className={MONO_INPUT_WHITE_CLASS}
            />
          </div>
          <div>
            <label htmlFor="srv-dur" className={FIELD_LABEL_CLASS}>
              Süre (dk) / Döngü (gün)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="srv-dur"
                type="number"
                min={10}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-label="Süre dakika"
                className={MONO_INPUT_WHITE_CLASS}
              />
              <input
                type="number"
                min={7}
                value={recall}
                onChange={(e) => setRecall(e.target.value)}
                aria-label="Geri çağırma günü"
                className={MONO_INPUT_WHITE_CLASS}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kısa açıklama (Bio linkinde görünür, opsiyonel)"
            aria-label="Hizmet kısa açıklaması"
            className={`${INPUT_WHITE_CLASS} flex-1`}
          />
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Hizmeti Ekle
          </button>
        </div>
      </form>

      {/* Mobile Card List (zero horizontal panning on 320px-767px screens) */}
      <div className="md:hidden divide-y divide-[#E7E5E4]">
        {services.map((srv) => (
          <div key={srv.id} className="py-3 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-[#1C1917] leading-snug">{srv.name}</p>
              <p className="text-xs text-[#57534E]">{BIO_GROUP_LABELS[srv.bioGroup]}</p>
              <p className="text-xs font-mono tabular-nums text-[#1C1917]">
                <strong>{formatTL(srv.price)}</strong>
                <span className="text-[#57534E]">
                  {' '}
                  · {srv.durationMinutes} dk · {srv.defaultRecallDays} gün
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDeleteService(srv.id)}
              aria-label={`${srv.name} hizmetini sil`}
              className="p-2 rounded-md text-[#57534E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Data Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E7E5E4] text-xs font-medium text-[#57534E]">
              <th className="py-2.5 pr-4">Hizmet</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3 text-right">Fiyat</th>
              <th className="py-2.5 px-3 text-right">Süre</th>
              <th className="py-2.5 px-3 text-right">Döngü</th>
              <th className="py-2.5 pl-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4] text-sm">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-[#FAF9F7]/70">
                <td className="py-3 pr-4 font-medium text-[#1C1917]">{srv.name}</td>
                <td className="py-3 px-3 text-xs text-[#57534E] whitespace-nowrap">
                  {BIO_GROUP_LABELS[srv.bioGroup]}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917] whitespace-nowrap">
                  {formatTL(srv.price)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#57534E] whitespace-nowrap">
                  {srv.durationMinutes} dk
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#57534E] whitespace-nowrap">
                  {srv.defaultRecallDays} gün
                </td>
                <td className="py-3 pl-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDeleteService(srv.id)}
                    aria-label={`${srv.name} hizmetini sil`}
                    className="p-1.5 rounded-md text-[#57534E] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
