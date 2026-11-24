import type {
  BioServiceGroup,
  NicheCategory,
  ServiceFocusFilter,
  ServiceItem,
} from '../types/studio';

const KEYWORD_GROUPS: ReadonlyArray<{
  group: BioServiceGroup;
  keywords: readonly string[];
}> = [
  {
    group: 'LAZER_EPILASYON',
    keywords: ['lazer', 'epilasyon', 'diode', 'alexandrite'],
  },
  {
    group: 'CILT_BAKIMI',
    keywords: ['cilt', 'hydra', 'peeling', 'bariyer', 'medikal', 'maske'],
  },
  {
    group: 'KAS_KIRPIK',
    keywords: ['kaş', 'kirpik', 'lifting', 'laminasyon', 'microblading'],
  },
  {
    group: 'PROTEZ_TIRNAK_OJE',
    keywords: ['tırnak', 'oje', 'manikür', 'pedikür', 'protez'],
  },
];

export function deriveCategoryFromBioGroup(group: BioServiceGroup): NicheCategory {
  return group === 'LAZER_EPILASYON' || group === 'CILT_BAKIMI'
    ? 'LAZER_CILT'
    : 'TIRNAK_KAS_KIRPIK';
}

function findMatchingService(
  normalizedName: string,
  services: ServiceItem[]
): ServiceItem | undefined {
  const exact = services.find(
    (s) => s.name.toLocaleLowerCase('tr-TR').trim() === normalizedName
  );
  if (exact) return exact;

  return services.find((s) => {
    const sName = s.name.toLocaleLowerCase('tr-TR').trim();
    return sName.includes(normalizedName) || normalizedName.includes(sName);
  });
}

/**
 * Deterministically maps any client/appointment service name + category
 * into one of the 4 operational beauty-center service tracks.
 */
export function resolveServiceGroup(
  serviceName: string,
  category: NicheCategory,
  services: ServiceItem[] = []
): BioServiceGroup {
  const normalized = serviceName.toLocaleLowerCase('tr-TR').trim();

  if (normalized) {
    const matched = findMatchingService(normalized, services);
    if (matched) return matched.bioGroup;

    for (const entry of KEYWORD_GROUPS) {
      if (entry.keywords.some((kw) => normalized.includes(kw))) {
        return entry.group;
      }
    }
  }

  return category === 'LAZER_CILT' ? 'LAZER_EPILASYON' : 'PROTEZ_TIRNAK_OJE';
}

/**
 * Pure filter predicate for the Service-Focused navigation bar.
 */
export function matchesServiceFocus(
  serviceName: string,
  category: NicheCategory,
  focus: ServiceFocusFilter,
  services: ServiceItem[] = []
): boolean {
  if (focus === 'ALL') return true;
  return resolveServiceGroup(serviceName, category, services) === focus;
}

/**
 * Resolves estimated service duration in minutes from studio services list.
 */
export function resolveServiceDuration(
  serviceName: string,
  services: ServiceItem[] = [],
  fallbackMinutes = 45
): number {
  const normalized = serviceName.toLocaleLowerCase('tr-TR').trim();
  if (!normalized) return fallbackMinutes;

  const matched = findMatchingService(normalized, services);
  if (matched && matched.durationMinutes > 0) {
    return matched.durationMinutes;
  }

  return fallbackMinutes;
}
