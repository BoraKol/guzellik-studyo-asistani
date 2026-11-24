import { CheckCircle2, X } from 'lucide-react';

type AlertVariant = 'error' | 'warning' | 'success';

interface AlertBannerProps {
  variant: AlertVariant;
  message: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]',
  warning: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  success: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
};

export function AlertBanner({
  variant,
  message,
  onDismiss,
  actionLabel,
  onAction,
  testId,
}: AlertBannerProps) {
  return (
    <div
      role={variant === 'success' ? 'status' : 'alert'}
      data-testid={testId}
      className={`border rounded-xl px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${VARIANT_CLASSES[variant]}`}
    >
      <span className="inline-flex items-start gap-2 leading-relaxed font-medium">
        {variant === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
        <span>{message}</span>
      </span>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-3 py-1.5 rounded-lg bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] whitespace-nowrap"
          >
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Bildirimi kapat"
            className="p-1 rounded-md opacity-75 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
