import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  CalendarCheck2,
  Eye,
  EyeOff,
  HeartHandshake,
  Instagram,
  Mail,
} from 'lucide-react';
import {
  getFirebaseAuth,
  googleProvider,
} from '../../../infrastructure/firebase/client';
import { BrandIcon } from '../common/BrandIcon';

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'RESET';

const VALUE_PROPS = [
  {
    icon: CalendarCheck2,
    iconColor: 'text-[#2F5D50]',
    title: 'Boş Koltuklara ve Unutulan Randevulara Son',
    description:
      'Bakım döngüsü dolan danışanlarınızı ve yarınki randevu teyitlerini sizin yerinize sıraya alır, tek dokunuşla WhatsApp üzerinden nazikçe hatırlatır.',
  },
  {
    icon: Instagram,
    iconColor: 'text-[#A87664]',
    title: '“Fiyat Nedir?” Mesajlarını Hazır Randevuya Çevirin',
    description:
      'Instagram biyografinize özel fiyat ve süre hesaplayıcı linkinizle danışanlar istedikleri işlemleri seçip doğrudan randevu talebi göndersin.',
  },
  {
    icon: HeartHandshake,
    iconColor: 'text-[#2F5D50]',
    title: 'Kağıt Deftere Veda, Kusursuz Danışan Takibi',
    description:
      'Aktif seans paketleri, cilt ve tırnak işlem detayları, öncesi/sonrası galerisi ve bakım kartları her an telefonunuzda ve resepsiyonunuzda elinizin altında.',
  },
] as const;

function mapAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresiyle kayıtlı bir hesap zaten bulunuyor. Giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.';
    case 'auth/invalid-email':
      return 'Lütfen geçerli bir e-posta adresi girin.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.';
    case 'auth/popup-closed-by-user':
      return 'Google giriş penceresi kapatıldı. Hazır olduğunuzda tekrar deneyebilirsiniz.';
    case 'auth/popup-blocked':
      return 'Tarayıcı açılır pencereyi engelledi. İzin verip tekrar deneyin veya e-posta ile devam edin.';
    case 'auth/operation-not-allowed':
      return 'E-posta ile kayıt seçeneği şu an henüz aktif değil. Google ile hemen devam edebilirsiniz.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip tekrar deneyin.';
    default:
      return 'İşlem sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}

