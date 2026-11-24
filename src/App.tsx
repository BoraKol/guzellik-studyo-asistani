import { lazy, Suspense, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthSession } from './application/hooks/useAuthSession';
import { useStudioWorkspace } from './application/hooks/useStudioWorkspace';
import { useTransientNotice } from './application/hooks/useTransientNotice';
import type { NavTab, ServiceFocusFilter } from './domain/types/studio';
import { AuthGateView } from './presentation/components/auth/AuthGateView';
import { EmailVerificationView } from './presentation/components/auth/EmailVerificationView';
import { FirebaseConfigMissingView } from './presentation/components/auth/FirebaseConfigMissingView';
import { DashboardView } from './presentation/components/dashboard/DashboardView';
import { AppShell } from './presentation/components/layout/AppShell';
import { AlertBanner } from './presentation/components/ui/AlertBanner';

// Route-level code splitting for secondary workspace views to minimize mobile TTI
const QuickSessionLogView = lazy(() =>
  import('./presentation/components/session-log/QuickSessionLogView').then((m) => ({
    default: m.QuickSessionLogView,
  }))
);
const ClientsView = lazy(() =>
  import('./presentation/components/clients/ClientsView').then((m) => ({
    default: m.ClientsView,
  }))
);
const BioLinkView = lazy(() =>
  import('./presentation/components/bio-link/BioLinkView').then((m) => ({
    default: m.BioLinkView,
  }))
);
const AftercareSafetyView = lazy(() =>
  import('./presentation/components/aftercare/AftercareSafetyView').then((m) => ({
    default: m.AftercareSafetyView,
  }))
);
const SettingsCatalogView = lazy(() =>
  import('./presentation/components/settings/SettingsCatalogView').then((m) => ({
    default: m.SettingsCatalogView,
  }))
);

function ViewLoadingFallback() {
  return (
    <div className="py-16 flex items-center justify-center gap-3 text-sm text-[#57534E]">
      <Loader2 className="w-5 h-5 animate-spin text-[#2F5D50]" aria-hidden="true" />
      <span>Görünüm yükleniyor...</span>
    </div>
  );
}

export default function App() {
  const session = useAuthSession();
  const activeUid = session.user && session.isEmailVerified ? session.user.uid : null;
  const workspace = useStudioWorkspace(activeUid);
  const { notice: demoNotice, showNotice: showDemoNotice } = useTransientNotice(2800);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [serviceFocus, setServiceFocus] = useState<ServiceFocusFilter>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleOpenClient = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  }, []);

  const handleNavigateQuickLog = useCallback(() => {
    setActiveTab('quick-log');
  }, []);

  const handleResetDemo = useCallback(async () => {
    await workspace.actions.resetDemoData();
    setSelectedClientId(null);
    showDemoNotice('Örnek merkez verisi hesabınıza yüklendi.');
  }, [workspace.actions, showDemoNotice]);

  const handleImportData = useCallback(
    async (nextData: Parameters<typeof workspace.actions.importData>[0]) => {
      await workspace.actions.importData(nextData);
      setSelectedClientId(null);
    },
    [workspace.actions]
  );

  const handleClearToEmpty = useCallback(async () => {
    await workspace.actions.clearToEmpty();
    setSelectedClientId(null);
  }, [workspace.actions]);

  const handleSignOut = useCallback(async () => {
    workspace.cancelPendingSettingsSync();
    setSelectedClientId(null);
    await session.signOutUser();
  }, [workspace, session]);

  if (workspace.fatalError) {
    throw workspace.fatalError;
  }

  if (!session.isConfigured) {
    return <FirebaseConfigMissingView missingKeys={session.missingKeys} />;
  }

  if (!session.ready) {
    return (
      <div className="min-h-dvh bg-[#FAF9F7] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[#57534E]">
          <Loader2 className="w-5 h-5 animate-spin text-[#2F5D50]" aria-hidden="true" />
          <span>Güzellik merkezi oturumu doğrulanıyor...</span>
        </div>
      </div>
    );
  }

  if (!session.user) {
    return <AuthGateView />;
  }

  if (!session.isEmailVerified) {
    return (
      <EmailVerificationView user={session.user} onVerified={session.markEmailVerified} />
    );
  }

  const { data, actions } = workspace;

  return (
    <AppShell
      studioName={data.settings.studioName}
      userSubtitle={session.user.email || data.settings.instagramHandle}
      activeTab={activeTab}
      serviceFocus={serviceFocus}
      serviceFocusCounts={workspace.serviceFocusCounts}
      demoNotice={demoNotice}
      resettingDemo={workspace.resettingDemo}
      onSelectTab={setActiveTab}
      onChangeServiceFocus={setServiceFocus}
      onResetDemoData={() => {
        handleResetDemo().catch(() => {});
      }}
      onSignOut={() => {
        handleSignOut().catch(() => {});
      }}
    >
      {workspace.cloudError && (
        <div className="mb-6">
          <AlertBanner
            variant="error"
            message={workspace.cloudError}
            onDismiss={workspace.clearCloudError}
          />
        </div>
      )}

      {!workspace.studioLoaded ? (
        <div className="py-20 flex items-center justify-center gap-3 text-sm text-[#57534E]">
          <Loader2 className="w-5 h-5 animate-spin text-[#2F5D50]" aria-hidden="true" />
          <span>Güzellik merkezi paneliniz hazırlanıyor...</span>
        </div>
      ) : (
        <Suspense fallback={<ViewLoadingFallback />}>
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              serviceFocus={serviceFocus}
              onChangeServiceFocus={setServiceFocus}
              onMarkReminded={actions.markReminded}
              onUpdateAppointmentStatus={actions.updateAppointmentStatus}
              onUpdateAppointment={actions.updateAppointment}
              onDeleteAppointment={actions.deleteAppointment}
              onAddAppointment={actions.addAppointment}
              onOpenClient={handleOpenClient}
              onNavigateQuickLog={handleNavigateQuickLog}
            />
          )}

          {activeTab === 'quick-log' && (
            <QuickSessionLogView
              data={data}
              onSaveSession={actions.saveSession}
              onOpenClient={handleOpenClient}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              data={data}
              serviceFocus={serviceFocus}
              onClearServiceFocus={() => setServiceFocus('ALL')}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              onDecrementPackageSession={actions.decrementPackageSession}
              onUpdatePackagePayment={actions.updatePackagePayment}
              onAddOrReplacePackage={actions.upsertPackage}
              onAddClient={(payload) => actions.addClient(payload, setSelectedClientId)}
              onUploadBeforeAfter={actions.uploadBeforeAfter}
              onNavigateQuickLog={handleNavigateQuickLog}
            />
          )}

          {activeTab === 'bio-link' && (
            <BioLinkView
              data={data}
              onUpdateSettings={actions.updateSettings}
              onToggleServiceInBio={actions.toggleServiceInBio}
            />
          )}

          {activeTab === 'aftercare' && <AftercareSafetyView data={data} />}

          {activeTab === 'settings' && (
            <SettingsCatalogView
              data={data}
              onUpdateSettings={actions.updateSettings}
              onAddService={actions.addService}
              onDeleteService={actions.deleteService}
              onImportData={handleImportData}
              onResetDemoData={handleResetDemo}
              onClearToEmpty={handleClearToEmpty}
            />
          )}
        </Suspense>
      )}
    </AppShell>
  );
}
