import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { SERVICE_FOCUS_LABELS } from '../../../domain/constants/studioLabels';
import { formatShortDateTr, toIsoDate } from '../../../domain/engines/dateUtils';
import {
  getRemainingSessions,
  isClientRecallDue,
} from '../../../domain/engines/recallEngine';
import { matchesServiceFocus } from '../../../domain/engines/serviceClassifier';
import type {
  BeforeAfterUploadInput,
  Client,
  ClientPackage,
  CreateClientPayload,
  PaymentStatus,
  ServiceFocusFilter,
  StudioData,
} from '../../../domain/types/studio';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../ui/formStyles';
import { ClientDetailPanel } from './ClientDetailPanel';
import { NewClientForm } from './NewClientForm';

type ClientFilter =
  | 'ALL'
  | 'ACTIVE_PACKAGE'
  | 'LAZER_CILT'
  | 'TIRNAK_KAS_KIRPIK'
  | 'RECALL_DUE';

const FILTER_BUTTONS: ReadonlyArray<{ id: ClientFilter; label: string }> = [
  { id: 'ALL', label: 'Tümü' },
  { id: 'ACTIVE_PACKAGE', label: 'Aktif Paketi Olanlar' },
  { id: 'LAZER_CILT', label: 'Lazer & Cilt' },
  { id: 'TIRNAK_KAS_KIRPIK', label: 'Tırnak & Kaş/Kirpik' },
  { id: 'RECALL_DUE', label: 'Geri Çağırma Bekleyenler' },
];

interface ClientsViewProps {
  data: StudioData;
  serviceFocus: ServiceFocusFilter;
  onClearServiceFocus: () => void;
  selectedClientId: string | null;
  onSelectClient: (clientId: string | null) => void;
  onDecrementPackageSession: (clientId: string) => void;
  onUpdatePackagePayment: (clientId: string, status: PaymentStatus) => void;
  onAddOrReplacePackage: (clientId: string, pkg: ClientPackage) => void;
  onAddClient: (payload: CreateClientPayload) => void;
  onUploadBeforeAfter: (client: Client, input: BeforeAfterUploadInput) => Promise<void>;
  onNavigateQuickLog: () => void;
}

