import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransientNotice } from '../../../application/hooks/useTransientNotice';
import { SERVICE_FOCUS_LABELS } from '../../../domain/constants/studioLabels';
import { addDaysIso, formatShortDateTr } from '../../../domain/engines/dateUtils';
import {
  buildDailyTimelineSlots,
  buildWeeklyTimelineDays,
  computeDroppedAppointmentSlot,
} from '../../../domain/engines/timelineEngine';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdatePatch,
  ServiceFocusFilter,
  ServiceItem,
} from '../../../domain/types/studio';
import { AlertBanner } from '../ui/AlertBanner';
import { AppointmentEditPanel } from './AppointmentEditPanel';
import { DailyScheduleList } from './DailyScheduleList';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';

type TimelineMode = 'WEEKLY' | 'DAILY';

interface ScheduleTimelineSectionProps {
  appointments: Appointment[];
  services: ServiceItem[];
  serviceFocus: ServiceFocusFilter;
  todayIso: string;
  onOpenClient: (clientId: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onUpdateAppointment: (appointmentId: string, patch: AppointmentUpdatePatch) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onQuickAddAtSlot: (dateIso: string, timeStr: string) => void;
}

export function ScheduleTimelineSection({
  appointments,
  services,
  serviceFocus,
  todayIso,
  onOpenClient,
  onUpdateAppointmentStatus,
  onUpdateAppointment,
  onDeleteAppointment,
  onQuickAddAtSlot,
}: ScheduleTimelineSectionProps) {
  const [mode, setMode] = useState<TimelineMode>('WEEKLY');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const { notice, showNotice, clearNotice } = useTransientNotice(3200);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  const dailySlots = useMemo(
    () => buildDailyTimelineSlots(appointments, services, selectedDateIso, 9, 19),
    [appointments, services, selectedDateIso]
  );

  const dailyCount = useMemo(
    () => dailySlots.reduce((sum, slot) => sum + slot.items.length, 0),
    [dailySlots]
  );

  const weeklyDays = useMemo(
    () => buildWeeklyTimelineDays(appointments, services, selectedDateIso, todayIso),
    [appointments, services, selectedDateIso, todayIso]
  );

  const weeklyCount = useMemo(
    () => weeklyDays.reduce((sum, day) => sum + day.items.length, 0),
    [weeklyDays]
  );

  function handleStep(direction: -1 | 1) {
    const delta = mode === 'DAILY' ? direction : direction * 7;
    setSelectedDateIso((prev) => addDaysIso(prev, delta));
  }

  function handleSaveEdit(appointmentId: string, patch: AppointmentUpdatePatch) {
    onUpdateAppointment(appointmentId, patch);
    if (editingApt) {
      showNotice(
        `${editingApt.clientName} randevusu ${formatShortDateTr(patch.date ?? editingApt.date)} · ${patch.time ?? editingApt.time} olarak güncellendi.`
      );
    }
    setEditingApt(null);
  }

  function handleDeleteEdit(appointmentId: string, clientName: string) {
    onDeleteAppointment(appointmentId);
    setEditingApt(null);
    showNotice(`${clientName} randevusu takvimden kaldırıldı.`);
  }

  function handleDragStart(e: React.DragEvent, apt: Appointment) {
    setDraggingId(apt.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', apt.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTargetKey(null);
  }

  function handleDropOnTarget(
    e: React.DragEvent,
    targetDateIso: string,
    targetHour: number | null
  ) {
    e.preventDefault();
    const droppedId = draggingId || e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDropTargetKey(null);
    if (!droppedId) return;

    const apt = appointments.find((a) => a.id === droppedId);
    if (!apt) return;

    const nextSlot = computeDroppedAppointmentSlot(targetDateIso, targetHour, apt.time);
    if (nextSlot.date === apt.date && nextSlot.time === apt.time) return;

    onUpdateAppointment(apt.id, { date: nextSlot.date, time: nextSlot.time });
    showNotice(
      `${apt.clientName} · ${formatShortDateTr(nextSlot.date)} · ${nextSlot.time} olarak taşındı.`
    );
  }

  const dayContextLabel =
    selectedDateIso === todayIso
      ? 'Bugün'
      : selectedDateIso === tomorrowIso
        ? 'Yarın'
        : formatShortDateTr(selectedDateIso);

  const rangeSubtitle =
    mode === 'DAILY'
      ? `${dayContextLabel} · ${formatShortDateTr(selectedDateIso)} · ${dailyCount} randevu`
      : `${formatShortDateTr(weeklyDays[0]?.dateIso ?? selectedDateIso)} – ${formatShortDateTr(
          weeklyDays[6]?.dateIso ?? addDaysIso(selectedDateIso, 6)
        )} · ${weeklyCount} randevu`;

  return (
    <section
      aria-label="Haftalık ve Günlük Randevu Takvimi"
      data-testid="schedule-timeline-section"
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-[#E7E5E4]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#2F5D50] shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
              Randevu Takvimi &amp; Zaman Çizelgesi
            </h2>
          </div>
          <p className="text-xs text-[#57534E] mt-1 tabular-nums">
            {rangeSubtitle}
            {serviceFocus !== 'ALL' ? ` · ${SERVICE_FOCUS_LABELS[serviceFocus]}` : ''}
            <span className="hidden sm:inline text-[#78716C]">
              {' '}
              · Sürükle-bırak ile taşıyın veya dokunarak düzenleyin
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          <div
            className="inline-flex items-center rounded-lg border border-[#E7E5E4] bg-[#FAF9F7] p-0.5"
            role="group"
            aria-label="Tarih gezintisi"
          >
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label={mode === 'DAILY' ? 'Önceki gün' : 'Önceki hafta'}
              className="p-2 sm:p-1.5 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateIso(todayIso)}
              disabled={selectedDateIso === todayIso}
              className="px-2.5 py-1.5 sm:py-1 text-xs font-medium text-[#1C1917] hover:bg-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-default whitespace-nowrap"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label={mode === 'DAILY' ? 'Sonraki gün' : 'Sonraki hafta'}
              className="p-2 sm:p-1.5 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-[#FAF9F7] border border-[#E7E5E4]"
            role="tablist"
            aria-label="Takvim görünümü"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'WEEKLY'}
              data-testid="timeline-tab-weekly"
              onClick={() => setMode('WEEKLY')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'WEEKLY'
                  ? 'bg-[#2F5D50] text-white'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Haftalık
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'DAILY'}
              data-testid="timeline-tab-daily"
              onClick={() => setMode('DAILY')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'DAILY'
                  ? 'bg-[#2F5D50] text-white'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Günlük
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <AlertBanner
          variant="success"
          message={notice}
          onDismiss={clearNotice}
          testId="timeline-feedback-notice"
        />
      )}

      {editingApt && (
        <AppointmentEditPanel
          appointment={editingApt}
          services={services}
          todayIso={todayIso}
          tomorrowIso={tomorrowIso}
          onOpenClient={onOpenClient}
          onSave={handleSaveEdit}
          onDelete={handleDeleteEdit}
          onClose={() => setEditingApt(null)}
        />
      )}

      {mode === 'WEEKLY' ? (
        <WeeklyScheduleGrid
          days={weeklyDays}
          draggingId={draggingId}
          dropTargetKey={dropTargetKey}
          editingAppointmentId={editingApt?.id ?? null}
          onSelectDay={(dateIso) => {
            setSelectedDateIso(dateIso);
            setMode('DAILY');
          }}
          onOpenEdit={setEditingApt}
          onQuickAddAtSlot={onQuickAddAtSlot}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSetDropTarget={setDropTargetKey}
          onDropOnDay={(e, dateIso) => handleDropOnTarget(e, dateIso, null)}
        />
      ) : (
        <DailyScheduleList
          slots={dailySlots}
          dailyCount={dailyCount}
          selectedDateIso={selectedDateIso}
          dayContextLabel={dayContextLabel}
          serviceFocus={serviceFocus}
          draggingId={draggingId}
          dropTargetKey={dropTargetKey}
          editingAppointmentId={editingApt?.id ?? null}
          onOpenClient={onOpenClient}
          onOpenEdit={setEditingApt}
          onUpdateStatus={onUpdateAppointmentStatus}
          onQuickAddAtSlot={onQuickAddAtSlot}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSetDropTarget={setDropTargetKey}
          onDropOnHour={(e, hour) => handleDropOnTarget(e, selectedDateIso, hour)}
        />
      )}
    </section>
  );
}
