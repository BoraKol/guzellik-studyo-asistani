interface BrandIconProps {
  /**
   * Matches the exact original brand icon container dimensions so replacing the icon
   * introduces zero layout shift across desktop and mobile viewports.
   */
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

const SIZE_CLASSES: Record<NonNullable<BrandIconProps['size']>, string> = {
  sm: 'w-7 h-7 rounded-md',
  md: 'w-8 h-8 rounded-lg',
  lg: 'w-9 h-9 rounded-lg',
  responsive: 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg',
};

export function BrandIcon({ size = 'md' }: BrandIconProps) {
  return (
    <img
      src="/app-icon.png"
      alt=""
      aria-hidden="true"
      decoding="async"
      className={`${SIZE_CLASSES[size]} shrink-0 object-cover select-none`}
    />
  );
}
