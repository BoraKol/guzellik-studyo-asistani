import type {
  Client,
  ClientPackage,
  RecallRadarItem,
  RecallUrgency,
  StudioSettings,
} from '../types/studio';
import { addDaysIso, diffDaysIso } from './dateUtils';
import { buildWhatsAppLink } from './formatters';
import { buildRecallMessage } from './messageBuilder';

export * from './dateUtils';
export * from './formatters';
export * from './messageBuilder';
export * from './serviceClassifier';
export * from './timelineEngine';

/**
 * Fast O(1) predicate to determine whether a client is overdue, due today, or due within 7 days.
 * Avoids allocating WhatsApp strings/URLs when only filtering lists.
 */
export function isClientRecallDue(client: Client, referenceDateIso: string): boolean {
  const computedNextRecall =
    client.nextRecallDate || addDaysIso(client.lastVisitDate, client.recallCycleDays || 28);
  return diffDaysIso(referenceDateIso, computedNextRecall) <= 7;
}

/**
 * Computes the deterministic Recall Radar queue for all clients as of `referenceDateIso`.
 */
export function computeRecallRadar(
  clients: Client[],
  settings: StudioSettings,
  referenceDateIso: string
): {
  dueNow: RecallRadarItem[];
  upcomingWeek: RecallRadarItem[];
  allItems: RecallRadarItem[];
} {
  const items: RecallRadarItem[] = clients.map((client) => {
    const daysSinceLastVisit = Math.max(0, diffDaysIso(client.lastVisitDate, referenceDateIso));
    const computedNextRecall =
      client.nextRecallDate || addDaysIso(client.lastVisitDate, client.recallCycleDays || 28);
    const daysUntilRecall = diffDaysIso(referenceDateIso, computedNextRecall);

    let urgency: RecallUrgency = 'OK';
    if (daysUntilRecall < 0) {
      urgency = 'OVERDUE';
    } else if (daysUntilRecall === 0) {
      urgency = 'DUE_TODAY';
    } else if (daysUntilRecall <= 7) {
      urgency = 'UPCOMING_WEEK';
    }

    const daysSinceReminder = client.lastRemindedAt
      ? diffDaysIso(client.lastRemindedAt, referenceDateIso)
      : -1;
    const wasRemindedRecently = daysSinceReminder >= 0 && daysSinceReminder <= 7;

    const suggestedMessage = buildRecallMessage(client, settings, daysSinceLastVisit);
    const whatsappUrl = buildWhatsAppLink(client.phone, suggestedMessage);

    return {
      client,
      daysSinceLastVisit,
      daysUntilRecall,
      urgency,
      wasRemindedRecently,
      suggestedMessage,
      whatsappUrl,
    };
  });

  const sortItems = (a: RecallRadarItem, b: RecallRadarItem) => {
    if (a.wasRemindedRecently !== b.wasRemindedRecently) {
      return a.wasRemindedRecently ? 1 : -1;
    }
    return a.daysUntilRecall - b.daysUntilRecall;
  };

  items.sort(sortItems);

  const dueNow = items.filter((i) => i.urgency === 'OVERDUE' || i.urgency === 'DUE_TODAY');
  const upcomingWeek = items.filter((i) => i.urgency === 'UPCOMING_WEEK');

  return {
    dueNow,
    upcomingWeek,
    allItems: items,
  };
}

/**
 * Pure helper to increment a client's active package completed sessions safely.
 */
export function incrementPackageSession(pkg: ClientPackage | undefined): ClientPackage | undefined {
  if (!pkg) return undefined;
  const nextCompleted = Math.min(pkg.totalSessions, pkg.completedSessions + 1);
  return {
    ...pkg,
    completedSessions: nextCompleted,
  };
}

/**
 * Returns remaining sessions count for a package.
 */
export function getRemainingSessions(pkg: ClientPackage | undefined): number {
  if (!pkg) return 0;
  return Math.max(0, pkg.totalSessions - pkg.completedSessions);
}
