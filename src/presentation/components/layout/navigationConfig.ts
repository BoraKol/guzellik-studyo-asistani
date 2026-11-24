import {
  CalendarClock,
  Droplets,
  Eye,
  Hand,
  Link2,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { BioServiceGroup, NavTab } from '../../../domain/types/studio';

export interface NavItemConfig {
  id: NavTab;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItemConfig[] = [
  { id: 'dashboard', label: 'Bugün & Radar', mobileLabel: 'Bugün', icon: CalendarClock },
  { id: 'quick-log', label: 'Hızlı Kayıt (AI)', mobileLabel: 'Kayıt', icon: Sparkles },
  { id: 'clients', label: 'Müşteriler', mobileLabel: 'Müşteri', icon: Users },
  { id: 'bio-link', label: 'Bio Fiyat Linki', mobileLabel: 'Bio Link', icon: Link2 },
  { id: 'aftercare', label: 'Bakım & Güvenlik', mobileLabel: 'Bakım', icon: ShieldCheck },
  { id: 'settings', label: 'Hizmetler & Ayarlar', mobileLabel: 'Ayarlar', icon: Settings },
];

export const SERVICE_FOCUS_NAV_ITEMS: ReadonlyArray<{
  id: BioServiceGroup;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'LAZER_EPILASYON', label: 'Lazer', icon: Zap },
  { id: 'CILT_BAKIMI', label: 'Cilt Bakımı', icon: Droplets },
  { id: 'PROTEZ_TIRNAK_OJE', label: 'Tırnak', icon: Hand },
  { id: 'KAS_KIRPIK', label: 'Kaş/Kirpik', icon: Eye },
];
