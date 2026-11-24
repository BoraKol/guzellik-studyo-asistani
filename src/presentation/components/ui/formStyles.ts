/**
 * Centralized responsive Tailwind form control tokens (DRY).
 * Uses `text-base sm:text-sm` (16px on mobile) to prevent iOS Safari auto-zoom on focus.
 */
export const FIELD_LABEL_CLASS = 'block text-xs font-medium text-[#57534E] mb-1';

export const INPUT_SURFACE_CLASS =
  'w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-[#E7E5E4] rounded-lg bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50] transition-colors';

export const INPUT_WHITE_CLASS =
  'w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-[#E7E5E4] rounded-lg bg-white focus:outline-none focus:border-[#2F5D50] transition-colors';

export const MONO_INPUT_SURFACE_CLASS = `${INPUT_SURFACE_CLASS} font-mono tabular-nums`;

export const MONO_INPUT_WHITE_CLASS = `${INPUT_WHITE_CLASS} font-mono tabular-nums`;

export const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] active:scale-[0.99] transition-all disabled:opacity-50 whitespace-nowrap shrink-0';

export const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF9F7] active:scale-[0.99] transition-all disabled:opacity-50 whitespace-nowrap shrink-0';
