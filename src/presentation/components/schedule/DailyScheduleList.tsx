import { Clock, GripVertical, Pencil, Plus } from 'lucide-react';
import {
  SERVICE_FOCUS_LABELS,
  SERVICE_GROUP_ACCENT_STYLES,
} from '../../../domain/constants/studioLabels';
import { formatDurationTr } from '../../../domain/engines/formatters';
import type { DailyTimelineSlot } from '../../../domain/engines/timelineEngine';
import type {
  Appointment,
  AppointmentStatus,
  ServiceFocusFilter,
} from '../../../domain/types/studio';
import {
  AppointmentStatusBadge,
  AppointmentStatusSelector,
} from '../ui/AppointmentStatusGroup';

interface DailyScheduleListProps {
  slots: DailyTimelineSlot[];
  dailyCount: number;
  selectedDateIso: string;
  dayContextLabel: string;
  serviceFocus: ServiceFocusFilter;
  draggingId: string | null;
  dropTargetKey: string | null;
  editingAppointmentId: string | null;
  onOpenClient: (clientId: string) => void;
  onOpenEdit: (apt: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onQuickAddAtSlot: (dateIso: string, timeStr: string) => void;
  onDragStart: (e: React.DragEvent, apt: Appointment) => void;
  onDragEnd: () => void;
  onSetDropTarget: (key: string | null) => void;
  onDropOnHour: (e: React.DragEvent, hour: number) => void;
}

export function DailyScheduleList({
  slots,
  dailyCount,
  selectedDateIso,
  dayContextLabel,
  serviceFocus,
  draggingId,
  dropTargetKey,
  editingAppointmentId,
  onOpenClient,
  onOpenEdit,
  onUpdateStatus,
  onQuickAddAtSlot,
  onDragStart,
  onDragEnd,
  onSetDropTarget,
  onDropOnHour,
}: DailyScheduleListProps) {
  return (
    <div className="space-y-2" data-testid="timeline-daily-view">
      {dailyCount === 0 && (
        <div className="rounded-lg bg-[#FAF9F7] border border-[#E7E5E4] px-4 py-3 text-xs text-[#57534E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            {dayContextLabel} için{' '}
            {serviceFocus === 'ALL'
              ? 'kayıtlı randevu bulunmuyor.'
              : `${SERVICE_FOCUS_LABELS[serviceFocus]} alanında kayıtlı randevu bulunmuyor.`}{' '}
            Aşağıdan uygun bir saat seçerek hızlıca randevu ekleyebilirsiniz.
          </span>
          <button
            type="button"
            onClick={() => onQuickAddAtSlot(selectedDateIso, '11:00')}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Randevu Ekle
          </button>
        </div>
      )}

      <div className="divide-y divide-[#E7E5E4]/80 border border-[#E7E5E4] rounded-xl overflow-hidden bg-[#FAF9F7]/40">
        {slots.map((slot) => {
          const hasItems = slot.items.length > 0;
          const dropKey = `hour-${selectedDateIso}-${slot.hour}`;
          const isDropOver = dropTargetKey === dropKey && draggingId !== null;

          return (
            <div
              key={slot.hour}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dropTargetKey !== dropKey) onSetDropTarget(dropKey);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  onSetDropTarget(null);
                }
              }}
              onDrop={(e) => onDropOnHour(e, slot.hour)}
              className={`grid grid-cols-[58px_1fr] sm:grid-cols-[78px_1fr] transition-colors ${
                isDropOver
                  ? 'bg-[#2F5D50]/[0.08]'
                  : hasItems
                    ? 'bg-white'
                    : 'bg-[#FAF9F7]/50 hover:bg-white'
              }`}
            >
              <div className="px-2.5 sm:px-3 py-3 border-r border-[#E7E5E4]/80 flex items-start justify-end">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isDropOver
                      ? 'font-semibold text-[#2F5D50]'
                      : hasItems
                        ? 'font-semibold text-[#1C1917]'
                        : 'text-[#A8A29E]'
                  }`}
                >
                  {slot.label}
                </span>
              </div>

              <div className={`px-3 sm:px-4 ${hasItems ? 'py-3' : 'py-2'} min-w-0`}>
                {hasItems ? (
                  <div
                    className={`grid gap-3 ${
                      slot.items.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {slot.items.map((item) => {
                      const { appointment } = item;
                      const accent = SERVICE_GROUP_ACCENT_STYLES[item.serviceGroup];
                      const isDragging = draggingId === appointment.id;
                      const isSelected = editingAppointmentId === appointment.id;

                      return (
                        <div
                          key={appointment.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, appointment)}
                          onDragEnd={onDragEnd}
                          className={`rounded-lg border border-l-[3px] ${accent.border} bg-[#FAF9F7]/70 px-3 sm:px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition-all ${
                            isDragging
                              ? 'opacity-45 border-[#2F5D50]'
                              : isSelected
                                ? 'border-[#2F5D50] ring-2 ring-[#2F5D50]/20 bg-white'
                                : 'border-[#E7E5E4] hover:border-[#2F5D50]/45'
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <GripVertical
                                className="w-3.5 h-3.5 text-[#A8A29E] shrink-0"
                                aria-hidden="true"
                              />
                              <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-semibold text-[#2F5D50]">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {appointment.time} – {item.endTime}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                                ({formatDurationTr(item.durationMinutes)})
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${accent.badgeBg} ${accent.badgeText}`}
                              >
                                {accent.label}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-2 flex-wrap">
                              {appointment.clientId ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenClient(appointment.clientId!)}
                                  className="text-sm font-semibold text-[#1C1917] hover:text-[#2F5D50] transition-colors text-left"
                                >
                                  {appointment.clientName}
                                </button>
                              ) : (
                                <span className="text-sm font-semibold text-[#1C1917]">
                                  {appointment.clientName}
                                </span>
                              )}
                              <span className="text-xs text-[#57534E]">
                                · {appointment.serviceName}
                              </span>
                            </div>

                            {appointment.notes && (
                              <p className="text-xs text-[#78716C] truncate">{appointment.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onOpenEdit(appointment)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E7E5E4] bg-white text-[11px] font-medium text-[#1C1917] hover:border-[#2F5D50] hover:text-[#2F5D50] transition-colors whitespace-nowrap"
                            >
                              <Pencil className="w-3 h-3" aria-hidden="true" />
                              Düzenle
                            </button>

                            <AppointmentStatusBadge status={appointment.status} compact />

                            <AppointmentStatusSelector
                              value={appointment.status}
                              onChange={(status) => onUpdateStatus(appointment.id, status)}
                              ariaLabel={`${appointment.clientName} durum güncelle`}
                              variant="white"
                              size="xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 min-h-[28px] group">
                    {isDropOver ? (
                      <span className="text-xs font-medium text-[#2F5D50]">
                        Saat {slot.label} dilimine bırakın
                      </span>
                    ) : (
                      <>
                        <div className="h-px flex-1 border-t border-dashed border-[#E7E5E4]" />
                        <button
                          type="button"
                          onClick={() => onQuickAddAtSlot(selectedDateIso, slot.label)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#78716C] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 hover:text-[#2F5D50] hover:bg-[#FAF9F7] transition-all whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3 h-3" aria-hidden="true" />
                          {slot.label} ekle
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
