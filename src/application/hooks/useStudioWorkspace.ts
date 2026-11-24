import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdatePatch,
  BeforeAfterUploadInput,
  BioServiceGroup,
  Client,
  ClientPackage,
  CreateClientPayload,
  PaymentStatus,
  SaveSessionPayload,
  SaveSessionResult,
  ServiceItem,
  StudioData,
  StudioSettings,
} from '../../domain/types/studio';
import { createEmptyStudioData } from '../../domain/data/demoStudioData';
import { matchesServiceFocus } from '../../domain/engines/serviceClassifier';
import { StudioRepositoryError } from '../../infrastructure/firebase/errors';
import { studioRepository } from '../../infrastructure/firebase/studioRepository';

const SETTINGS_DEBOUNCE_MS = 450;

export function useStudioWorkspace(uid: string | null) {
  const emptyDefaults = useMemo(() => createEmptyStudioData(), []);

  const [settings, setSettings] = useState<StudioSettings>(emptyDefaults.settings);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [studioLoaded, setStudioLoaded] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [resettingDemo, setResettingDemo] = useState(false);

  const settingsTimerRef = useRef<number | null>(null);
  const latestSettingsRef = useRef<StudioSettings>(emptyDefaults.settings);
  latestSettingsRef.current = settings;

  const clientsRef = useRef<Client[]>(clients);
  clientsRef.current = clients;

  const servicesRef = useRef<ServiceItem[]>(services);
  servicesRef.current = services;

  const cancelPendingSettingsSync = useCallback(() => {
    if (settingsTimerRef.current !== null) {
      window.clearTimeout(settingsTimerRef.current);
      settingsTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!uid) {
      cancelPendingSettingsSync();
      setStudioLoaded(false);
      setServices([]);
      setClients([]);
      setAppointments([]);
      setCloudError(null);
      return;
    }

    let cancelled = false;
    let unsubscribeStudio: (() => void) | null = null;

    setCloudError(null);
    setStudioLoaded(false);

    (async () => {
      try {
        await studioRepository.ensureInitialized(uid);
        if (cancelled) return;

        unsubscribeStudio = studioRepository.subscribe(uid, {
          onSettings: (next) => {
            if (next) setSettings(next);
            setStudioLoaded(true);
          },
          onServices: setServices,
          onClients: setClients,
          onAppointments: setAppointments,
          onError: (err) => setFatalError(err),
        });
      } catch (err) {
        if (!cancelled) {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelPendingSettingsSync();
      unsubscribeStudio?.();
    };
  }, [uid, cancelPendingSettingsSync]);

  const data: StudioData = useMemo(
    () => ({
      version: 1,
      settings,
      services,
      clients,
      appointments,
    }),
    [settings, services, clients, appointments]
  );

  // Memoized once per clients/services update instead of re-filtering inside sidebar render
  const serviceFocusCounts = useMemo<Record<BioServiceGroup, number>>(() => {
    const counts: Record<BioServiceGroup, number> = {
      LAZER_EPILASYON: 0,
      CILT_BAKIMI: 0,
      PROTEZ_TIRNAK_OJE: 0,
      KAS_KIRPIK: 0,
    };
    const groups: BioServiceGroup[] = [
      'LAZER_EPILASYON',
      'CILT_BAKIMI',
      'PROTEZ_TIRNAK_OJE',
      'KAS_KIRPIK',
    ];
    for (const group of groups) {
      let n = 0;
      for (const client of clients) {
        if (matchesServiceFocus(client.lastServiceName, client.primaryCategory, group, services)) {
          n++;
        }
      }
      counts[group] = n;
    }
    return counts;
  }, [clients, services]);

  const runCloudMutation = useCallback((task: () => Promise<unknown>) => {
    setCloudError(null);
    task().catch((err) => {
      if (err instanceof StudioRepositoryError && err.isPermissionError) {
        setFatalError(err);
        return;
      }
      const message =
        err instanceof StudioRepositoryError
          ? err.message
          : 'Değişiklikler kaydedilirken bir sorun oluştu. Bağlantınızı kontrol edip tekrar deneyin.';
      setCloudError(message);
    });
  }, []);

  const resetDemoData = useCallback(async () => {
    if (!uid) return;
    setCloudError(null);
    setResettingDemo(true);
    try {
      await studioRepository.seedDemoData(uid);
    } catch (err) {
      setCloudError('Örnek veri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      throw err;
    } finally {
      setResettingDemo(false);
    }
  }, [uid]);

  const importData = useCallback(
    async (nextData: StudioData) => {
      if (!uid) return;
      setCloudError(null);
      await studioRepository.importData(uid, nextData);
    },
    [uid]
  );

  const clearToEmpty = useCallback(async () => {
    if (!uid) return;
    setCloudError(null);
    await studioRepository.clearClientsAndAppointments(uid);
  }, [uid]);

  const markReminded = useCallback(
    (clientId: string) => {
      if (!uid) return;
      const target = clientsRef.current.find((c) => c.id === clientId);
      if (!target) return;
      runCloudMutation(() => studioRepository.markClientReminded(uid, target));
    },
    [uid, runCloudMutation]
  );

  const updateAppointmentStatus = useCallback(
    (appointmentId: string, status: AppointmentStatus) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.updateAppointmentStatus(uid, appointmentId, status));
    },
    [uid, runCloudMutation]
  );

  const updateAppointment = useCallback(
    (appointmentId: string, patch: AppointmentUpdatePatch) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.updateAppointment(uid, appointmentId, patch));
    },
    [uid, runCloudMutation]
  );

  const deleteAppointment = useCallback(
    (appointmentId: string) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.deleteAppointment(uid, appointmentId));
    },
    [uid, runCloudMutation]
  );

  const addAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.addAppointment(uid, appointment));
    },
    [uid, runCloudMutation]
  );

  const saveSession = useCallback(
    async (payload: SaveSessionPayload): Promise<SaveSessionResult> => {
      if (!uid) {
        throw new Error('Oturum bulunamadı.');
      }
      setCloudError(null);
      return studioRepository.saveClientSession(uid, clientsRef.current, payload);
    },
    [uid]
  );

  const decrementPackageSession = useCallback(
    (clientId: string) => {
      if (!uid) return;
      const target = clientsRef.current.find((c) => c.id === clientId);
      if (!target) return;
      runCloudMutation(() => studioRepository.decrementClientPackage(uid, target));
    },
    [uid, runCloudMutation]
  );

  const updatePackagePayment = useCallback(
    (clientId: string, status: PaymentStatus) => {
      if (!uid) return;
      const target = clientsRef.current.find((c) => c.id === clientId);
      if (!target) return;
      runCloudMutation(() => studioRepository.updateClientPackagePayment(uid, target, status));
    },
    [uid, runCloudMutation]
  );

  const upsertPackage = useCallback(
    (clientId: string, pkg: ClientPackage) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.upsertClientPackage(uid, clientId, pkg));
    },
    [uid, runCloudMutation]
  );

  const addClient = useCallback(
    (payload: CreateClientPayload, onCreated?: (id: string) => void) => {
      if (!uid) return;
      runCloudMutation(async () => {
        const createdId = await studioRepository.addClient(uid, payload);
        onCreated?.(createdId);
      });
    },
    [uid, runCloudMutation]
  );

  const uploadBeforeAfter = useCallback(
    async (client: Client, input: BeforeAfterUploadInput) => {
      if (!uid) return;
      setCloudError(null);
      await studioRepository.uploadBeforeAfterAndSave(uid, client, input);
    },
    [uid]
  );

  const updateSettings = useCallback(
    (partial: Partial<StudioSettings>) => {
      if (!uid) return;
      const merged: StudioSettings = { ...latestSettingsRef.current, ...partial };
      latestSettingsRef.current = merged;
      setSettings(merged);

      cancelPendingSettingsSync();
      settingsTimerRef.current = window.setTimeout(() => {
        settingsTimerRef.current = null;
        runCloudMutation(() => studioRepository.updateSettings(uid, latestSettingsRef.current));
      }, SETTINGS_DEBOUNCE_MS);
    },
    [uid, cancelPendingSettingsSync, runCloudMutation]
  );

  const toggleServiceInBio = useCallback(
    (serviceId: string) => {
      if (!uid) return;
      const target = servicesRef.current.find((s) => s.id === serviceId);
      if (!target) return;
      runCloudMutation(() => studioRepository.toggleServiceBio(uid, serviceId, !target.showInBio));
    },
    [uid, runCloudMutation]
  );

  const addService = useCallback(
    (service: Omit<ServiceItem, 'id'>) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.addService(uid, service));
    },
    [uid, runCloudMutation]
  );

  const deleteService = useCallback(
    (serviceId: string) => {
      if (!uid) return;
      runCloudMutation(() => studioRepository.deleteService(uid, serviceId));
    },
    [uid, runCloudMutation]
  );

  return {
    data,
    studioLoaded,
    cloudError,
    fatalError,
    resettingDemo,
    serviceFocusCounts,
    cancelPendingSettingsSync,
    clearCloudError: useCallback(() => setCloudError(null), []),
    actions: {
      resetDemoData,
      importData,
      clearToEmpty,
      markReminded,
      updateAppointmentStatus,
      updateAppointment,
      deleteAppointment,
      addAppointment,
      saveSession,
      decrementPackageSession,
      updatePackagePayment,
      upsertPackage,
      addClient,
      uploadBeforeAfter,
      updateSettings,
      toggleServiceInBio,
      addService,
      deleteService,
    },
  };
}
