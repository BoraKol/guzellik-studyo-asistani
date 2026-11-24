import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCopyFeedback } from '../../../application/hooks/useCopyFeedback';
import {
  MOBILE_FOCUS_TABS,
  SERVICE_FOCUS_LABELS,
} from '../../../domain/constants/studioLabels';
import {
  addDaysIso,
  formatShortDateTr,
  toIsoDate,
} from '../../../domain/engines/dateUtils';
import {
  computeRecallRadar,
  getRemainingSessions,
} from '../../../domain/engines/recallEngine';
import { matchesServiceFocus } from '../../../domain/engines/serviceClassifier';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdatePatch,
  NicheCategory,
  RecallRadarItem,
  ServiceFocusFilter,
  StudioData,
} from '../../../domain/types/studio';
import { polishWhatsAppMessageWithAI } from '../../../infrastructure/api/aiAssistantClient';
import { ScheduleTimelineSection } from '../schedule/ScheduleTimelineSection';
import { AlertBanner } from '../ui/AlertBanner';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../ui/formStyles';
import { KpiSummaryStrip } from './KpiSummaryStrip';
import { NewAppointmentForm } from './NewAppointmentForm';
import { RecallRadarSection } from './RecallRadarSection';
import { TomorrowConfirmSection } from './TomorrowConfirmSection';

