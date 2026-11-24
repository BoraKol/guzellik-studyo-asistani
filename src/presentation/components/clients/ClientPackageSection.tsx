import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { PAYMENT_LABELS } from '../../../domain/constants/studioLabels';
import { formatTL } from '../../../domain/engines/formatters';
import { getRemainingSessions } from '../../../domain/engines/recallEngine';
import type {
  Client,
  ClientPackage,
  PaymentStatus,
} from '../../../domain/types/studio';
import { createDocumentId } from '../../../infrastructure/firebase/mappers';
import {
  FIELD_LABEL_CLASS,
  INPUT_WHITE_CLASS,
  MONO_INPUT_WHITE_CLASS,
} from '../ui/formStyles';

interface ClientPackageSectionProps {
  client: Client;
  todayIso: string;
  onDecrementSession: (clientId: string) => void;
  onUpdatePayment: (clientId: string, status: PaymentStatus) => void;
  onUpsertPackage: (clientId: string, pkg: ClientPackage) => void;
}

export function ClientPackageSection({
  client,
  todayIso,
  onDecrementSession,
  onUpdatePayment,
  onUpsertPackage,
}: ClientPackageSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgTotal, setPkgTotal] = useState(8);
  const [pkgCompleted, setPkgCompleted] = useState(0);
  const [pkgPayment, setPkgPayment] = useState<PaymentStatus>('ODENDI');
  const [pkgPrice, setPkgPrice] = useState('');

  useEffect(() => {
    setShowForm(false);
  }, [client.id]);

  function handleToggleForm() {
    setShowForm((prev) => {
      const opening = !prev;
      if (opening && client.activePackage) {
        setPkgName(client.activePackage.name);
        setPkgTotal(client.activePackage.totalSessions);
        setPkgCompleted(client.activePackage.completedSessions);
        setPkgPayment(client.activePackage.paymentStatus);
        setPkgPrice(
          client.activePackage.totalPrice ? String(client.activePackage.totalPrice) : ''
        );
      } else if (opening) {
        setPkgName('');
        setPkgTotal(8);
        setPkgCompleted(0);
        setPkgPayment('ODENDI');
        setPkgPrice('');
      }
      return opening;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pkgName.trim()) return;
    const total = Math.max(1, Number(pkgTotal) || 6);
    const completed = Math.min(total, Math.max(0, Number(pkgCompleted) || 0));
    onUpsertPackage(client.id, {
      id: client.activePackage?.id || createDocumentId('pkg'),
      name: pkgName.trim(),
      category: client.primaryCategory,
      totalSessions: total,
      completedSessions: completed,
      paymentStatus: pkgPayment,
      startDate: client.activePackage?.startDate || todayIso,
      totalPrice: pkgPrice.trim() ? Number(pkgPrice) : undefined,
    });
    setShowForm(false);
  }

  const pkg = client.activePackage;
  const remaining = getRemainingSessions(pkg);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1C1917] flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2F5D50]" aria-hidden="true" />
          Aktif Paket &amp; Seans Sayacı
        </h3>
        <button
          type="button"
          onClick={handleToggleForm}
          className="text-xs font-medium text-[#2F5D50] hover:underline whitespace-nowrap"
        >
          {pkg ? 'Paketi Düzenle' : '+ Paket Tanımla'}
        </button>
      </div>

      {pkg ? (
        <div className="bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <p className="text-sm font-semibold text-[#1C1917]">{pkg.name}</p>
              <p className="text-xs text-[#57534E] mt-0.5 font-mono tabular-nums">
                {pkg.completedSessions} / {pkg.totalSessions} Tamamlandı ·{' '}
                <strong className="text-[#2F5D50]">{remaining} Seans Kaldı</strong>
                {pkg.totalPrice ? ` · ${formatTL(pkg.totalPrice)}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <select
                aria-label="Paket ödeme durumu"
                value={pkg.paymentStatus}
                onChange={(e) => onUpdatePayment(client.id, e.target.value as PaymentStatus)}
                className="px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs font-medium border border-[#E7E5E4] rounded-lg bg-white text-[#1C1917]"
              >
                {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {PAYMENT_LABELS[k]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={remaining === 0}
                onClick={() => onDecrementSession(client.id)}
                className="px-3 py-2 sm:py-1.5 rounded-lg bg-[#2F5D50] text-white text-xs font-medium hover:bg-[#244A40] disabled:opacity-45 transition-colors whitespace-nowrap"
              >
                +1 Seans Düş
              </button>
            </div>
          </div>

          <div
            className="h-2.5 w-full rounded-full bg-[#E7E5E4] overflow-hidden"
            role="progressbar"
            aria-valuenow={pkg.completedSessions}
            aria-valuemin={0}
            aria-valuemax={pkg.totalSessions}
            aria-label="Paket tamamlanma durumu"
          >
            <div
              className="h-full bg-[#2F5D50] transition-all duration-200 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((pkg.completedSessions / Math.max(1, pkg.totalSessions)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#57534E]">
          Bu müşteri için tanımlı aktif paket bulunmuyor (seans başı işlem alıyor).
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border border-[#E7E5E4] rounded-xl bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div className="sm:col-span-2">
            <label htmlFor="pkg-name" className={FIELD_LABEL_CLASS}>
              Paket Adı
            </label>
            <input
              id="pkg-name"
              type="text"
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              placeholder="Örn. 8 Seans Tüm Vücut Buz Lazer"
              className={INPUT_WHITE_CLASS}
            />
          </div>
          <div>
            <label htmlFor="pkg-total" className={FIELD_LABEL_CLASS}>
              Toplam Seans
            </label>
            <input
              id="pkg-total"
              type="number"
              min={1}
              max={50}
              value={pkgTotal}
              onChange={(e) => setPkgTotal(Number(e.target.value))}
              className={MONO_INPUT_WHITE_CLASS}
            />
          </div>
          <div>
            <label htmlFor="pkg-done" className={FIELD_LABEL_CLASS}>
              Tamamlanan
            </label>
            <input
              id="pkg-done"
              type="number"
              min={0}
              max={pkgTotal}
              value={pkgCompleted}
              onChange={(e) => setPkgCompleted(Number(e.target.value))}
              className={MONO_INPUT_WHITE_CLASS}
            />
          </div>
          <div>
            <label htmlFor="pkg-pay" className={FIELD_LABEL_CLASS}>
              Ödeme Durumu
            </label>
            <select
              id="pkg-pay"
              value={pkgPayment}
              onChange={(e) => setPkgPayment(e.target.value as PaymentStatus)}
              className={INPUT_WHITE_CLASS}
            >
              {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((k) => (
                <option key={k} value={k}>
                  {PAYMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pkg-price" className={FIELD_LABEL_CLASS}>
              Paket Tutarı (₺)
            </label>
            <input
              id="pkg-price"
              type="number"
              value={pkgPrice}
              onChange={(e) => setPkgPrice(e.target.value)}
              placeholder="14500"
              className={MONO_INPUT_WHITE_CLASS}
            />
          </div>
          <div className="sm:col-span-2 flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-xs text-[#57534E]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2F5D50] text-white text-xs font-medium"
            >
              Paketi Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
