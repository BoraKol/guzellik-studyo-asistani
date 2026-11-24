import type { ReactNode } from 'react';
import { LogOut, Plus, RotateCcw } from 'lucide-react';
import { SERVICE_FOCUS_LABELS } from '../../../domain/constants/studioLabels';
import type {
  BioServiceGroup,
  NavTab,
  ServiceFocusFilter,
} from '../../../domain/types/studio';
import { BrandIcon } from '../common/BrandIcon';
import { NAV_ITEMS, SERVICE_FOCUS_NAV_ITEMS } from './navigationConfig';

interface AppShellProps {
  studioName: string;
  userSubtitle: string;
  activeTab: NavTab;
  serviceFocus: ServiceFocusFilter;
  serviceFocusCounts: Record<BioServiceGroup, number>;
  demoNotice: string | null;
  resettingDemo: boolean;
  onSelectTab: (tab: NavTab) => void;
  onChangeServiceFocus: (focus: ServiceFocusFilter) => void;
  onResetDemoData: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

export function AppShell({
  studioName,
  userSubtitle,
  activeTab,
  serviceFocus,
  serviceFocusCounts,
  demoNotice,
  resettingDemo,
  onSelectTab,
  onChangeServiceFocus,
  onResetDemoData,
  onSignOut,
  children,
}: AppShellProps) {
  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-[#1C1917] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#E7E5E4] z-30">
        <div className="px-5 py-5 border-b border-[#E7E5E4] space-y-2">
          <div className="flex items-center gap-2.5">
            <BrandIcon size="md" />
            <div className="min-w-0">
              <span className="block font-display text-lg font-semibold leading-tight tracking-tight text-[#1C1917] whitespace-nowrap">
                StüdyoAsistan
              </span>
              <span className="block text-[11px] font-semibold text-[#A87664] leading-tight whitespace-nowrap">
                Güzellik Merkezi Paneli
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#57534E] leading-snug">
            Lazer · Cilt Bakımı · Protez Tırnak &amp; Kaş
          </p>
        </div>

        <nav aria-label="Ana menü" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isDashboardRoot = item.id === 'dashboard';
            const isActive = isDashboardRoot
              ? activeTab === 'dashboard' && serviceFocus === 'ALL'
              : activeTab === item.id;

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isDashboardRoot) onChangeServiceFocus('ALL');
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2F5D50] text-white'
                      : 'text-[#57534E] hover:bg-[#FAF9F7] hover:text-[#1C1917]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>

                {isDashboardRoot && (
                  <div
                    role="group"
                    aria-label="Hizmet Odaklı Navigasyon"
                    className="mt-1.5 mb-2.5 ml-3.5 pl-3 border-l border-[#E7E5E4] space-y-0.5"
                  >
                    <p className="px-2.5 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#A87664]">
                      Hizmet Odaklı
                    </p>
                    {SERVICE_FOCUS_NAV_ITEMS.map((focusItem) => {
                      const FocusIcon = focusItem.icon;
                      const isFocusActive =
                        (activeTab === 'dashboard' || activeTab === 'clients') &&
                        serviceFocus === focusItem.id;

                      return (
                        <button
                          key={focusItem.id}
                          type="button"
                          onClick={() => {
                            const nextFocus: ServiceFocusFilter =
                              serviceFocus === focusItem.id ? 'ALL' : focusItem.id;
                            onChangeServiceFocus(nextFocus);
                            if (activeTab !== 'dashboard' && activeTab !== 'clients') {
                              onSelectTab('dashboard');
                            }
                          }}
                          aria-pressed={isFocusActive}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                            isFocusActive
                              ? 'bg-[#2F5D50]/10 text-[#2F5D50] font-semibold'
                              : 'text-[#57534E] hover:bg-[#FAF9F7] hover:text-[#1C1917]'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FocusIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isFocusActive ? 'text-[#2F5D50]' : 'text-[#A87664]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{focusItem.label}</span>
                          </span>
                          <span className="font-mono tabular-nums text-[11px] opacity-75 shrink-0">
                            {serviceFocusCounts[focusItem.id]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E7E5E4] space-y-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[#1C1917] truncate">{studioName}</p>
            <p className="text-[11px] text-[#57534E] truncate">{userSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7E5E4] text-xs font-medium text-[#57534E] hover:text-[#B91C1C] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Güvenli Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-dvh min-w-0">
        <header className="no-print sticky top-0 z-20 safe-pt bg-[#FAF9F7]/95 backdrop-blur-sm border-b border-[#E7E5E4]">
          <div className="h-13 lg:h-14 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="lg:hidden flex items-center gap-2 min-w-0">
                <BrandIcon size="sm" />
                <div className="min-w-0 leading-none">
                  <span className="block font-display text-sm font-semibold text-[#1C1917] truncate">
                    StüdyoAsistan
                  </span>
                  <span className="block text-[10px] font-semibold text-[#A87664] truncate mt-0.5">
                    {studioName}
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs text-[#57534E] truncate">
                <span className="font-semibold text-[#A87664] whitespace-nowrap">
                  Güzellik Merkezi
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{studioName}</span>
                <span aria-hidden="true">/</span>
                <strong className="text-[#1C1917] whitespace-nowrap">
                  {activeNavMeta.label}
                </strong>
                {serviceFocus !== 'ALL' && (activeTab === 'dashboard' || activeTab === 'clients') && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#2F5D50] whitespace-nowrap">
                      {SERVICE_FOCUS_LABELS[serviceFocus]}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {demoNotice && (
                <span role="status" className="hidden md:inline text-xs font-medium text-[#047857]">
                  {demoNotice}
                </span>
              )}
              <button
                type="button"
                disabled={resettingDemo}
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F7] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A87664]" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {resettingDemo ? 'Yükleniyor...' : 'Örnek Merkez Verisi Yükle / Sıfırla'}
                </span>
                <span className="sm:hidden">{resettingDemo ? '...' : 'Demo'}</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                aria-label="Oturumu kapat"
                className="lg:hidden p-2 rounded-lg border border-[#E7E5E4] bg-white text-[#57534E] hover:text-[#B91C1C]"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Bottom padding leaves room for fixed mobile bar + iOS home indicator */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Floating Quick-Add Button */}
      {activeTab !== 'quick-log' && (
        <button
          type="button"
          onClick={() => onSelectTab('quick-log')}
          aria-label="Hızlı işlem kaydı aç"
          className="no-print lg:hidden fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-30 w-12 h-12 rounded-full bg-[#2F5D50] text-white shadow-lg flex items-center justify-center hover:bg-[#244A40] active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {/* Mobile Bottom Navigation Bar (safe-area aware for notched phones) */}
      <nav
        aria-label="Mobil alt menü"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] safe-pb"
      >
        <div className="h-14 grid grid-cols-6 items-center px-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-[#2F5D50]' : 'text-[#57534E]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