interface DashboardViewProps {
  data: StudioData;
  serviceFocus: ServiceFocusFilter;
  onChangeServiceFocus: (focus: ServiceFocusFilter) => void;
  onMarkReminded: (clientId: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onUpdateAppointment: (appointmentId: string, patch: AppointmentUpdatePatch) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onOpenClient: (clientId: string) => void;
  onNavigateQuickLog: () => void;
}

export function DashboardView({
  data,
  serviceFocus,
  onChangeServiceFocus,
  onMarkReminded,
  onUpdateAppointmentStatus,
  onUpdateAppointment,
  onDeleteAppointment,
  onAddAppointment,
  onOpenClient,
  onNavigateQuickLog,
}: DashboardViewProps) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  const { copiedKey, copyText } = useCopyFeedback();
  const [aiDrafts, setAiDrafts] = useState<Record<string, string>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  const [showNewAptForm, setShowNewAptForm] = useState(false);
  const [draftSlot, setDraftSlot] = useState<{
    date: string;
    time: string;
    serviceName: string;
    category: NicheCategory;
  }>(() => ({
    date: tomorrowIso,
    time: '11:00',
    serviceName: data.services[0]?.name ?? '',
    category: data.services[0]?.category ?? 'LAZER_CILT',
  }));

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort();
    };
  }, []);

  const focusedClients = useMemo(
    () =>
      data.clients.filter((c) =>
        matchesServiceFocus(c.lastServiceName, c.primaryCategory, serviceFocus, data.services)
      ),
    [data.clients, data.services, serviceFocus]
  );

  const radar = useMemo(
    () => computeRecallRadar(focusedClients, data.settings, todayIso),
    [focusedClients, data.settings, todayIso]
  );

  const focusedAppointments = useMemo(
    () =>
      data.appointments.filter((a) =>
        matchesServiceFocus(a.serviceName, a.category, serviceFocus, data.services)
      ),
    [data.appointments, data.services, serviceFocus]
  );

  const todayAppointments = useMemo(
    () =>
      focusedAppointments
        .filter((a) => a.date === todayIso)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [focusedAppointments, todayIso]
  );

  const tomorrowAppointments = useMemo(
    () =>
      focusedAppointments
        .filter((a) => a.date === tomorrowIso)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [focusedAppointments, tomorrowIso]
  );

  const todayConfirmedCount = useMemo(
    () => todayAppointments.filter((a) => a.status === 'ONAYLANDI').length,
    [todayAppointments]
  );

  const pendingTomorrowCount = useMemo(
    () => tomorrowAppointments.filter((a) => a.status === 'TEYIT_BEKLIYOR').length,
    [tomorrowAppointments]
  );

  const activePackageCount = useMemo(
    () =>
      focusedClients.filter((c) => c.activePackage && getRemainingSessions(c.activePackage) > 0)
        .length,
    [focusedClients]
  );

  const unremindedDueCount = useMemo(
    () => radar.dueNow.filter((r) => !r.wasRemindedRecently).length,
    [radar.dueNow]
  );

  function handleQuickAddAtSlot(dateIso: string, timeStr: string) {
    const matchingService =
      serviceFocus !== 'ALL'
        ? data.services.find((s) => s.bioGroup === serviceFocus)
        : data.services[0];

    setDraftSlot({
      date: dateIso,
      time: timeStr,
      serviceName: matchingService?.name ?? data.services[0]?.name ?? '',
      category: matchingService?.category ?? 'LAZER_CILT',
    });
    setShowNewAptForm(true);
  }

  async function handlePolishRecall(item: RecallRadarItem) {
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setAiError(null);
    setAiLoadingId(item.client.id);
    try {
      const res = await polishWhatsAppMessageWithAI(
        {
          clientName: item.client.name,
          serviceName: item.client.lastServiceName,
          studioName: data.settings.studioName,
          tone: data.settings.messageTone,
          purpose: 'RECALL',
          extraContext: `Son işlemden bu yana ${item.daysSinceLastVisit} gün geçti. Döngü: ${item.client.recallCycleDays} gün.`,
        },
        controller.signal
      );
      setAiDrafts((prev) => ({ ...prev, [item.client.id]: res.message }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI taslağı oluşturulamadı. Standart WhatsApp mesajı hazır.'
      );
    } finally {
      if (aiAbortRef.current === controller) {
        setAiLoadingId(null);
      }
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-[#A87664]">
            {formatShortDateTr(todayIso)} · Günlük Operasyon Özeti
            {serviceFocus !== 'ALL' ? ` · ${SERVICE_FOCUS_LABELS[serviceFocus]}` : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] mt-1 tracking-tight">
            {serviceFocus === 'ALL'
              ? 'Bugün & Geri Çağırma Radarı'
              : `${SERVICE_FOCUS_LABELS[serviceFocus]} Operasyonu`}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {serviceFocus !== 'ALL' && (
            <button
              type="button"
              onClick={() => onChangeServiceFocus('ALL')}
              className="hidden lg:inline-flex items-center gap-1 px-3 py-2.5 rounded-lg border border-[#E7E5E4] bg-[#FAF9F7] text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Tüm Hizmetler
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewAptForm((v) => !v)}
            className={SECONDARY_BUTTON_CLASS}
          >
            <Plus className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
            Randevu Ekle
          </button>
          <button type="button" onClick={onNavigateQuickLog} className={PRIMARY_BUTTON_CLASS}>
            Hızlı İşlem Kaydet
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Service-Focused Filter Strip */}
      <div className="lg:hidden space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A87664]">
          Hizmet Odaklı Görünüm
        </p>
        <div
          className="flex items-center gap-1 p-1 bg-white border border-[#E7E5E4] rounded-xl overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Hizmet odaklı filtre"
        >
          {MOBILE_FOCUS_TABS.map((tab) => {
            const isActive = serviceFocus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeServiceFocus(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#2F5D50] text-white'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {showNewAptForm && (
        <NewAppointmentForm
          clients={data.clients}
          services={data.services}
          initialDate={draftSlot.date}
          initialTime={draftSlot.time}
          initialServiceName={draftSlot.serviceName || data.services[0]?.name || ''}
          initialCategory={draftSlot.category}
          onSubmit={(apt) => {
            onAddAppointment(apt);
            setShowNewAptForm(false);
          }}
          onClose={() => setShowNewAptForm(false)}
        />
      )}

      <KpiSummaryStrip
        todayTotal={todayAppointments.length}
        todayConfirmed={todayConfirmedCount}
        tomorrowTotal={tomorrowAppointments.length}
        tomorrowPending={pendingTomorrowCount}
        unremindedDueCount={unremindedDueCount}
        upcomingWeekCount={radar.upcomingWeek.length}
        activePackageCount={activePackageCount}
        totalClientsCount={data.clients.length}
      />

      <ScheduleTimelineSection
        appointments={focusedAppointments}
        services={data.services}
        serviceFocus={serviceFocus}
        todayIso={todayIso}
        onOpenClient={onOpenClient}
        onUpdateAppointmentStatus={onUpdateAppointmentStatus}
        onUpdateAppointment={onUpdateAppointment}
        onDeleteAppointment={onDeleteAppointment}
        onQuickAddAtSlot={handleQuickAddAtSlot}
      />

      {aiError && (
        <AlertBanner variant="warning" message={aiError} onDismiss={() => setAiError(null)} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <RecallRadarSection
          dueNow={radar.dueNow}
          upcomingWeek={radar.upcomingWeek}
          aiDrafts={aiDrafts}
          aiLoadingId={aiLoadingId}
          copiedKey={copiedKey}
          onCopy={copyText}
          onPolishWithAI={handlePolishRecall}
          onMarkReminded={onMarkReminded}
          onOpenClient={onOpenClient}
        />

        <div className="xl:col-span-5 space-y-6">
          <TomorrowConfirmSection
            appointments={tomorrowAppointments}
            settings={data.settings}
            tomorrowIso={tomorrowIso}
            copiedKey={copiedKey}
            onCopy={copyText}
            onUpdateStatus={onUpdateAppointmentStatus}
            onOpenClient={onOpenClient}
          />
        </div>
      </div>
    </div>
  );
}
