import {
  APPOINTMENT_STATUS_META,
  APPOINTMENT_STATUS_ORDER,
} from '../../../domain/constants/studioLabels';
import type { AppointmentStatus } from '../../../domain/types/studio';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  compact?: boolean;
}

export function AppointmentStatusBadge({
  status,
  compact = false,
}: AppointmentStatusBadgeProps) {
  const meta = APPOINTMENT_STATUS_META[status];
  return (
    <span
      className={`${compact ? 'text-[11px]' : 'text-xs'} font-medium px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
}

interface AppointmentStatusSelectorProps {
  value: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
  ariaLabel: string;
  variant?: 'surface' | 'white';
  size?: 'xs' | 'sm';
  fullLabels?: boolean;
}

export function AppointmentStatusSelector({
  value,
  onChange,
  ariaLabel,
  variant = 'surface',
  size = 'sm',
  fullLabels = false,
}: AppointmentStatusSelectorProps) {
  const containerClass =
    variant === 'white'
      ? 'bg-white border border-[#E7E5E4]'
      : 'bg-[#FAF9F7] border border-[#E7E5E4]';

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg ${containerClass} max-w-full overflow-x-auto no-scrollbar`}
      role="group"
      aria-label={ariaLabel}
    >
      {APPOINTMENT_STATUS_ORDER.map((statusKey) => {
        const meta = APPOINTMENT_STATUS_META[statusKey];
        const isActive = value === statusKey;
        const activeStyle =
          variant === 'white'
            ? 'bg-[#2F5D50] text-white'
            : 'bg-white text-[#1C1917] shadow-xs';
        const paddingClass = size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs';

        return (
          <button
            key={statusKey}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(statusKey)}
            className={`${paddingClass} font-medium rounded-md transition-colors whitespace-nowrap ${
              isActive ? activeStyle : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {fullLabels ? meta.label : meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
