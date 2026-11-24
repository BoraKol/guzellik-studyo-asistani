import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdatePatch,
  BeforeAfterPair,
  BeforeAfterUploadInput,
  Client,
  ClientPackage,
  CreateClientPayload,
  PaymentStatus,
  SaveSessionPayload,
  SaveSessionResult,
  ServiceItem,
  SessionLog,
  StudioData,
  StudioSettings,
} from '../../domain/types/studio';
import { createDemoStudioData } from '../../domain/data/demoStudioData';
import { addDaysIso, toIsoDate } from '../../domain/engines/dateUtils';
import { incrementPackageSession } from '../../domain/engines/recallEngine';
import { getFirebaseDb, getFirebaseStorage } from './client';
import { throwRepositoryError, wrapRepositoryError, type StudioRepositoryError } from './errors';
import {
  buildAppointmentCreatePayload,
  buildClientCreatePayload,
  buildServiceCreatePayload,
  buildStudioCreatePayload,
  buildStudioUpdatePayload,
  clampNum,
  clampStr,
  createDocumentId,
  isSafeDocumentId,
  mapAppointmentDoc,
  mapClientDoc,
  mapServiceDoc,
  mapStudioDoc,
  sanitizeBeforeAfter,
  sanitizePackage,
  sanitizeSession,
} from './mappers';

const FIRESTORE_BATCH_CHUNK = 400;

export interface StudioSubscriptionCallbacks {
  onSettings: (settings: StudioSettings | null) => void;
  onServices: (services: ServiceItem[]) => void;
  onClients: (clients: Client[]) => void;
  onAppointments: (appointments: Appointment[]) => void;
  onError: (err: StudioRepositoryError) => void;
}

type BatchWriteOperation =
  | { type: 'set'; ref: DocumentReference; data: Record<string, unknown> }
  | { type: 'delete'; ref: DocumentReference };

/**
 * Commits an arbitrary number of Firestore writes safely in chunks (< 500 limit).
 */
async function commitInChunks(operations: BatchWriteOperation[]): Promise<void> {
  if (operations.length === 0) return;
  const db = getFirebaseDb();

  for (let i = 0; i < operations.length; i += FIRESTORE_BATCH_CHUNK) {
    const chunk = operations.slice(i, i + FIRESTORE_BATCH_CHUNK);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }
}

async function deleteAllInSubcollection(
  uid: string,
  subcol: 'services' | 'clients' | 'appointments'
): Promise<void> {
  const db = getFirebaseDb();
  const path = `studios/${uid}/${subcol}`;
  try {
    const snap = await getDocs(
      query(collection(db, 'studios', uid, subcol), where('ownerId', '==', uid))
    );
    if (snap.empty) return;
    await commitInChunks(snap.docs.map((d) => ({ type: 'delete', ref: d.ref })));
  } catch (error) {
    throwRepositoryError(error, 'delete', path);
  }
}

