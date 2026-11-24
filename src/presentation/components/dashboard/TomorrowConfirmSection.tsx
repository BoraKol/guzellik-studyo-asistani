import { CalendarCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { formatShortDateTr } from '../../../domain/engines/dateUtils';
import { buildWhatsAppLink } from '../../../domain/engines/formatters';
import { buildNoShowConfirmationMessage } from '../../../domain/engines/messageBuilder';
import type {
  Appointment,
  AppointmentStatus,
  StudioSettings,
} from '../../../domain/types/studio';
import {
  AppointmentStatusBadge,
  AppointmentStatusSelector,
} from '../ui/AppointmentStatusGroup';

interface TomorrowConfirmSectionProps {
  appointments: Appointment[];
  settings: StudioSettings;
  tomorrowIso: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onOpenClient: (clientId: string) => void;
}

export function TomorrowConfirmSection({
  appointments,
  settings,
  tomorrowIso,
  copiedKey,
  onCopy,
  onUpdateStatus,
  onOpenClient,
}: TomorrowConfirmSectionProps) {
  return (
    <section className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#1C1917]">
            Yarınki Randevular — Gelmeme Önleme
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            {formatShortDateTr(tomorrowIso)} · Tek tıkla WhatsApp teyidi isteyin.
          </p>
        </div>
        <CalendarCheck className="w-5 h-5 text-[#2F5D50] shrink-0" aria-hidden="true" />
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-[#57534E] py-6">
          Yarın için kayıtlı randevu bulunmuyor. Yukarıdaki “Randevu Ekle” düğmesiyle
          ekleyebilirsiniz.
        </p>
      ) : (
        <div className="divide-y divide-[#E7E5E4]">
          {appointments.map((apt) => {
            const confirmMsg = buildNoShowConfirmationMessage(apt, settings);
            const waUrl = buildWhatsAppLink(apt.phone, confirmMsg);
            const copyId = `apt-${apt.id}`;

            return (
              <div key={apt.id} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#2F5D50]">
                        {apt.time}
                      </span>
                      {apt.clientId ? (
                        <button
                          type="button"
                          onClick={() => onOpenClient(apt.clientId!)}
                          className="text-sm font-semibold text-[#1C1917] hover:text-[#2F5D50] truncate"
                        >
                          {apt.clientName}
                        </button>
                      ) : (
                        <span className="text-sm font-semibold text-[#1C1917] truncate">
                          {apt.clientName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#57534E] mt-0.5">{apt.serviceName}</p>
                  </div>

                  <AppointmentStatusBadge status={apt.status} />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <AppointmentStatusSelector
                    value={apt.status}
                    onChange={(status) => onUpdateStatus(apt.id, status)}
                    ariaLabel={`${apt.clientName} randevu durumu`}
                  />

                  <div className="flex items-center gap-1.5">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] transition-colors whitespace-nowrap shrink-0"
                    >
                      WhatsApp Teyit İste
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onCopy(copyId, confirmMsg)}
                      aria-label={`${apt.clientName} teyit mesajını kopyala`}
                      className="p-2 rounded-lg border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F7]"
                    >
                      {copiedKey === copyId ? (
                        <Check className="w-3.5 h-3.5 text-[#047857]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
