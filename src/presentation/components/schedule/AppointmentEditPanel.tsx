import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, UserRound, X } from 'lucide-react';
import { QUICK_EDIT_TIMES } from '../../../domain/constants/studioLabels';
import { addDaysIso } from '../../../domain/engines/dateUtils';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdatePatch,
  NicheCategory,
  ServiceItem,
} from '../../../domain/types/studio';
import { AppointmentStatusSelector } from '../ui/AppointmentStatusGroup';
import {
  FIELD_LABEL_CLASS,
  INPUT_WHITE_CLASS,
  MONO_INPUT_WHITE_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../ui/formStyles';

interface AppointmentEditPanelProps {
  appointment: Appointment;
  services: ServiceItem[];
  todayIso: string;
  tomorrowIso: string;
  onOpenClient: (clientId: string) => void;
  onSave: (appointmentId: string, patch: AppointmentUpdatePatch) => void;
  onDelete: (appointmentId: string, clientName: string) => void;
  onClose: () => void;
}

export function AppointmentEditPanel({
  appointment,
  services,
  todayIso,
  tomorrowIso,
  onOpenClient,
  onSave,
  onDelete,
  onClose,
}: AppointmentEditPanelProps) {
  const [editDate, setEditDate] = useState(appointment.date);
  const [editTime, setEditTime] = useState(appointment.time);
  const [editServiceName, setEditServiceName] = useState(appointment.serviceName);
  const [editCategory, setEditCategory] = useState<NicheCategory>(appointment.category);
  const [editStatus, setEditStatus] = useState<AppointmentStatus>(appointment.status);
  const [editNotes, setEditNotes] = useState(appointment.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setEditServiceName(appointment.serviceName);
    setEditCategory(appointment.category);
    setEditStatus(appointment.status);
    setEditNotes(appointment.notes ?? '');
    setConfirmDelete(false);
    const rafId = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [appointment]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(appointment.id, {
      date: editDate,
      time: editTime,
      serviceName: editServiceName.trim() || appointment.serviceName,
      category: editCategory,
      status: editStatus,
      notes: editNotes.trim(),
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      data-testid="appointment-edit-panel"
      className="rounded-xl border border-[#2F5D50]/35 bg-[#FAF9F7] p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A87664]">
            Randevuyu Düzenle
          </p>
          <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
            <h3 className="text-base font-semibold text-[#1C1917]">{appointment.clientName}</h3>
            {appointment.clientId && (
              <button
                type="button"
                onClick={() => onOpenClient(appointment.clientId!)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2F5D50] hover:underline"
              >
                <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
                Müşteri Kartı
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Düzenleme panelini kapat"
          className="p-2 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-white"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Quick Day Shift Shortcuts */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-[#57534E] mr-1">Hızlı gün:</span>
        {[
          { label: 'Bugün', date: todayIso },
          { label: 'Yarın', date: tomorrowIso },
          { label: '+1 Gün', date: addDaysIso(editDate || todayIso, 1) },
          { label: '+1 Hafta', date: addDaysIso(editDate || todayIso, 7) },
        ].map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            onClick={() => setEditDate(shortcut.date)}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              editDate === shortcut.date
                ? 'border-[#2F5D50] bg-[#2F5D50] text-white'
                : 'border-[#E7E5E4] bg-white text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {shortcut.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label htmlFor="edit-apt-date" className={FIELD_LABEL_CLASS}>
            Tarih
          </label>
          <input
            id="edit-apt-date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
            className={MONO_INPUT_WHITE_CLASS}
          />
        </div>

        <div>
          <label htmlFor="edit-apt-time" className={FIELD_LABEL_CLASS}>
            Saat
          </label>
          <input
            id="edit-apt-time"
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            required
            className={MONO_INPUT_WHITE_CLASS}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="edit-apt-service" className={FIELD_LABEL_CLASS}>
            Hizmet / İşlem
          </label>
          <select
            id="edit-apt-service"
            value={editServiceName}
            onChange={(e) => {
              const nextName = e.target.value;
              setEditServiceName(nextName);
              const found = services.find((s) => s.name === nextName);
              if (found) setEditCategory(found.category);
            }}
            className={INPUT_WHITE_CLASS}
          >
            {!services.some((s) => s.name === editServiceName) && editServiceName && (
              <option value={editServiceName}>{editServiceName}</option>
            )}
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.durationMinutes} dk)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Time Slots */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-[#57534E] mr-1">Hızlı saat:</span>
        {QUICK_EDIT_TIMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEditTime(t)}
            className={`px-2.5 py-1.5 rounded-md border font-mono tabular-nums text-xs transition-colors ${
              editTime === t
                ? 'border-[#2F5D50] bg-[#2F5D50] text-white'
                : 'border-[#E7E5E4] bg-white text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-end">
        <div>
          <span className={FIELD_LABEL_CLASS}>Randevu Durumu</span>
          <AppointmentStatusSelector
            value={editStatus}
            onChange={setEditStatus}
            ariaLabel="Randevu durumu"
            variant="white"
            fullLabels
          />
        </div>

        <div>
          <label htmlFor="edit-apt-notes" className={FIELD_LABEL_CLASS}>
            Kısa Not (Opsiyonel)
          </label>
          <input
            id="edit-apt-notes"
            type="text"
            maxLength={300}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Örn. 4. seans, hassas cilt notu"
            className={INPUT_WHITE_CLASS}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between gap-3 flex-wrap">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#57534E] hover:text-[#B91C1C] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Randevuyu Sil
          </button>
        ) : (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(appointment.id, appointment.clientName)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-medium hover:bg-[#991B1B] transition-colors"
            >
              Silmeyi Onayla
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-2 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#57534E]"
            >
              Vazgeç
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
          >
            İptal
          </button>
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </form>
  );
}
