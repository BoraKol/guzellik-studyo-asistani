import { useState } from 'react';
import { X } from 'lucide-react';
import type {
  CreateClientPayload,
  NicheCategory,
  StudioSettings,
} from '../../../domain/types/studio';
import {
  FIELD_LABEL_CLASS,
  INPUT_SURFACE_CLASS,
  MONO_INPUT_SURFACE_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../ui/formStyles';

interface NewClientFormProps {
  settings: StudioSettings;
  onCreate: (payload: CreateClientPayload) => void;
  onClose: () => void;
}

export function NewClientForm({ settings, onCreate, onClose }: NewClientFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<NicheCategory>('LAZER_CILT');
  const [allergyNote, setAllergyNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen müşteri adını girin.');
      return;
    }
    setError(null);
    onCreate({
      name: name.trim(),
      phone: phone.trim(),
      primaryCategory: category,
      allergyNote: allergyNote.trim() || undefined,
      recallCycleDays:
        category === 'TIRNAK_KAS_KIRPIK'
          ? settings.defaultRecallDays.tirnak
          : settings.defaultRecallDays.lazer,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1C1917]">Yeni Müşteri Kartı</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yeni müşteri formunu kapat"
          className="p-2 text-[#57534E] hover:text-[#1C1917]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div>
          <label htmlFor="nc-name" className={FIELD_LABEL_CLASS}>
            Ad Soyad *
          </label>
          <input
            id="nc-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Hande Yılmaz"
            className={INPUT_SURFACE_CLASS}
          />
        </div>
        <div>
          <label htmlFor="nc-phone" className={FIELD_LABEL_CLASS}>
            Telefon (Opsiyonel)
          </label>
          <input
            id="nc-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numara sonra eklenebilir"
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>
        <div>
          <label htmlFor="nc-cat" className={FIELD_LABEL_CLASS}>
            Ana Kategori
          </label>
          <select
            id="nc-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as NicheCategory)}
            className={INPUT_SURFACE_CLASS}
          >
            <option value="LAZER_CILT">Lazer &amp; Cilt Bakımı</option>
            <option value="TIRNAK_KAS_KIRPIK">Tırnak &amp; Kaş/Kirpik</option>
          </select>
        </div>
        <div>
          <label htmlFor="nc-allergy" className={FIELD_LABEL_CLASS}>
            Alerji / Hassasiyet Notu
          </label>
          <input
            id="nc-allergy"
            type="text"
            value={allergyNote}
            onChange={(e) => setAllergyNote(e.target.value)}
            placeholder="Örn. Hassas cilt / Akrilik alerjisi"
            className={INPUT_SURFACE_CLASS}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Müşteriyi Kaydet
        </button>
      </div>
    </form>
  );
}
