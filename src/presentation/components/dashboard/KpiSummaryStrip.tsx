import { memo } from 'react';

interface KpiSummaryStripProps {
  todayTotal: number;
  todayConfirmed: number;
  tomorrowTotal: number;
  tomorrowPending: number;
  unremindedDueCount: number;
  upcomingWeekCount: number;
  activePackageCount: number;
  totalClientsCount: number;
}

export const KpiSummaryStrip = memo(function KpiSummaryStrip({
  todayTotal,
  todayConfirmed,
  tomorrowTotal,
  tomorrowPending,
  unremindedDueCount,
  upcomingWeekCount,
  activePackageCount,
  totalClientsCount,
}: KpiSummaryStripProps) {
  return (
    <section aria-label="Günün Özeti" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5">
        <p className="text-xs font-medium text-[#57534E]">Bugünkü Randevular</p>
        <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#1C1917] mt-1.5 sm:mt-2">
          {todayTotal}
        </p>
        <p className="text-[11px] sm:text-xs text-[#57534E] mt-1">{todayConfirmed} onaylı</p>
      </div>

      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5">
        <p className="text-xs font-medium text-[#57534E]">Yarın Teyit Bekleyen</p>
        <p
          data-testid="kpi-pending-tomorrow"
          className={`text-2xl sm:text-3xl font-semibold font-mono tabular-nums mt-1.5 sm:mt-2 ${
            tomorrowPending > 0 ? 'text-[#B45309]' : 'text-[#047857]'
          }`}
        >
          {tomorrowPending}
        </p>
        <p className="text-[11px] sm:text-xs text-[#57534E] mt-1">
          Toplam {tomorrowTotal} yarınki randevu
        </p>
      </div>

      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5">
        <p className="text-xs font-medium text-[#57534E]">Geri Çağırma Zamanı</p>
        <p
          data-testid="kpi-recall-due"
          className={`text-2xl sm:text-3xl font-semibold font-mono tabular-nums mt-1.5 sm:mt-2 ${
            unremindedDueCount > 0 ? 'text-[#B91C1C]' : 'text-[#047857]'
          }`}
        >
          {unremindedDueCount}
        </p>
        <p className="text-[11px] sm:text-xs text-[#57534E] mt-1">
          +{upcomingWeekCount} kişi bu hafta yaklaşıyor
        </p>
      </div>

      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5">
        <p className="text-xs font-medium text-[#57534E]">Aktif Paketler</p>
        <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#2F5D50] mt-1.5 sm:mt-2">
          {activePackageCount}
        </p>
        <p className="text-[11px] sm:text-xs text-[#57534E] mt-1">
          Toplam {totalClientsCount} kayıtlı müşteri
        </p>
      </div>
    </section>
  );
});
