import { Flower2, KeyRound } from 'lucide-react';

interface FirebaseConfigMissingViewProps {
  missingKeys: readonly string[];
}

export function FirebaseConfigMissingView({ missingKeys }: FirebaseConfigMissingViewProps) {
  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-[#1C1917] flex items-center justify-center p-5 sm:p-6">
      <div className="max-w-lg w-full bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-[#2F5D50] text-white flex items-center justify-center shrink-0">
            <Flower2 className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[#1C1917]">
              Ortam Değişkenleri Eksik
            </h1>
            <p className="text-xs text-[#A87664] font-medium">
              StüdyoAsistan · Kurulum Kontrolü
            </p>
          </div>
        </div>

        <p className="text-sm text-[#57534E] leading-relaxed">
          Uygulamanın Firebase Auth, Cloud Firestore ve Storage servislerine bağlanabilmesi için{' '}
          <code className="font-mono text-xs bg-[#FAF9F7] border border-[#E7E5E4] px-1.5 py-0.5 rounded">
            .env.local
          </code>{' '}
          dosyasında aşağıdaki ortam değişkenlerinin tanımlı olması gerekir:
        </p>

        <div className="bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
            <KeyRound className="w-3.5 h-3.5 text-[#2F5D50]" aria-hidden="true" />
            Eksik Anahtarlar
          </div>
          <ul className="space-y-1 font-mono text-xs text-[#B91C1C]">
            {missingKeys.map((key) => (
              <li key={key}>• {key}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#57534E] leading-relaxed">
          Proje kök dizinindeki <code className="font-mono">.env.example</code> şablonunu{' '}
          <code className="font-mono">.env.local</code> olarak kopyalayıp değerleri girdikten sonra
          geliştirme sunucusunu yeniden başlatın.
        </p>
      </div>
    </div>
  );
}