export function AuthGateView() {
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [studioOwnerName, setStudioOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  function switchMode(next: AuthMode) {
    setMode(next);
    setAuthError(null);
    setInfoNotice(null);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setInfoNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError('Lütfen e-posta adresinizi girin.');
      return;
    }

    const auth = getFirebaseAuth();

    if (mode === 'RESET') {
      setSubmitting(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setInfoNotice(
          'Şifre yenileme bağlantısını e-posta adresinize gönderdik. Gelen kutunuzu kontrol edebilirsiniz.'
        );
      } catch (err) {
        setAuthError(mapAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setAuthError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'SIGN_IN') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        if (studioOwnerName.trim()) {
          await updateProfile(cred.user, {
            displayName: studioOwnerName.trim().slice(0, 80),
          });
        }
        await sendEmailVerification(cred.user);
      }
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setAuthError(null);
    setInfoNotice(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-[#1C1917] flex flex-col justify-between safe-pt safe-pb">
      <header className="w-full border-b border-[#E7E5E4] bg-[#FAF9F7]/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandIcon size="responsive" />
            <div className="min-w-0 leading-tight">
              <span className="block font-display text-base sm:text-lg font-semibold text-[#1C1917] whitespace-nowrap">
                StüdyoAsistan
              </span>
              <span className="block text-[11px] font-semibold text-[#A87664] whitespace-nowrap">
                Güzellik Merkezi Paneli
              </span>
            </div>
          </div>

          <p className="hidden md:block text-xs font-medium text-[#57534E] whitespace-nowrap">
            Lazer Epilasyon · Cilt Bakımı · Protez Tırnak &amp; Kaş/Kirpik
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Mobile-first: place auth card immediately accessible on small viewports while keeping desktop left/right split */}
        <section className="order-2 lg:order-1 lg:col-span-6 space-y-5 sm:space-y-6">
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#A87664]">
              MODERN GÜZELLİK MERKEZLERİ İÇİN TASARLANDI
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C1917] tracking-tight leading-[1.15]">
              Güzellik Merkezinizin Tüm Operasyonu Tek Ekranda.
            </h1>
            <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-xl">
              Instagram mesajlarında kaybolmadan fiyat paylaşın, seans ve paketlerinizi düzenli takip edin, zamanı gelen danışanlarınızı tek dokunuşla yeniden randevuya davet edin.
            </p>
          </div>

          <div className="space-y-4 pt-3 border-t border-[#E7E5E4]">
            {VALUE_PROPS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <span
                    className={`w-9 h-9 rounded-lg bg-white border border-[#E7E5E4] ${item.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1C1917]">{item.title}</h2>
                    <p className="text-xs sm:text-sm text-[#57534E] mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="order-1 lg:order-2 lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 sm:p-8 space-y-5 shadow-xs">
            {mode !== 'RESET' ? (
              <div
                className="grid grid-cols-2 p-1 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4]"
                role="tablist"
                aria-label="Hesap işlemleri"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'SIGN_IN'}
                  onClick={() => switchMode('SIGN_IN')}
                  className={`py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'SIGN_IN'
                      ? 'bg-[#2F5D50] text-white'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'SIGN_UP'}
                  onClick={() => switchMode('SIGN_UP')}
                  className={`py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'SIGN_UP'
                      ? 'bg-[#2F5D50] text-white'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  Ücretsiz Kaydol
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#1C1917]">Şifrenizi Yenileyin</h2>
                <p className="text-xs text-[#57534E]">
                  Kayıtlı e-posta adresinizi yazın, yeni şifre belirleme bağlantısını hemen gönderelim.
                </p>
              </div>
            )}

            {mode !== 'RESET' && (
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#1C1917]">
                  {mode === 'SIGN_IN' ? 'Merkezinize Hoş Geldiniz' : 'Dakikalar İçinde Başlayın'}
                </h2>
                <p className="text-xs text-[#57534E]">
                  {mode === 'SIGN_IN'
                    ? 'E-posta adresiniz veya Google hesabınızla panelinize giriş yapın.'
                    : 'Güzellik merkeziniz için kendi hesabınızı oluşturun, hemen kullanmaya başlayın.'}
                </p>
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 leading-relaxed"
              >
                {authError}
              </div>
            )}

            {infoNotice && (
              <div
                role="status"
                className="text-xs text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-3.5 py-2.5 leading-relaxed"
              >
                {infoNotice}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'SIGN_UP' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-medium text-[#57534E] mb-1.5"
                  >
                    Adınız veya Merkez Adı
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="organization"
                    value={studioOwnerName}
                    onChange={(e) => setStudioOwnerName(e.target.value)}
                    placeholder="Örn. Lumina Güzellik Merkezi"
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-[#E7E5E4] rounded-xl bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50] transition-colors"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-[#57534E] mb-1.5"
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@guzellikmerkezi.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm border border-[#E7E5E4] rounded-xl bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50] transition-colors"
                  />
                </div>
              </div>

              {mode !== 'RESET' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-medium text-[#57534E]"
                    >
                      Şifre
                    </label>
                    {mode === 'SIGN_IN' && (
                      <button
                        type="button"
                        onClick={() => switchMode('RESET')}
                        className="text-xs font-medium text-[#2F5D50] hover:underline"
                      >
                        Şifremi unuttum
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'SIGN_IN' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'SIGN_UP' ? 'En az 6 karakter' : '••••••••'}
                      className="w-full pl-3.5 pr-11 py-2.5 text-base sm:text-sm border border-[#E7E5E4] rounded-xl bg-[#FAF9F7] focus:bg-white focus:outline-none focus:border-[#2F5D50] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#1C1917] p-1.5"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full py-3 sm:py-2.5 px-4 rounded-xl bg-[#2F5D50] text-white text-sm font-semibold hover:bg-[#244A40] transition-colors disabled:opacity-60"
              >
                {submitting
                  ? 'İşleniyor...'
                  : mode === 'SIGN_IN'
                    ? 'Panele Giriş Yap'
                    : mode === 'SIGN_UP'
                      ? 'Hesabımı Oluştur'
                      : 'Sıfırlama Bağlantısı Gönder'}
              </button>

              {mode === 'RESET' && (
                <button
                  type="button"
                  onClick={() => switchMode('SIGN_IN')}
                  className="w-full py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
                >
                  Giriş ekranına dön
                </button>
              )}
            </form>

            {mode !== 'RESET' && (
              <>
                <div className="relative flex items-center py-0.5">
                  <div className="flex-1 border-t border-[#E7E5E4]" />
                  <span className="px-3 text-[11px] font-medium text-[#57534E]">veya</span>
                  <div className="flex-1 border-t border-[#E7E5E4]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || submitting}
                  className="w-full py-3 sm:py-2.5 px-4 rounded-xl border border-[#E7E5E4] bg-white text-[#1C1917] text-sm font-medium hover:bg-[#FAF9F7] transition-colors disabled:opacity-60 flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Bağlanıyor...' : 'Google ile Devam Et'}</span>
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-5 text-center text-xs text-[#57534E]">
        StüdyoAsistan · Güzellik &amp; Bakım Merkezleri İçin Akıllı Operasyon Yardımcısı
      </footer>
    </div>
  );
}
