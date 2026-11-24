import type {
  Appointment,
  BioServiceGroup,
  ServiceItem,
} from '../types/studio';
import {
  addDaysIso,
  formatMinutesToTime,
  parseTimeToMinutes,
  TURKISH_MONTHS_SHORT,
  TURKISH_WEEKDAYS_SHORT,
} from './dateUtils';
import { resolveServiceDuration, resolveServiceGroup } from './serviceClassifier';

export interface TimelineAppointmentItem {
  appointment: Appointment;
  startMinutes: number;
  endMinutes: number;
  endTime: string;
  durationMinutes: number;
  serviceGroup: BioServiceGroup;
}

export interface DailyTimelineSlot {
  hour: number;
  label: string;
  items: TimelineAppointmentItem[];
}

export interface WeeklyTimelineDay {
  dateIso: string;
  weekdayShort: string;
  dayNumber: string;
  monthShort: string;
  isToday: boolean;
  isTomorrow: boolean;
  items: TimelineAppointmentItem[];
}

function enrichTimelineAppointment(
  appointment: Appointment,
  services: ServiceItem[]
): TimelineAppointmentItem {
  const startMinutes = parseTimeToMinutes(appointment.time);
  const durationMinutes = resolveServiceDuration(appointment.serviceName, services);
  const endMinutes = Math.min(23 * 60 + 59, startMinutes + durationMinutes);
  return {
    appointment,
    startMinutes,
    endMinutes,
    endTime: formatMinutesToTime(endMinutes),
    durationMinutes,
    serviceGroup: resolveServiceGroup(appointment.serviceName, appointment.category, services),
  };
}

/**
 * Builds hourly time slots for a single day's schedule timeline.
 * Automatically expands bounds if an appointment falls outside [startHour, endHour].
 */
export function buildDailyTimelineSlots(
  appointments: Appointment[],
  services: ServiceItem[],
  dateIso: string,
  startHour = 9,
  endHour = 19
): DailyTimelineSlot[] {
  const enriched = appointments
    .filter((a) => a.date === dateIso)
    .map((a) => enrichTimelineAppointment(a, services))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let minHour = startHour;
  let maxHour = endHour;
  const byHour = new Map<number, TimelineAppointmentItem[]>();

  for (const item of enriched) {
    const itemHour = Math.floor(item.startMinutes / 60);
    if (itemHour < minHour) minHour = itemHour;
    if (itemHour > maxHour) maxHour = itemHour;
    const bucket = byHour.get(itemHour);
    if (bucket) bucket.push(item);
    else byHour.set(itemHour, [item]);
  }

  const slots: DailyTimelineSlot[] = [];
  for (let hour = minHour; hour <= maxHour; hour++) {
    slots.push({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      items: byHour.get(hour) ?? [],
    });
  }
  return slots;
}

/**
 * Builds a 7-day weekly schedule array starting from `startDateIso`.
 * Pre-indexes appointments by date in O(n) for fast rendering.
 */
export function buildWeeklyTimelineDays(
  appointments: Appointment[],
  services: ServiceItem[],
  startDateIso: string,
  todayIso: string
): WeeklyTimelineDay[] {
  const tomorrowIso = addDaysIso(todayIso, 1);
  const byDate = new Map<string, TimelineAppointmentItem[]>();

  for (const apt of appointments) {
    const item = enrichTimelineAppointment(apt, services);
    const bucket = byDate.get(apt.date);
    if (bucket) bucket.push(item);
    else byDate.set(apt.date, [item]);
  }

  const days: WeeklyTimelineDay[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const dateIso = addDaysIso(startDateIso, offset);
    const [y, m, d] = dateIso.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const weekdayShort = TURKISH_WEEKDAYS_SHORT[utcDate.getUTCDay()] ?? '';
    const monthShort = TURKISH_MONTHS_SHORT[(m - 1) % 12] ?? '';

    const items = (byDate.get(dateIso) ?? []).sort((a, b) => a.startMinutes - b.startMinutes);

    days.push({
      dateIso,
      weekdayShort,
      dayNumber: String(d),
      monthShort,
      isToday: dateIso === todayIso,
      isTomorrow: dateIso === tomorrowIso,
      items,
    });
  }

  return days;
}

/**
 * Computes the new { date, time } when an appointment is dragged and dropped onto
 * either a weekly day column (targetHour = null -> keeps original time) or a
 * specific daily hour slot (targetHour = 0..23 -> snaps to HH:00).
 */
export function computeDroppedAppointmentSlot(
  targetDateIso: string,
  targetHour: number | null,
  currentTime: string
): { date: string; time: string } {
  if (targetHour === null) {
    const normalizedMinutes = parseTimeToMinutes(currentTime);
    return {
      date: targetDateIso,
      time: formatMinutesToTime(normalizedMinutes),
    };
  }
  const clampedHour = Math.max(0, Math.min(23, Math.floor(targetHour)));
  return {
    date: targetDateIso,
    time: `${String(clampedHour).padStart(2, '0')}:00`,
  };
}