export const studioRepository = {
  subscribe(uid: string, callbacks: StudioSubscriptionCallbacks): Unsubscribe {
    const db = getFirebaseDb();

    const unsubStudio = onSnapshot(
      doc(db, 'studios', uid),
      (snap) => {
        callbacks.onSettings(snap.exists() ? mapStudioDoc(snap.data()) : null);
      },
      (error) => callbacks.onError(wrapRepositoryError(error, 'get', `studios/${uid}`))
    );

    const unsubServices = onSnapshot(
      query(collection(db, 'studios', uid, 'services'), where('ownerId', '==', uid)),
      (snap) => {
        callbacks.onServices(snap.docs.map((d) => mapServiceDoc(d.id, d.data())));
      },
      (error) => callbacks.onError(wrapRepositoryError(error, 'list', `studios/${uid}/services`))
    );

    const unsubClients = onSnapshot(
      query(collection(db, 'studios', uid, 'clients'), where('ownerId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => mapClientDoc(d.id, d.data()))
          .sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate));
        callbacks.onClients(list);
      },
      (error) => callbacks.onError(wrapRepositoryError(error, 'list', `studios/${uid}/clients`))
    );

    const unsubAppointments = onSnapshot(
      query(collection(db, 'studios', uid, 'appointments'), where('ownerId', '==', uid)),
      (snap) => {
        callbacks.onAppointments(snap.docs.map((d) => mapAppointmentDoc(d.id, d.data())));
      },
      (error) =>
        callbacks.onError(wrapRepositoryError(error, 'list', `studios/${uid}/appointments`))
    );

    return () => {
      unsubStudio();
      unsubServices();
      unsubClients();
      unsubAppointments();
    };
  },

  async ensureInitialized(uid: string): Promise<void> {
    const db = getFirebaseDb();
    const studioRef = doc(db, 'studios', uid);
    try {
      const snap = await getDoc(studioRef);
      if (!snap.exists()) {
        await this.seedDemoData(uid);
      }
    } catch (error) {
      throwRepositoryError(error, 'get', `studios/${uid}`);
    }
  },

  async seedDemoData(uid: string): Promise<void> {
    const demo = createDemoStudioData();
    await this.importData(uid, demo);
  },

  async importData(uid: string, nextData: StudioData): Promise<void> {
    const db = getFirebaseDb();
    const studioRef = doc(db, 'studios', uid);

    // Step 1: Ensure parent studio document exists/updated FIRST so Firestore Master Gate passes
    try {
      const existingSnap = await getDoc(studioRef);
      if (existingSnap.exists()) {
        await updateDoc(studioRef, buildStudioUpdatePayload(nextData.settings));
      } else {
        await setDoc(studioRef, buildStudioCreatePayload(uid, nextData.settings));
      }
    } catch (error) {
      throwRepositoryError(error, 'write', `studios/${uid}`);
    }

    // Step 2: Replace subcollections in parallel
    await Promise.all([
      deleteAllInSubcollection(uid, 'services'),
      deleteAllInSubcollection(uid, 'clients'),
      deleteAllInSubcollection(uid, 'appointments'),
    ]);

    const ops: BatchWriteOperation[] = [];
    for (const srv of nextData.services) {
      const safeId = isSafeDocumentId(srv.id) ? srv.id : createDocumentId('srv');
      ops.push({
        type: 'set',
        ref: doc(db, 'studios', uid, 'services', safeId),
        data: buildServiceCreatePayload(uid, srv),
      });
    }
    for (const cli of nextData.clients) {
      const safeId = isSafeDocumentId(cli.id) ? cli.id : createDocumentId('cli');
      ops.push({
        type: 'set',
        ref: doc(db, 'studios', uid, 'clients', safeId),
        data: buildClientCreatePayload(uid, cli),
      });
    }
    for (const apt of nextData.appointments) {
      const safeId = isSafeDocumentId(apt.id) ? apt.id : createDocumentId('apt');
      ops.push({
        type: 'set',
        ref: doc(db, 'studios', uid, 'appointments', safeId),
        data: buildAppointmentCreatePayload(uid, apt),
      });
    }

    try {
      await commitInChunks(ops);
    } catch (error) {
      throwRepositoryError(error, 'write', `studios/${uid}/*`);
    }
  },

  async clearClientsAndAppointments(uid: string): Promise<void> {
    await Promise.all([
      deleteAllInSubcollection(uid, 'clients'),
      deleteAllInSubcollection(uid, 'appointments'),
    ]);
  },

  async updateSettings(uid: string, settings: StudioSettings): Promise<void> {
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid), buildStudioUpdatePayload(settings));
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}`);
    }
  },

  async addService(uid: string, service: Omit<ServiceItem, 'id'>): Promise<void> {
    const db = getFirebaseDb();
    const id = createDocumentId('srv');
    try {
      await setDoc(doc(db, 'studios', uid, 'services', id), buildServiceCreatePayload(uid, service));
    } catch (error) {
      throwRepositoryError(error, 'create', `studios/${uid}/services/${id}`);
    }
  },

  async toggleServiceBio(uid: string, serviceId: string, nextShowInBio: boolean): Promise<void> {
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid, 'services', serviceId), {
        showInBio: nextShowInBio,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/services/${serviceId}`);
    }
  },

  async deleteService(uid: string, serviceId: string): Promise<void> {
    const db = getFirebaseDb();
    try {
      await deleteDoc(doc(db, 'studios', uid, 'services', serviceId));
    } catch (error) {
      throwRepositoryError(error, 'delete', `studios/${uid}/services/${serviceId}`);
    }
  },

  async addClient(uid: string, payload: CreateClientPayload): Promise<string> {
    const db = getFirebaseDb();
    const id = createDocumentId('cli');
    const todayIso = toIsoDate(new Date());
    const client: Client = {
      id,
      name: payload.name,
      phone: payload.phone,
      primaryCategory: payload.primaryCategory,
      allergyNote: payload.allergyNote,
      createdAt: todayIso,
      lastVisitDate: todayIso,
      lastServiceName: 'Yeni Kayıt',
      nextRecallDate: addDaysIso(todayIso, payload.recallCycleDays),
      recallCycleDays: payload.recallCycleDays,
      sessions: [],
      beforeAfterPhotos: [],
    };
    try {
      await setDoc(doc(db, 'studios', uid, 'clients', id), buildClientCreatePayload(uid, client));
      return id;
    } catch (error) {
      throwRepositoryError(error, 'create', `studios/${uid}/clients/${id}`);
    }
  },

  async markClientReminded(uid: string, client: Client): Promise<void> {
    const db = getFirebaseDb();
    const todayIso = toIsoDate(new Date());
    const nextVal = client.lastRemindedAt === todayIso ? deleteField() : todayIso;
    try {
      await updateDoc(doc(db, 'studios', uid, 'clients', client.id), {
        lastRemindedAt: nextVal,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/clients/${client.id}`);
    }
  },

  async decrementClientPackage(uid: string, client: Client): Promise<void> {
    const nextPkg = sanitizePackage(incrementPackageSession(client.activePackage));
    if (!nextPkg) return;
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid, 'clients', client.id), {
        activePackage: nextPkg,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/clients/${client.id}`);
    }
  },

  async updateClientPackagePayment(
    uid: string,
    client: Client,
    status: PaymentStatus
  ): Promise<void> {
    if (!client.activePackage) return;
    const nextPkg = sanitizePackage({ ...client.activePackage, paymentStatus: status });
    if (!nextPkg) return;
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid, 'clients', client.id), {
        activePackage: nextPkg,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/clients/${client.id}`);
    }
  },

  async upsertClientPackage(uid: string, clientId: string, pkg: ClientPackage): Promise<void> {
    const nextPkg = sanitizePackage(pkg);
    if (!nextPkg) return;
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid, 'clients', clientId), {
        activePackage: nextPkg,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/clients/${clientId}`);
    }
  },

  async saveClientSession(
    uid: string,
    existingClients: Client[],
    payload: SaveSessionPayload
  ): Promise<SaveSessionResult> {
    const db = getFirebaseDb();
    const existing = existingClients.find(
      (c) => c.name.trim().toLowerCase() === payload.clientName.trim().toLowerCase()
    );
    const nextRecallDate = addDaysIso(payload.date, payload.nextRecallDays);

    if (existing) {
      const hasRemainingPkg =
        Boolean(existing.activePackage) &&
        payload.decrementPackage &&
        existing.activePackage!.completedSessions < existing.activePackage!.totalSessions;

      const updatedPkg = hasRemainingPkg
        ? incrementPackageSession(existing.activePackage)
        : existing.activePackage;

      const newLog: SessionLog = {
        id: createDocumentId('ses'),
        clientId: existing.id,
        date: payload.date,
        category: payload.category,
        serviceName: payload.serviceName,
        sessionNumber:
          payload.sessionNumber ??
          (hasRemainingPkg && updatedPkg ? updatedPkg.completedSessions : undefined),
        technicalParams: payload.technicalParams,
        notes: payload.notes,
        nextRecallDays: payload.nextRecallDays,
      };

      const nextSessions = [newLog, ...existing.sessions].slice(0, 50).map(sanitizeSession);
      const updateBody: Record<string, unknown> = {
        lastVisitDate: clampStr(payload.date, 16),
        lastServiceName: clampStr(payload.serviceName, 140),
        nextRecallDate: clampStr(nextRecallDate, 16),
        recallCycleDays: clampNum(payload.nextRecallDays, 7, 180, 28),
        lastRemindedAt: deleteField(),
        sessions: nextSessions,
        updatedAt: serverTimestamp(),
      };
      const cleanPkg = sanitizePackage(updatedPkg);
      if (cleanPkg) {
        updateBody.activePackage = cleanPkg;
      }

      try {
        await updateDoc(doc(db, 'studios', uid, 'clients', existing.id), updateBody);
        return {
          clientId: existing.id,
          clientName: existing.name,
          packageUpdated: hasRemainingPkg,
        };
      } catch (error) {
        throwRepositoryError(error, 'update', `studios/${uid}/clients/${existing.id}`);
      }
    }

    const newClientId = createDocumentId('cli');
    const newClient: Client = {
      id: newClientId,
      name: payload.clientName,
      phone: payload.phone?.trim() || '',
      primaryCategory: payload.category,
      createdAt: payload.date,
      lastVisitDate: payload.date,
      lastServiceName: payload.serviceName,
      nextRecallDate,
      recallCycleDays: payload.nextRecallDays,
      sessions: [
        {
          id: createDocumentId('ses'),
          clientId: newClientId,
          date: payload.date,
          category: payload.category,
          serviceName: payload.serviceName,
          sessionNumber: payload.sessionNumber,
          technicalParams: payload.technicalParams,
          notes: payload.notes,
          nextRecallDays: payload.nextRecallDays,
        },
      ],
      beforeAfterPhotos: [],
    };

    try {
      await setDoc(
        doc(db, 'studios', uid, 'clients', newClientId),
        buildClientCreatePayload(uid, newClient)
      );
      return {
        clientId: newClientId,
        clientName: newClient.name,
        packageUpdated: false,
      };
    } catch (error) {
      throwRepositoryError(error, 'create', `studios/${uid}/clients/${newClientId}`);
    }
  },

  async uploadBeforeAfterAndSave(
    uid: string,
    client: Client,
    input: BeforeAfterUploadInput
  ): Promise<void> {
    const db = getFirebaseDb();
    const storage = getFirebaseStorage();
    const pairId = createDocumentId('ba');
    const beforeRef = ref(storage, `studios/${uid}/before-after/${client.id}/${pairId}-before.jpg`);
    const afterRef = ref(storage, `studios/${uid}/before-after/${client.id}/${pairId}-after.jpg`);

    // Parallel upload halves mobile latency
    await Promise.all([
      uploadBytes(beforeRef, input.beforeBlob, { contentType: 'image/jpeg' }),
      uploadBytes(afterRef, input.afterBlob, { contentType: 'image/jpeg' }),
    ]);

    const [beforeUrl, afterUrl] = await Promise.all([
      getDownloadURL(beforeRef),
      getDownloadURL(afterRef),
    ]);

    const newPair: BeforeAfterPair = {
      id: pairId,
      date: toIsoDate(new Date()),
      title: input.title,
      category: client.primaryCategory,
      beforeUrl,
      afterUrl,
      note: input.note,
    };

    const nextPhotos = [newPair, ...client.beforeAfterPhotos]
      .slice(0, 20)
      .map(sanitizeBeforeAfter)
      .filter((item): item is Record<string, unknown> => item !== null);

    try {
      await updateDoc(doc(db, 'studios', uid, 'clients', client.id), {
        beforeAfterPhotos: nextPhotos,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/clients/${client.id}`);
    }
  },

  async addAppointment(uid: string, appointment: Omit<Appointment, 'id'>): Promise<void> {
    const db = getFirebaseDb();
    const id = createDocumentId('apt');
    try {
      await setDoc(
        doc(db, 'studios', uid, 'appointments', id),
        buildAppointmentCreatePayload(uid, appointment)
      );
    } catch (error) {
      throwRepositoryError(error, 'create', `studios/${uid}/appointments/${id}`);
    }
  },

  async updateAppointmentStatus(
    uid: string,
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<void> {
    const db = getFirebaseDb();
    try {
      await updateDoc(doc(db, 'studios', uid, 'appointments', appointmentId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/appointments/${appointmentId}`);
    }
  },

  async updateAppointment(
    uid: string,
    appointmentId: string,
    patch: AppointmentUpdatePatch
  ): Promise<void> {
    const db = getFirebaseDb();
    const updateBody: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (patch.date !== undefined) updateBody.date = clampStr(patch.date, 16);
    if (patch.time !== undefined) updateBody.time = clampStr(patch.time, 8);
    if (patch.serviceName !== undefined) {
      const cleaned = clampStr(patch.serviceName, 140);
      if (cleaned) updateBody.serviceName = cleaned;
    }
    if (patch.category !== undefined) {
      updateBody.category =
        patch.category === 'TIRNAK_KAS_KIRPIK' ? 'TIRNAK_KAS_KIRPIK' : 'LAZER_CILT';
    }
    if (patch.status !== undefined) {
      updateBody.status =
        patch.status === 'ONAYLANDI' || patch.status === 'IPTAL_ERTELENDI'
          ? patch.status
          : 'TEYIT_BEKLIYOR';
    }
    if (patch.notes !== undefined) {
      const cleanedNotes = clampStr(patch.notes, 300);
      updateBody.notes = cleanedNotes ? cleanedNotes : deleteField();
    }

    try {
      await updateDoc(doc(db, 'studios', uid, 'appointments', appointmentId), updateBody);
    } catch (error) {
      throwRepositoryError(error, 'update', `studios/${uid}/appointments/${appointmentId}`);
    }
  },

  async deleteAppointment(uid: string, appointmentId: string): Promise<void> {
    const db = getFirebaseDb();
    try {
      await deleteDoc(doc(db, 'studios', uid, 'appointments', appointmentId));
    } catch (error) {
      throwRepositoryError(error, 'delete', `studios/${uid}/appointments/${appointmentId}`);
    }
  },
};
