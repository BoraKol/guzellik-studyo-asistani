import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type {
  Appointment,
  Client,
  NicheCategory,
  ServiceItem,
} from '../../../domain/types/studio';
import {
  FIELD_LABEL_CLASS,
  INPUT_SURFACE_CLASS,
  MONO_INPUT_SURFACE_CLASS,
} from '../ui/formStyles';

interface NewAppointmentFormProps {
  clients: Client[];
  services: ServiceItem[];
  initialDate: string;
  initialTime: string;
  initialServiceName: string;
  initialCategory: NicheCategory;
  onSubmit: (appointment: Omit<Appointment, 'id'>) => void;
  onClose: () => void;
}

export function NewAppointmentForm({
  clients,
  services,
  initialDate,
  initialTime,
  initialServiceName,
  initialCategory,
  onSubmit,
  onClose,
}: NewAppointmentFormProps) {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [serviceName, setServiceName] = useState(initialServiceName);
  const [category, setCategory] = useState<NicheCategory>(initialCategory);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setDate(initialDate);
    setTime(initialTime);
    setServiceName(initialServiceName);
    setCategory(initialCategory);
    const rafId = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [initialDate, initialTime, initialServiceName, initialCategory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Lütfen müşteri adını girin.');
      return;
    }
    if (!serviceName.trim()) {
      setError('Lütfen işlem adını seçin veya yazın.');
      return;
    }
    setError(null);
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === clientName.trim().toLowerCase()
    );
    onSubmit({
      clientId: matchedClient?.id,
      clientName: clientName.trim(),
      phone: phone.trim(),
      date,
      time,
      serviceName: serviceName.trim(),
      category,
      status: 'TEYIT_BEKLIYOR',
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1C1917]">Yeni Randevu Ekle</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yeni randevu formunu kapat"
          className="p-2 text-[#57534E] hover:text-[#1C1917] rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <div>
          <label htmlFor="apt-client" className={FIELD_LABEL_CLASS}>
            Müşteri Adı Soyadı
          </label>
          <input
            id="apt-client"
            type="text"
            list="existing-clients-list"
            value={clientName}
            onChange={(e) => {
              const val = e.target.value;
              setClientName(val);
              const found = clients.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
              if (found) setPhone(found.phone);
            }}
            placeholder="Örn. Zeynep Yıldız"
            className={INPUT_SURFACE_CLASS}
          />
          <datalist id="existing-clients-list">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="apt-phone" className={FIELD_LABEL_CLASS}>
            WhatsApp Telefonu (Opsiyonel)
          </label>
          <input
            id="apt-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numara sonra eklenebilir"
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>

        <div>
          <label htmlFor="apt-service" className={FIELD_LABEL_CLASS}>
            Hizmet / İşlem
          </label>
          <select
            id="apt-service"
            value={serviceName}
            onChange={(e) => {
              const selected = services.find((s) => s.name === e.target.value);
              setServiceName(e.target.value);
              if (selected) setCategory(selected.category);
            }}
            className={INPUT_SURFACE_CLASS}
          >
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="apt-date" className={FIELD_LABEL_CLASS}>
            Tarih
          </label>
          <input
            id="apt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>

        <div>
          <label htmlFor="apt-time" className={FIELD_LABEL_CLASS}>
            Saat
          </label>
          <input
            id="apt-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={MONO_INPUT_SURFACE_CLASS}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full px-4 py-2.5 sm:py-2 rounded-lg bg-[#2F5D50] text-white text-sm font-medium hover:bg-[#244A40] transition-colors"
          >
            Randevuyu Kaydet
          </button>
        </div>
      </div>
    </form>
  );
}
