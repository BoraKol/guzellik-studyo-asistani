import { GripVertical, Pencil, Plus } from 'lucide-react';
import {
  APPOINTMENT_STATUS_META,
  SERVICE_GROUP_ACCENT_STYLES,
} from '../../../domain/constants/studioLabels';
import { formatDurationTr } from '../../../domain/engines/formatters';
import type { WeeklyTimelineDay } from '../../../domain/engines/timelineEngine';
import type { Appointment } from '../../../domain/types/studio';

interface WeeklyScheduleGridProps {
  days: WeeklyTimelineDay[];
  draggingId: string | null;
  dropTargetKey: string | null;
  editingAppointmentId: string | null;
  onSelectDay: (dateIso: string) => void;
  onOpenEdit: (apt: Appointment) => void;
  onQuickAddAtSlot: (dateIso: string, timeStr: string) => void;
  onDragStart: (e: React.DragEvent, apt: Appointment) => void;
  onDragEnd: () => void;
  onSetDropTarget: (key: string | null) => void;
  onDropOnDay: (e: React.DragEvent, dateIso: string) => void;
}

export function WeeklyScheduleGrid({
  days,
  draggingId,
  dropTargetKey,
  editingAppointmentId,
  onSelectDay,
  onOpenEdit,
  onQuickAddAtSlot,
  onDragStart,
  onDragEnd,
  onSetDropTarget,
  onDropOnDay,
}: WeeklyScheduleGridProps) {
  return (
    <div
      className="flex lg:grid lg:grid-cols-7 gap-2.5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0"
      data-testid="timeline-weekly-view"
    >
      {days.map((day) => {
        const dropKey = `day-${day.dateIso}`;
        const isDropOver = dropTargetKey === dropKey && draggingId !== null;

        return (
          <div
            key={day.dateIso}
            data-testid={`timeline-day-${day.dateIso}`}
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
            onDrop={(e) => onDropOnDay(e, day.dateIso)}
            className={`snap-start shrink-0 w-[230px] sm:w-[240px] lg:w-auto rounded-xl border flex flex-col min-h-[220px] lg:min-h-[240px] overflow-hidden transition-all ${
              isDropOver
                ? 'border-[#2F5D50] ring-2 ring-[#2F5D50]/30 bg-[#2F5D50]/[0.05]'
                : day.isToday
                  ? 'border-[#2F5D50] bg-white'
                  : 'border-[#E7E5E4] bg-[#FAF9F7]/50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day.dateIso)}
              title="Bu günün saatlik zaman çizelgesini aç"
              className={`w-full px-3 py-2.5 border-b text-left transition-colors ${
                day.isToday
                  ? 'bg-[#2F5D50]/[0.07] border-[#2F5D50]/20 hover:bg-[#2F5D50]/[0.11]'
                  : 'bg-white border-[#E7E5E4] hover:bg-[#FAF9F7]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    day.isToday ? 'text-[#2F5D50]' : 'text-[#78716C]'
                  }`}
                >
                  {day.weekdayShort}
                </span>
                {day.isToday ? (
                  <span className="text-[10px] font-semibold text-[#2F5D50]">Bugün</span>
                ) : day.isTomorrow ? (
                  <span className="text-[10px] font-medium text-[#A87664]">Yarın</span>
                ) : null}
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-sm font-semibold font-mono tabular-nums text-[#1C1917]">
                  {day.dayNumber} {day.monthShort}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                  {day.items.length}
                </span>
              </div>
            </button>

            <div className="p-2 flex-1 space-y-2">
              {isDropOver && (
                <div className="rounded-md border border-dashed border-[#2F5D50] bg-white/90 px-2 py-1.5 text-[11px] font-medium text-[#2F5D50] text-center">
                  Bu güne taşı
                </div>
              )}

              {day.items.length === 0 ? (
                <p className="text-[11px] text-[#A8A29E] px-1 py-6 text-center">
                  {draggingId ? 'Buraya bırakın' : 'Müsait'}
                </p>
              ) : (
                day.items.map((item) => {
                  const { appointment } = item;
                  const accent = SERVICE_GROUP_ACCENT_STYLES[item.serviceGroup];
                  const statusMeta = APPOINTMENT_STATUS_META[appointment.status];
                  const isDragging = draggingId === appointment.id;
                  const isSelected = editingAppointmentId === appointment.id;

                  return (
                    <div
                      key={appointment.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, appointment)}
                      onDragEnd={onDragEnd}
                      onClick={() => onOpenEdit(appointment)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenEdit(appointment);
                        }
                      }}
                      aria-label={`${appointment.clientName}, ${appointment.time} – ${item.endTime}, ${appointment.serviceName}. Düzenlemek için dokunun veya başka güne sürükleyin.`}
                      className={`group rounded-lg border border-l-[3px] ${accent.border} bg-white p-2.5 lg:p-2 space-y-1 cursor-grab active:cursor-grabbing transition-all select-none ${
                        isDragging
                          ? 'opacity-45 border-[#2F5D50]'
                          : isSelected
                            ? 'border-[#2F5D50] ring-2 ring-[#2F5D50]/20'
                            : 'border-[#E7E5E4] hover:border-[#2F5D50]/50 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-semibold text-[#2F5D50]">
                          <GripVertical
                            className="w-3 h-3 text-[#A8A29E] group-hover:text-[#57534E] shrink-0"
                            aria-hidden="true"
                          />
                          {appointment.time}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Pencil
                            className="w-3 h-3 text-[#A8A29E] lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                            aria-hidden="true"
                          />
                          <span
                            title={statusMeta.label}
                            className={`w-2 h-2 rounded-full ${statusMeta.dot}`}
                          />
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {appointment.clientName}
                      </p>
                      <p className="text-[11px] text-[#57534E] leading-snug line-clamp-2">
                        {appointment.serviceName}
                      </p>
                      <p className="text-[10px] font-mono tabular-nums text-[#78716C]">
                        {appointment.time}–{item.endTime} · {formatDurationTr(item.durationMinutes)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={() => onQuickAddAtSlot(day.dateIso, '11:00')}
                className="w-full py-2 lg:py-1.5 rounded-lg border border-dashed border-[#E7E5E4] text-[11px] font-medium text-[#78716C] hover:text-[#2F5D50] hover:border-[#2F5D50]/40 hover:bg-white transition-colors inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                Ekle
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
