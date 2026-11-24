import { useState } from 'react';
import { sendEmailVerification, signOut, type User } from 'firebase/auth';
import { CheckCircle2, MailCheck, RefreshCw } from 'lucide-react';
import { getFirebaseAuth } from '../../../infrastructure/firebase/client';
import { BrandIcon } from '../common/BrandIcon';

interface EmailVerificationViewProps {
  user: User;
  onVerified: () => void;
}

export function EmailVerificationView({ user, onVerified }: EmailVerificationViewProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCheckVerified() {
    setErrorMsg(null);
    setStatusMsg(null);
    setChecking(true);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (getFirebaseAuth().currentUser?.emailVerified) {
        onVerified();
      } else {
        setErrorMsg(
          'E-posta doğrulaması henüz tamamlanmamış görünüyor. Gelen kutunuzdaki bağlantıya tıkladıktan birkaç saniye sonra tekrar deneyin.'
        );
      }
    } catch {
      setErrorMsg('Doğrulama durumu kontrol edilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setErrorMsg(null);
    setStatusMsg(null);
    setResending(true);
    try {
      await sendEmailVerification(user);
      setStatusMsg('Yeni doğrulama bağlantısını e-posta adresinize gönderdik.');
    } catch {
      setErrorMsg(
        'Kısa süre önce yeni bağlantı gönderildi. Lütfen gelen kutunuzu ve spam klasörünü kontrol edin.'
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-[#1C1917] flex flex-col justify-between p-5 sm:p-6 safe-pt safe-pb">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 gap-3">
        <div className="flex items-center gap-2.5">
          <BrandIcon size="md" />
          <span className="font-display text-lg font-semibold text-[#1C1917] whitespace-nowrap">
            StüdyoAsistan
          </span>
        </div>
        <span className="text-xs font-semibold text-[#A87664] whitespace-nowrap">
          Güzellik Merkezi Paneli
        </span>
      </header>

      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#2F5D50] mx-auto flex items-center justify-center">
            <MailCheck className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1C1917] tracking-tight">
              Son Bir Adım: E-postanızı Doğrulayın
            </h1>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Hesabınızın yalnızca size ait olduğunu onaylamak için{' '}
              <strong className="text-[#1C1917] break-all">{user.email}</strong> adresine bir
              doğrulama bağlantısı gönderdik.
            </p>
            <p className="text-xs text-[#57534E] leading-relaxed">
              E-postanızdaki bağlantıya tıkladıktan sonra aşağıdaki butona dokunarak güzellik merkezi
              panelinize hemen geçebilirsiniz.
            </p>
          </div>

          {statusMsg && (
            <div
              role="status"
              className="text-xs text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 text-left leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleCheckVerified}
              disabled={checking}
              className="w-full py-3 sm:py-2.5 px-4 rounded-xl bg-[#2F5D50] text-white text-sm font-semibold hover:bg-[#244A40] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {checking ? 'Kontrol Ediliyor...' : 'Doğruladım, Panele Geç'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E7E5E4] bg-white text-xs font-medium text-[#1C1917] hover:bg-[#FAF9F7] transition-colors disabled:opacity-60"
            >
              {resending ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
            </button>

            <button
              type="button"
              onClick={() => signOut(getFirebaseAuth())}
              className="w-full py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
            >
              Farklı hesapla giriş yap
            </button>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-[#57534E] py-2">
        StüdyoAsistan · Güzellik &amp; Bakım Merkezleri İçin Akıllı Operasyon Yardımcısı
      </footer>
    </div>
  );
}
