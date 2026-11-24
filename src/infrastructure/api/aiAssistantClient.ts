import type {
  ParseSessionApiResult,
  PolishWhatsAppApiResult,
  StudioTone,
  WhatsAppPurpose,
} from '../../domain/types/studio';

const DEFAULT_TIMEOUT_MS = 20_000;

async function postJson<T>(
  endpoint: string,
  body: Record<string, unknown>,
  fallbackError: string,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(typeof payload.error === 'string' ? payload.error : fallbackError);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin veya manuel devam edin.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

/**
 * Calls server-side /api/ai/parse-session endpoint.
 * Never imports @google/genai or reads GEMINI_API_KEY in the browser.
 */
export function parseTechnicianNoteWithAI(
  noteText: string,
  knownServices: string[],
  knownClientNames: string[],
  signal?: AbortSignal
): Promise<ParseSessionApiResult> {
  return postJson<ParseSessionApiResult>(
    '/api/ai/parse-session',
    { noteText, knownServices, knownClientNames },
    'AI ayrıştırma servisine şu an ulaşılamıyor. Manuel form ile devam edebilirsiniz.',
    signal
  );
}

/**
 * Calls server-side /api/ai/polish-whatsapp endpoint.
 */
export function polishWhatsAppMessageWithAI(
  params: {
    clientName: string;
    serviceName: string;
    studioName: string;
    tone: StudioTone;
    purpose: WhatsAppPurpose;
    extraContext: string;
  },
  signal?: AbortSignal
): Promise<PolishWhatsAppApiResult> {
  return postJson<PolishWhatsAppApiResult>(
    '/api/ai/polish-whatsapp',
    params,
    'AI mesaj taslağı oluşturulamadı. Standart şablonu kullanabilirsiniz.',
    signal
  );
}