export function ClientsView({
  data,
  serviceFocus,
  onClearServiceFocus,
  selectedClientId,
  onSelectClient,
  onDecrementPackageSession,
  onUpdatePackagePayment,
  onAddOrReplacePackage,
  onAddClient,
  onUploadBeforeAfter,
  onNavigateQuickLog,
}: ClientsViewProps) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('ALL');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return data.clients.filter((c) => {
      if (!matchesServiceFocus(c.lastServiceName, c.primaryCategory, serviceFocus, data.services)) {
        return false;
      }
      if (filter === 'ACTIVE_PACKAGE') {
        if (!c.activePackage || getRemainingSessions(c.activePackage) === 0) return false;
      } else if (filter === 'LAZER_CILT') {
        if (c.primaryCategory !== 'LAZER_CILT') return false;
      } else if (filter === 'TIRNAK_KAS_KIRPIK') {
        if (c.primaryCategory !== 'TIRNAK_KAS_KIRPIK') return false;
      } else if (filter === 'RECALL_DUE') {
        if (!isClientRecallDue(c, todayIso)) return false;
      }

      if (!q) return true;
      return (
        c.name.toLocaleLowerCase('tr-TR').includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastServiceName.toLocaleLowerCase('tr-TR').includes(q) ||
        (c.allergyNote?.toLocaleLowerCase('tr-TR').includes(q) ?? false)
      );
    });
  }, [data.clients, data.services, filter, search, serviceFocus, todayIso]);

  const activeClient: Client | null = useMemo(() => {
    if (selectedClientId) {
      return data.clients.find((c) => c.id === selectedClientId) ?? null;
    }
    return filteredClients[0] ?? data.clients[0] ?? null;
  }, [data.clients, filteredClients, selectedClientId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-[#A87664]">
            Paket Sayaçları · Teknik Formül Arşivi · Öncesi / Sonrası
            {serviceFocus !== 'ALL' ? ` · ${SERVICE_FOCUS_LABELS[serviceFocus]}` : ''}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight">
              Müşteri Kartları
            </h1>
            {serviceFocus !== 'ALL' && (
              <button
                type="button"
                onClick={onClearServiceFocus}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                {SERVICE_FOCUS_LABELS[serviceFocus]} filtresini kaldır
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowNewClientForm((v) => !v)}
            className={SECONDARY_BUTTON_CLASS}
          >
            <Plus className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
            Yeni Müşteri
          </button>
          <button type="button" onClick={onNavigateQuickLog} className={PRIMARY_BUTTON_CLASS}>
            İşlem Ekle
          </button>
        </div>
      </div>

      {showNewClientForm && (
        <NewClientForm
          settings={data.settings}
          onCreate={(payload) => {
            onAddClient(payload);
            setShowNewClientForm(false);
          }}
          onClose={() => setShowNewClientForm(false)}
        />
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 lg:max-w-md">
          <Search
            className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri adı, telefon, işlem veya hassasiyet ara..."
            aria-label="Müşterilerde ara"
            className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-base sm:text-sm bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#2F5D50]"
          />
        </div>

        <div
          className="flex items-center gap-1 p-1 bg-white border border-[#E7E5E4] rounded-lg overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Müşteri filtreleri"
        >
          {FILTER_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              type="button"
              role="tab"
              aria-selected={filter === btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === btn.id
                  ? 'bg-[#2F5D50] text-white'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-label="Müşteri listesi"
          className={`lg:col-span-4 bg-white border border-[#E7E5E4] rounded-xl overflow-hidden ${
            selectedClientId ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="px-4 py-3 border-b border-[#E7E5E4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#57534E]">Müşteriler</span>
            <span className="text-xs font-mono tabular-nums text-[#57534E]">
              {filteredClients.length} kayıt
            </span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm text-[#57534E]">Bu filtreye uygun müşteri bulunamadı.</p>
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setSearch('');
                }}
                className="text-xs font-medium text-[#2F5D50] hover:underline"
              >
                Filtreyi sıfırla
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {filteredClients.map((client) => {
                const isSelected = activeClient?.id === client.id;
                const remaining = getRemainingSessions(client.activePackage);
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectClient(client.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors flex flex-col gap-1 ${
                      isSelected ? 'bg-[#FAF9F7]' : 'hover:bg-[#FAF9F7]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-[#2F5D50]' : 'text-[#1C1917]'
                        }`}
                      >
                        {client.name}
                      </span>
                      {client.activePackage && remaining > 0 && (
                        <span className="text-xs font-mono tabular-nums text-[#2F5D50] font-medium shrink-0">
                          {client.activePackage.completedSessions}/
                          {client.activePackage.totalSessions}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#57534E] truncate">{client.lastServiceName}</p>
                    <p className="text-xs text-[#57534E]/80">
                      {client.primaryCategory === 'LAZER_CILT'
                        ? 'Lazer & Cilt'
                        : 'Tırnak & Kaş/Kirpik'}
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {formatShortDateTr(client.lastVisitDate)}
                      </span>
                      {client.allergyNote && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-[#B91C1C] font-medium">Hassasiyet notu</span>
                        </>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section
          aria-label="Müşteri detay kartı"
          className={`lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-6 space-y-6 ${
            selectedClientId ? 'block' : 'hidden lg:block'
          }`}
        >
          <ClientDetailPanel
            client={activeClient}
            settings={data.settings}
            todayIso={todayIso}
            onBackToList={() => onSelectClient(null)}
            onDecrementPackageSession={onDecrementPackageSession}
            onUpdatePackagePayment={onUpdatePackagePayment}
            onAddOrReplacePackage={onAddOrReplacePackage}
            onUploadBeforeAfter={onUploadBeforeAfter}
          />
        </section>
      </div>
    </div>
  );
}
