import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { StudioRepositoryError } from '../../../infrastructure/firebase/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  friendlyMessage: string;
}

function resolveFriendlyError(error: Error): string {
  if (error instanceof StudioRepositoryError) {
    return error.message;
  }
  if (error.message.includes('Missing or insufficient permissions')) {
    return 'Oturum doğrulamanız yenilenmeli. E-posta adresinizin doğrulandığından emin olup tekrar giriş yapabilirsiniz.';
  }
  if (error.message.includes('Quota exceeded')) {
    return 'Günlük kullanım limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
  }
  return 'Bağlantı sırasında geçici bir sorun oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, friendlyMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      friendlyMessage: resolveFriendlyError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('StüdyoAsistan ErrorBoundary:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[#FAF9F7] flex items-center justify-center p-5 sm:p-6">
          <div className="max-w-md w-full bg-white border border-[#E7E5E4] rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3 text-[#B91C1C]">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h1 className="text-lg font-semibold text-[#1C1917]">
                  Bağlantı / Yetki Hatası
                </h1>
                <p className="text-sm text-[#57534E] mt-1 leading-relaxed">
                  {this.state.friendlyMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2F5D50] text-white text-sm font-medium hover:bg-[#244A40] transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
